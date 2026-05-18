// src/agents/motion-agent.ts
// Motion Agent — Hybrid curation (FFmpeg) + GSAP manifest generation via LLM + Remotion parallel rendering
import { supabaseAdmin } from '../services/supabase.js';
import { generateMotionManifest } from '../prompts/motion-prompt.js';
import { saveImageToStorage } from '../services/freepik.js';
import { cutVideo } from '../services/ffmpeg.js';
import type { ContentType, CopyOutput, GSAPManifest, GSAPLayer } from '../types/index.js';

export interface MotionAgentInput {
  pipelineId: string;
  clientId: string;
  agencyId: string;
  contentType: ContentType;
  copyOutput: CopyOutput;
  imageAssetUrls?: string[];
  brandTone?: string;
  brandColors?: string;
  rawVideoUrl?: string;     // Source client raw video
  videoStart?: number;      // Trim start (seconds)
  videoEnd?: number;        // Trim end (seconds)
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
    await import('@remotion/renderer');
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Asynchronous Queue to Throttle Parallel Remotion Renders
// ============================================================
class RenderQueue {
  private active = 0;
  private queue: (() => Promise<void>)[] = [];

  constructor(private maxConcurrency = 2) {}

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        this.active++;
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.active--;
          this.next();
        }
      };

      this.queue.push(run);
      this.next();
    });
  }

  private next() {
    if (this.active < this.maxConcurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) task();
    }
  }
}

const renderQueue = new RenderQueue(2); // Max 2 concurrent renders globally

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
    rawVideoUrl,
    videoStart,
    videoEnd,
  } = input;

  // =====================
  // 1. Process Video Curation (FFmpeg)
  // =====================
  let cutVideoUrl: string | undefined;

  if (rawVideoUrl && videoStart !== undefined && videoEnd !== undefined) {
    try {
      console.log(`[MotionAgent] Starting raw video curation for pipeline ${pipelineId}...`);
      const cutResult = await cutVideo({
        rawVideoUrl,
        startTime: videoStart,
        endTime: videoEnd,
        pipelineId,
        clientId,
        agencyId,
      });
      cutVideoUrl = cutResult.publicUrl;
      console.log(`[MotionAgent] Video successfully curated: ${cutVideoUrl}`);
    } catch (err) {
      console.error('[MotionAgent] Preprocessing/cutting video failed, falling back to graphics-only:', err);
    }
  }

  // =====================
  // 2. Generate GSAP manifest via LLM
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

  // Inject the curated video clip as the background layer under the typography overlays
  if (cutVideoUrl) {
    const videoLayer: GSAPLayer = {
      id: `bg-video-${Date.now()}`,
      type: 'video',
      assetUrl: cutVideoUrl,
      animation: {
        ease: 'linear',
        duration: manifest.duration,
        opacity: 1,
        scale: 1,
        delay: 0,
      },
    };
    manifest.layers.unshift(videoLayer);
  }

  console.log(`[MotionAgent] Manifest generated: ${manifest.layers.length} layers, ${manifest.duration}s`);

  // =====================
  // 3. Save manifest to pipeline
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
  // 4. Attempt Remotion render (environment-dependent)
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
  // 5. Headless render via Queue & Remotion Parallel Workers
  // =====================
  try {
    return await renderQueue.add(async () => {
      console.log(`[MotionAgent] Pipeline ${pipelineId} entered render queue...`);
      const { renderMedia, selectComposition } = await import('@remotion/renderer');
      const path = await import('path');
      const os = await import('os');

      const outputPath = path.join(os.tmpdir(), `creative-brain-${pipelineId}-${Date.now()}.mp4`);
      console.log(`[MotionAgent] Bundling Remotion composition...`);
      const { bundle } = await import('@remotion/bundler');
      const bundlePath = await bundle({
        entryPoint: path.resolve('./src/remotion/Root.tsx'),
      });

      const compositionId = contentType === 'story' ? 'StoryComposition' : 'ReelComposition';

      const compositions = await selectComposition({
        serveUrl: bundlePath,
        id: compositionId,
        inputProps: { manifest, copyOutput },
      });

      console.log(`[MotionAgent] Triggering Remotion render with concurrency = 6 (8 vCPUs optimization)...`);
      await renderMedia({
        composition: compositions,
        serveUrl: bundlePath,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: { manifest, copyOutput },
        concurrency: 6, // Optimizes parallel Chromium workers for Hetzner CX43 server
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
        filename,
        undefined,
        'video/mp4'
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
          status: 'completed', // Stop frontend polling
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
      console.log(`[MotionAgent] Render finished and temporary MP4 cleaned up.`);

      return {
        pipelineId,
        manifest,
        assetId: asset?.id,
        renderSkipped: false,
      };
    });

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
