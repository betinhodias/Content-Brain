# Phase 4: HITL Dashboard (Next.js SaaS) - Context

## Overview
The Human-in-the-Loop (HITL) Dashboard is the multi-tenant SaaS frontend interface for the Creative Brain. It empowers marketing operators at Calie Marketing to seamlessly manage client brands, launch automated content generation pipelines, and approve/tweak copy, visual assets, and motion renders in real-time.

## Key Architecture & Features

### 1. Multi-Tenant Authorization Isolation
- Handled securely via JWT credentials mapped directly from the backend context.
- Operates under the agency operator role, allowing operations across all active client tenants associated with Calie Marketing.

### 2. Client Manager (Completed Foundation)
- Fully functional CRUD interface already designed under `/clients`.
- Connects directly to the backend client register API, mapping names, industries, and active RLS tenant slugs.

### 3. Pipeline Ingestion & Monitoring Grid
- Real-time polling for copy, visual, and motion generation progress directly on `/pipelines/[id]`.
- Leverages the structured states of the backend queues, showing visual asset load bars and Remotion rendering feedback.

### 4. Interactive Human-in-the-Loop Approval Grid
- Inline approval triggers:
  - **Copy Approval**: Locks copy assets and allows manual parametric adjustments.
  - **Visual Preview**: Renders generated high-fidelity Freepik 8D imagery.
  - **Motion Render**: Plays Remotion vertical videos (9:16) with typographical overlays dynamically on the browser.

### 5. Unified Design System ("Nós Dark Mode")
- Clean dark aesthetic built with modern typography, Harmonious HSL colors, smooth linear gradients, glassmorphism card surfaces, and subtle pulse animations.
