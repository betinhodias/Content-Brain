// src/services/freepik.ts
// Freepik API v1 client — validated in Phase 0 spike
// Schema confirmed: POST /v1/ai/text-to-image → { data: [{ base64, has_nsfw }], meta: {...} }

import { supabaseAdmin } from './supabase.js';

const FREEPIK_API_URL = process.env.FREEPIK_API_URL ?? 'https://api.freepik.com/v1';
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

if (!FREEPIK_API_KEY) {
  console.warn('[Freepik] FREEPIK_API_KEY not set — image generation will fail');
}

export type FreepikAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '4:5' | '5:4';

export interface FreepikGenerateOptions {
  positivePrompt: string;
  negativePrompt?: string;
  aspectRatio?: FreepikAspectRatio;
  apiKey?: string;  // Per-agency override
}

export interface FreepikResult {
  base64: string;
  hasNsfw: boolean;
  width: number;
  height: number;
  seed: number;
  inferenceSteps: number;
}

// Map our internal aspect ratio format to Freepik's format
const ASPECT_RATIO_MAP: Record<string, FreepikAspectRatio> = {
  '1:1': '1:1',
  '9:16': '9:16',
  '16:9': '16:9',
  '4:5': '4:5',
  '4:3': '4:3',
};

/**
 * Generate an image via Freepik API with retry and backoff.
 * Returns raw base64 data.
 */
export async function generateImage(options: FreepikGenerateOptions): Promise<FreepikResult> {
  const { positivePrompt, negativePrompt, aspectRatio = '1:1', apiKey } = options;
  const key = apiKey ?? FREEPIK_API_KEY;

  if (!key) throw new Error('Freepik API key not configured');

  const freepikAspectRatio = ASPECT_RATIO_MAP[aspectRatio] ?? '1:1';

  const body: Record<string, unknown> = {
    prompt: positivePrompt,
    aspect_ratio: freepikAspectRatio,
  };

  if (negativePrompt) {
    body.negative_prompt = negativePrompt;
  }

  // Retry with exponential backoff
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      console.warn(`[Freepik] Retry attempt ${attempt} after ${delay}ms`);
    }

    try {
      const response = await fetch(`${FREEPIK_API_URL}/ai/text-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-freepik-api-key': key,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),  // 30s timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown error');
        if (response.status === 429) {
          lastError = new Error(`Freepik rate limited (429): ${errorText}`);
          continue;  // Retry
        }
        throw new Error(`Freepik API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        data: Array<{ base64: string; has_nsfw: boolean }>;
        meta: { seed: number; image: { width: number; height: number }; num_inference_steps: number };
      };

      if (!data.data?.[0]) {
        throw new Error('Freepik returned empty data array');
      }

      const image = data.data[0];
      return {
        base64: image.base64,
        hasNsfw: image.has_nsfw,
        width: data.meta.image.width,
        height: data.meta.image.height,
        seed: data.meta.seed,
        inferenceSteps: data.meta.num_inference_steps,
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1 && !(lastError.message.includes('429'))) {
        // Non-rate-limit errors: retry with backoff
        continue;
      }
    }
  }

  throw lastError ?? new Error('Freepik: max retries exceeded');
}

// ========================
// Storage Integration
// ========================

export interface SavedAsset {
  storagePath: string;
  publicUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
}

/**
 * Saves a Buffer to Supabase Storage.
 * Path: /{agencyId}/{clientId}/{pipelineId}/{filename}
 */
export async function saveBufferToStorage(
  buffer: Buffer,
  agencyId: string,
  clientId: string,
  pipelineId: string,
  filename: string,
  bucket: string = process.env.STORAGE_BUCKET ?? 'creative-brain-assets',
  contentType: string = 'image/jpeg'
): Promise<SavedAsset> {
  const storagePath = `${agencyId}/${clientId}/${pipelineId}/${filename}`;

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
    sizeBytes: buffer.length,
    width: 0,  // Will be filled from FreepikResult
    height: 0,
  };
}

/**
 * Converts base64 to Buffer and saves to Supabase Storage.
 */
export async function saveImageToStorage(
  base64: string,
  agencyId: string,
  clientId: string,
  pipelineId: string,
  filename: string,
  bucket?: string,
  contentType?: string
): Promise<SavedAsset> {
  const buffer = Buffer.from(base64, 'base64');
  return saveBufferToStorage(buffer, agencyId, clientId, pipelineId, filename, bucket, contentType);
}
