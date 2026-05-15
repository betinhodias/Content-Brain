// src/agents/motion-agent.ts
// Motion Agent — GSAP manifest generation via LLM + Remotion headless rendering
import { supabaseAdmin } from '../services/supabase.js';
import { generateMotionManifest } from '../prompts/motion-prompt.js';
import { saveImageToStorage } from '../services/freepik.js';
import type { ContentType, CopyOutput, GSAPManifest } from '../types/index.js';

export interface MotionAgentInput {
  pipelineId: string;
  clientId: string;
  agencyId: string;
  contentType: ContentType;
  copyOutput: CopyOutput;
  imageAssetUrls?: string[];
  brandTone?: string;
  brandColors?: string;
}

export interface MotionAgentResult {
  pipelineId: string;
  manifest: GSAPManifest;
  assetId?: string;        // Populated if render completes
  renderSkipped: boolean;  // True if Remotion not available in this environment
  renderReason?: string;
}

/**
 * Checks if Remotion/ffmpeg are available for headless rendering.
 */
async function isRenderEnvironmentAvailable(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process');
    execSync('ffmpeg -version', { stdio: 'ignore' });
    // Try to import remotion renderer
    await import('@remotion/renderer');
    return true;
  } catch {
    return false;
  }
}

export async function runMotionAgent(input: MotionAgentInput): Promise<MotionAgentResult> {
  const {
    pipelineId,
    clientId,
    agencyId,
    contentType,
    copyOutput,
    imageAssetUrls,
    brandTone,
    brandColors,
  } = input;

  // =====================
  // 1. Generate GSAP manifest via LLM
  // =====================
  const manifest = await generateMotionManifest({
    copyOutput: {
      hook: copyOutput.hook,
      body: copyOutput.body,
      cta: copyOutput.cta,
      slides: copyOutput.slides,
    },
    contentType,
    brandTone,
    brandColors,
    imageAssetUrls,
  });

  console.log(`[MotionAgent] Manifest generated: ${manifest.layers.length} layers, ${manifest.duration}s`);

  // =====================
  // 2. Save manifest to pipeline
  // =====================
  await supabaseAdmin
    .from('pipelines')
    .update({
      motion_output: {
        manifest,
        assetIds: [],
        status: 'manifest_ready',
      },
    })
    .eq('id', pipelineId);

  // =====================
  // 3. Attempt Remotion render (environment-dependent)
  // =====================
  const canRender = await isRenderEnvironmentAvailable();

  if (!canRender) {
    console.warn('[MotionAgent] Remotion/ffmpeg not available — manifest saved, render skipped');
    return {
      pipelineId,
      manifest,
      renderSkipped: true,
      renderReason: 'Remotion renderer not available in this environment. Deploy to Hetzner VPS and run: pnpm remotion:render',
    };
  }

  // =====================
  // 4. Headless render via Remotion
  // =====================
  try {
    const { renderMedia, selectComposition } = await import('@remotion/renderer');
    const path = await import('path');
    const os = await import('os');

    const outputPath = path.join(os.tmpdir(), `creative-brain-${pipelineId}-${Date.now()}.mp4`);
    const bundlePath = path.resolve('./src/remotion/bundle');

    // Select the composition based on content type
    const compositionId = contentType === 'story' ? 'StoryComposition' : 'ReelComposition';

    const compositions = await selectComposition({
      serveUrl: bundlePath,
      id: compositionId,
      inputProps: { manifest, copyOutput },
    });

    await renderMedia({
      composition: compositions,
      serveUrl: bundlePath,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { manifest, copyOutput },
    });

    // Upload rendered video to storage
    const fs = await import('fs/promises');
    const videoBuffer = await fs.readFile(outputPath);
    const base64Video = videoBuffer.toString('base64');

    const filename = `motion-${Date.now()}.mp4`;
    const savedAsset = await saveImageToStorage(
      base64Video,
      agencyId,
      clientId,
      pipelineId,
      filename.replace('.mp4', '.jpg')  // saveImageToStorage handles buffer
    );

    // Create asset record
    const { data: asset } = await supabaseAdmin
      .from('assets')
      .insert({
        pipeline_id: pipelineId,
        client_id: clientId,
        agency_id: agencyId,
        asset_type: 'video',
        storage_path: savedAsset.storagePath,
        mime_type: 'video/mp4',
        size_bytes: videoBuffer.length,
        width: manifest.resolution.width,
        height: manifest.resolution.height,
        duration_ms: Math.round(manifest.duration * 1000),
        metadata: { manifest, publicUrl: savedAsset.publicUrl },
      })
      .select('id')
      .single();

    // Update motion output with asset
    await supabaseAdmin
      .from('pipelines')
      .update({
        motion_output: {
          manifest,
          assetIds: asset ? [asset.id] : [],
          status: 'rendered',
          publicUrl: savedAsset.publicUrl,
        },
      })
      .eq('id', pipelineId);

    // Cleanup temp file
    await fs.unlink(outputPath).catch(() => null);

    return {
      pipelineId,
      manifest,
      assetId: asset?.id,
      renderSkipped: false,
    };

  } catch (renderError) {
    const msg = renderError instanceof Error ? renderError.message : String(renderError);
    console.error('[MotionAgent] Render failed:', renderError);

    return {
      pipelineId,
      manifest,
      renderSkipped: true,
      renderReason: `Render failed: ${msg}. Manifest is saved and can be rendered separately.`,
    };
  }
}
