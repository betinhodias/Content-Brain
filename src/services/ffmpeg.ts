import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface CutVideoOptions {
  rawVideoUrl: string;
  startTime: number;      // In seconds (e.g. 10.5)
  endTime: number;        // In seconds (e.g. 25.3)
  pipelineId: string;
  clientId: string;
  agencyId: string;
}

/**
 * Downloads a raw video file, cuts it precisely using keyframe-aligned FFmpeg,
 * uploads the result to Supabase Storage, and cleans up all temporary local files.
 */
export async function cutVideo(options: CutVideoOptions): Promise<{ storagePath: string; publicUrl: string }> {
  const { rawVideoUrl, startTime, endTime, pipelineId, clientId, agencyId } = options;

  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `raw-${pipelineId}-${Date.now()}.mp4`);
  const outputPath = path.join(tempDir, `cut-${pipelineId}-${Date.now()}.mp4`);

  try {
    console.log(`[FFmpeg] Downloading raw video from ${rawVideoUrl}...`);
    const response = await fetch(rawVideoUrl);
    if (!response.ok || !response.body) {
      throw new Error(`Failed to download raw video: ${response.statusText}`);
    }
    
    // Stream directly to disk to prevent OOM on large videos (Hetzner VPS safety)
    const { Readable } = await import('stream');
    const { pipeline } = await import('stream/promises');
    const { createWriteStream } = await import('fs');
    await pipeline(Readable.fromWeb(response.body as any), createWriteStream(inputPath));

    console.log(`[FFmpeg] Cutting video: ${startTime}s to ${endTime}s...`);
    // -avoid_negative_ts make_zero forces timestamp alignment. Re-encoding ensures sample-accurate cuts.
    const duration = endTime - startTime;
    const command = `ffmpeg -ss ${startTime} -i "${inputPath}" -t ${duration} -c:v libx264 -c:a aac -pix_fmt yuv420p -avoid_negative_ts make_zero -y "${outputPath}"`;

    await execAsync(command);
    console.log(`[FFmpeg] Successfully cut video to: ${outputPath}`);

    // Read cut video and upload as buffer (avoids 133% base64 memory bloat)
    const videoBuffer = await fs.readFile(outputPath);
    const filename = `clip-${startTime}-${endTime}-${Date.now()}.mp4`;

    console.log(`[FFmpeg] Uploading cut video to Supabase Storage...`);
    const { saveBufferToStorage } = await import('./freepik.js');
    const savedAsset = await saveBufferToStorage(
      videoBuffer,
      agencyId,
      clientId,
      pipelineId,
      filename,
      undefined, // Default bucket
      'video/mp4'
    );

    return {
      storagePath: savedAsset.storagePath,
      publicUrl: savedAsset.publicUrl,
    };

  } finally {
    // Cleanup local temp files aggressively
    await fs.unlink(inputPath).catch(() => null);
    await fs.unlink(outputPath).catch(() => null);
    console.log(`[FFmpeg] Purged temporary files from VPS local disk.`);
  }
}
