# State: Creative Brain

## Current Position
**Phase 0 — CONCLUÍDA ✅ | Phase 1 pronta para começar**

Spikes de validação técnica concluídos. Ambas as integrações críticas validadas.

## Active Phase
Phase 1: Multi-Tenant Foundation + Brand Guide

## Session Memory

### Decisões Travadas (pós-auditoria 2026-05-15):
- **Multi-tenant desde o Dia 1** — Calie é operador; clientes da Calie são tenants. Supabase RLS enforça isolamento.
- **Remotion substitui Hyperframes** — Hyperframes não tem API verificada. Remotion é TypeScript-native, headless, GSAP-compatible. Licença: Automators ($0.01/render).
- **Gemma 4 via Ollama** — self-hosted no VPS Hetzner (pending: confirmar spec de RAM para Gemma 4).
- **Freepik API v1** — schema confirmado (`x-freepik-api-key` header, endpoint `/v1/ai/text-to-image`). Spike pendente.
- **Brand Guide = per-tenant** — ingestão via upload (texto/PDF), chunked + vetorizado no Supabase pgvector.

### Spikes Concluídos (Phase 0):
- [x] **Spike Freepik API** ✅ — HTTP 200, base64 inline, ~2s latência, resolução 1024x1024. Schema documentado em `.planning/spikes/001-freepik-api/`.
- [x] **Spike OpenRouter + Gemma 4** ✅ — `google/gemma-4-26b-a4b-it`, 262k context, $0.06/M tokens prompt. Output anti-AI-slop validado. Schema documentado em `.planning/spikes/002-openrouter-gemma4/`.
- [ ] **Spike Remotion** — A executar na Fase 1 (baixo risco, lib bem documentada).

### Decisão adicionada (2026-05-15):
- **OpenRouter substitui Ollama** — sem necessidade de GPU no VPS. Gemma 4 via API gerenciada.
- **Embeddings:** OpenAI `text-embedding-3-small` ($0.02/M tokens) — custo inexpressivo para Brand Guides.

## Blockers
- Nenhum bloqueador crítico. Spikes são desbloqueadores preventivos.

## Decisions Log
- [2026-05-15] Inicialização do projeto com GSD v1.42.2.
- [2026-05-15] Auditoria de planejamento identificou 4 gaps críticos: Hyperframes, Brand Bible, Orquestração, Freepik.
- [2026-05-15] Resposta do usuário: multi-tenant é requisito central; Remotion como alternativa ao Hyperframes; Freepik com chave disponível para teste.
- [2026-05-15] Roadmap, Requirements e Project revisados para refletir arquitetura multi-tenant e Remotion.

---
*Last updated: 2026-05-15 — Pós-revisão arquitetural*
