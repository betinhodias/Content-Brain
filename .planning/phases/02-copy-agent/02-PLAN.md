# Phase 2: Copy Agent (Zero AI Slop) - Plan

**Status:** Completed

## Objective
Implement the Copy Agent with a 4-layer prompt system using OpenRouter (`google/gemma-4-26b-a4b-it`) and integrating RAG with the Brand Guide to produce "Zero AI Slop" marketing content. 

## Tasks

### 1. Database Schema Additions (Prerequisite)
- [x] Add `brand_guide_documents` and `brand_guide_chunks` tables to `database/schema.sql`.
- [x] Add `search_brand_guide` vector search function to `database/schema.sql`.
- [x] Apply RLS policies to the new tables.

### 2. LLM Integration (OpenRouter)
- [x] Setup `src/services/llm.ts` wrapping the `openai` NPM package configured for OpenRouter.
- [x] Add strong typing and Zod schemas for structured JSON output parsing.

### 3. Prompt System (4-Layer)
- [x] Implement `src/prompts/system.ts`: System Layer with AI slop vocabulary bans.
- [x] Implement `src/prompts/brand.ts`: Brand Context Layer incorporating RAG results.
- [x] Implement `src/prompts/format.ts`: Format Layer per content type (carousel, reel, etc.).
- [x] Implement `src/prompts/task.ts`: Task Layer combining topic, tone, and objective.

### 4. Copy Agent Orchestration
- [x] Implement `src/agents/copy-agent.ts` to coordinate RAG -> Prompt Assembly -> LLM Call -> Validation.
- [x] Add anti-AI-slop validation logic in TypeScript before returning the output.
- [x] Add fallback logic if no brand guide chunks are found (use client `brand_summary`).

### 5. Pipeline Integration
- [x] Implement the `POST /pipelines/copy` endpoint in `src/routes/pipelines.ts`.
- [x] Update `pipelines` table status (`pending` -> `running` -> `completed`/`failed`) during execution.

## Verification Requirements
- Copy agent must successfully return a structured JSON response.
- Response must not contain any forbidden "AI slop" vocabulary.
- RAG must correctly inject chunks if available, or gracefully fallback to the `brand_summary`.
