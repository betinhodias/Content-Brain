<domain>
Phase 3 delivers the Visual, Motion, and Thumb Agents. These agents orchestrate the creation of visual assets (via Freepik API) and video compositions (via Remotion + GSAP) based on the output of the Copy Agent.
</domain>

<decisions>
- **D-01: Visual Agent (Freepik)** — Uses LLM to translate the copy hook into an 8-dimension photography brief, then calls Freepik API to generate the image.
- **D-02: Assets Storage** — Generated images and videos are saved to Supabase Storage in a tenant-isolated path and registered in the `assets` table.
- **D-03: Motion Agent (Remotion)** — Orchestrates GSAP animations using Remotion headless rendering.
- **D-04: Thumb Agent** — Dedicated to creating high-impact covers/thumbnails for videos.
</decisions>

<canonical_refs>
- `.planning/REQUIREMENTS.md` — REQ-003, REQ-004, REQ-005
- `database/schema.sql` — Must be updated with `assets` table.
- `src/agents/visual-agent.ts` — Existing implementation to integrate.
</canonical_refs>
