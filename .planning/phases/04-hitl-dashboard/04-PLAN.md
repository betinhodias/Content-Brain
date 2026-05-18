# Phase 4: HITL Dashboard (Next.js SaaS) - Plan

**Status:** Planned

## Objective
Connect and fully verify the Next.js dark-themed dashboard frontend with the multi-agent backend APIs, enabling high-fidelity Human-in-the-Loop review, one-click content launches, and interactive previews of copies, visual assets, and Remotion renders.

## Tasks

### 1. API Client Alignment
- [x] Verify API client configuration in `web/lib/api.ts` to cleanly target our backend Fastify server.
- [x] Implement authorization token injection from local storage / Supabase JWT contexts.

### 2. Pipeline Creation Flow
- [x] Build and test new pipeline launching interface under `web/pages/pipelines/new.tsx`.
- [x] Align parameters for ContentType selections: Reels, Carousels, Stories, and Threads.

### 3. Real-Time Pipeline Progress Polling
- [x] Ensure `web/pages/pipelines/[id].tsx` supports active polling (every 3 seconds) while pipeline state is `pending` or `running`.
- [x] Render distinct progress indicators for Copy, Visual, and Motion Agent execution.

### 4. Interactive Assets & Motion Previews
- [x] Implement dynamic rendering of Freepik generated images in the `Visual Assets` card.
- [x] Implement absolute vertical HTML5 video elements for Remotion motion previews.
- [x] Add fallback animations and loading indicators for in-progress operations.

### 5. Final Integration Checks
- [ ] Perform E2E manual user review: create a new pipeline, verify async agent polling, review inline copy and dynamic media overlays.

## Verification Requirements
- Dashboard connects successfully to Fastify server endpoints.
- User can trigger a new pipeline, and progress updates dynamically without full-page reloads.
- Visual assets are loaded via public Supabase storage links.
- Rendered reels can be previewed directly inside the 9:16 vertical preview card.
