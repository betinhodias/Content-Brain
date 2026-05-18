// src/agents/thumb-agent.ts
// Thumbnail Agent — specialized for high-CTR cover images
// Uses the ThumbPromptSystem: psychology-driven, click-rate-optimized

import { supabaseAdmin } from '../services/supabase.js';
import { generateImage, saveImageToStorage } from '../services/freepik.js';
import { generateThumbPrompt } from '../prompts/visual-prompt.js';
import type { CopyOutput } from '../types/index.js';

export interface ThumbAgentInput {
  pipelineId: string;
  clientId: string;
  agencyId: string;
  copyOutput: CopyOutput;
  brandContext?: string;
  clientName?: string;
  industry?: string;
  freepikApiKey?: string;
}

export interface ThumbAgentResult {
  pipelineId: string;
  assetId: string;
  publicUrl: string;
  concept: string;
  expressionNote: string;
}

export async function runThumbAgent(input: ThumbAgentInput): Promise<ThumbAgentResult> {
  const {
    pipelineId,
    clientId,
    agencyId,
    copyOutput,
    brandContext,
    clientName,
    industry,
    freepikApiKey,
  } = input;

  // =====================
  // 1. Generate thumbnail-optimized prompt
  // =====================
  const thumbPrompt = await generateThumbPrompt({
    hook: copyOutput.hook,
    brandContext,
    clientName,
    industry,
  });

  console.log(`[ThumbAgent] Concept: ${thumbPrompt.concept}`);
  console.log(`[ThumbAgent] Expression: ${thumbPrompt.expressionNote}`);

  // =====================
  // 2. Generate image via Freepik
  // =====================
  const freepikResult = await generateImage({
    positivePrompt: thumbPrompt.positivePrompt,
    negativePrompt: thumbPrompt.negativePrompt,
    aspectRatio: '16:9',
    apiKey: freepikApiKey,
  });

  if (freepikResult.hasNsfw) {
    throw new Error('Thumbnail generation returned NSFW content — prompt needs adjustment');
  }

  // =====================
  // 3. Save to Storage
  // =====================
  const filename = `thumb-${Date.now()}.jpg`;
  const savedAsset = await saveImageToStorage(
    freepikResult.base64,
    agencyId,
    clientId,
    pipelineId,
    filename
  );

  // =====================
  // 4. Create asset record
  // =====================
  const { data: asset } = await supabaseAdmin
    .from('assets')
    .insert({
      pipeline_id: pipelineId,
      client_id: clientId,
      agency_id: agencyId,
      asset_type: 'thumb',
      storage_path: savedAsset.storagePath,
      mime_type: 'image/jpeg',
      size_bytes: savedAsset.sizeBytes,
      width: freepikResult.width,
      height: freepikResult.height,
      metadata: {
        seed: freepikResult.seed,
        concept: thumbPrompt.concept,
        expressionNote: thumbPrompt.expressionNote,
        positivePrompt: thumbPrompt.positivePrompt,
        negativePrompt: thumbPrompt.negativePrompt,
        publicUrl: savedAsset.publicUrl,
      },
    })
    .select('id')
    .single();

  if (!asset) throw new Error('Failed to create thumbnail asset record');

  // =====================
  // 5. Update pipeline
  // =====================
  await supabaseAdmin
    .from('pipelines')
    .update({
      status: 'completed', // Stop frontend polling
      thumb_output: {
        prompt: thumbPrompt.positivePrompt,
        assetId: asset.id,
        concept: thumbPrompt.concept,
        expressionNote: thumbPrompt.expressionNote,
        publicUrl: savedAsset.publicUrl,
      },
    })
    .eq('id', pipelineId);

  return {
    pipelineId,
    assetId: asset.id,
    publicUrl: savedAsset.publicUrl,
    concept: thumbPrompt.concept,
    expressionNote: thumbPrompt.expressionNote,
  };
}
