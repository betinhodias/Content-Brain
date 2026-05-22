// src/agents/visual-agent.ts
// Visual Agent — orchestrates elite prompt generation + Freepik API + asset storage
import { supabaseAdmin } from '../services/supabase.js';
import { generateImage, saveImageToStorage } from '../services/freepik.js';
import {
  generateVisualPrompt,
  type VisualPromptInput,
} from '../prompts/visual-prompt.js';
import type { ContentType, CopyOutput } from '../types/index.js';

export interface VisualAgentInput {
  pipelineId: string;
  clientId: string;
  agencyId: string;
  contentType: ContentType;
  copyOutput: CopyOutput;
  brandContext?: string;
  clientName?: string;
  industry?: string;
  freepikApiKey?: string;   // Agency's Freepik key (override)
  imageCount?: number;       // How many images to generate (default: 1)
}

export interface VisualAgentResult {
  pipelineId: string;
  assetIds: string[];
  generatedPrompt: string;
  concept: string;
  styleNote: string;
}

export async function runVisualAgent(input: VisualAgentInput): Promise<VisualAgentResult> {
  const {
    pipelineId,
    clientId,
    agencyId,
    contentType,
    copyOutput,
    brandContext,
    clientName,
    industry,
    freepikApiKey,
    imageCount = 1,
  } = input;

  // =====================
  // 1. Generate elite visual prompt (LLM → 8-dimension photography brief)
  // =====================
  const visualPromptInput: VisualPromptInput = {
    hook: copyOutput.hook,
    contentType,
    brandContext,
    clientName,
    industry,
    tone: undefined,
  };

  const visualPromptOutput = await generateVisualPrompt(visualPromptInput);

  console.log(`[VisualAgent] Concept: ${visualPromptOutput.concept}`);
  console.log(`[VisualAgent] Style: ${visualPromptOutput.styleNote}`);

  // =====================
  // 2. Generate images via Freepik (supports multiple variations)
  // =====================
  const assetIds: string[] = [];
  const errors: string[] = [];
  let firstPublicUrl: string | undefined;

  for (let i = 0; i < imageCount; i++) {
    try {
      // Add slight prompt variation for multiple images to avoid duplicates
      const promptVariation = imageCount > 1
        ? `${visualPromptOutput.positivePrompt}, variation ${i + 1}`
        : visualPromptOutput.positivePrompt;

      const freepikResult = await generateImage({
        positivePrompt: promptVariation,
        negativePrompt: visualPromptOutput.negativePrompt,
        aspectRatio: visualPromptOutput.aspectRatio as '1:1' | '9:16' | '16:9' | '4:5',
        apiKey: freepikApiKey,
      });

      if (freepikResult.hasNsfw) {
        console.warn(`[VisualAgent] NSFW content detected for image ${i + 1} — skipping`);
        continue;
      }

      // =====================
      // 3. Save to Supabase Storage (tenant-isolated path)
      // =====================
      const filename = `visual-${i + 1}-${Date.now()}.jpg`;
      const savedAsset = await saveImageToStorage(
        freepikResult.base64,
        agencyId,
        clientId,
        pipelineId,
        filename
      );

      if (!firstPublicUrl) {
        firstPublicUrl = savedAsset.publicUrl;
      }

      // =====================
      // 4. Create asset record in database
      // =====================
      const { data: asset } = await supabaseAdmin
        .from('assets')
        .insert({
          pipeline_id: pipelineId,
          client_id: clientId,
          agency_id: agencyId,
          asset_type: 'image',
          storage_path: savedAsset.storagePath,
          mime_type: 'image/jpeg',
          size_bytes: savedAsset.sizeBytes,
          width: freepikResult.width,
          height: freepikResult.height,
          metadata: {
            seed: freepikResult.seed,
            inferenceSteps: freepikResult.inferenceSteps,
            concept: visualPromptOutput.concept,
            positivePrompt: visualPromptOutput.positivePrompt,
            negativePrompt: visualPromptOutput.negativePrompt,
            styleNote: visualPromptOutput.styleNote,
            publicUrl: savedAsset.publicUrl,
          },
        })
        .select('id')
        .single();

      if (asset) {
        assetIds.push(asset.id);
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Image ${i + 1}: ${msg}`);
      console.error(`[VisualAgent] Image ${i + 1} failed:`, error);
    }
  }

  if (assetIds.length === 0 && errors.length > 0) {
    throw new Error(`Visual agent produced no assets. Errors: ${errors.join('; ')}`);
  }

  // =====================
  // 5. Update pipeline with visual output
  // =====================
  await supabaseAdmin
    .from('pipelines')
    .update({
      status: 'completed', // Stop frontend polling
      visual_output: {
        publicUrl: firstPublicUrl,
        prompt: visualPromptOutput.positivePrompt,
        negativePrompt: visualPromptOutput.negativePrompt,
        assetIds,
        concept: visualPromptOutput.concept,
        styleNote: visualPromptOutput.styleNote,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
    .eq('id', pipelineId);

  return {
    pipelineId,
    assetIds,
    generatedPrompt: visualPromptOutput.positivePrompt,
    concept: visualPromptOutput.concept,
    styleNote: visualPromptOutput.styleNote,
  };
}
