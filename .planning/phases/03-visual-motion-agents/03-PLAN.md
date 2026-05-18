# Phase 3: Visual + Motion + Thumb Agents - Plan

**Status:** Completed

## Objective
Integrate Freepik for image generation, Remotion + GSAP for video compositions, and orchestrate a hybrid video curation & cutting pipeline (FFmpeg preprocessing + Remotion parallel rendering) based on the Copy Agent output, optimized for our Hetzner CX43 server (8 vCPUs, 16GB RAM).

## Tasks

### 1. Database Schema Additions (Prerequisite)
- [x] Add `assets` table to `database/schema.sql` to track generated files (images/videos) isolated by tenant.
- [x] Apply RLS policies to the `assets` table.

### 2. Visual Agent (Freepik)
- [x] Ensure `src/services/freepik.ts` is implemented and can save base64 to Supabase Storage.
- [x] Refine `src/agents/visual-agent.ts` to coordinate LLM prompt generation and Freepik API calls.

### 3. Curation & Motion Agent (Hybrid Video Pipeline)
- [x] **FFmpeg Preprocessing**: Implement `src/services/ffmpeg.ts` to execute keyframe-aligned cuts on raw client videos dynamically based on timestamps.
- [x] **Remotion Templates**: Ensure `src/remotion/compositions/` has templates for Reels and Stories using GSAP, optimized to receive cut video backgrounds.
- [x] **Render Concurrency & Queue**: In `src/agents/motion-agent.ts`, implement an asynchronous render queue (max concurrency = 2) and configure Remotion with `concurrency: 6` to leverage our 8 vCPUs without locking the API.
- [x] **Storage Purge**: Ensure automatic local cleanup of all downloaded raw clips and temp frames from the VPS `/tmp` immediately after render finishes.

### 4. Thumb Agent
- [x] Implement `src/agents/thumb-agent.ts` to generate high-impact covers/thumbnails for video content.

### 5. Pipeline Integration
- [x] Implement `POST /pipelines/visual` endpoint in `src/routes/pipelines.ts` (Already created and aligned).
- [x] Implement `POST /pipelines/motion` and `POST /pipelines/thumb` endpoints in `src/routes/pipelines.ts`.

## Verification Requirements
- `assets` table properly isolates tenant files via RLS.
- Visual Agent successfully generates an image via Freepik and uploads to Supabase Storage.
- FFmpeg successfully cuts raw videos on the VPS with keyframe alignment.
- Motion Agent successfully renders a layered video on the VPS using parallel rendering (up to 6 cores) without exceeding RAM limits.
- Local temporary files are fully purged after rendering.
