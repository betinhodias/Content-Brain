# State: Creative Brain

## Current Position
**Phase 3 — CONCLUÍDA ✅ | Phase 4 — IN PROGRESS 🟡**

O Copy Agent, Visual Agent (Freepik API), Motion Agent (remotion webpack dynamic bundler + 6-core concurrency Hetzner optimization + in-memory RenderQueue + local FFmpeg curation service) e o Thumb Agent foram concluídos, testados e totalmente integrados à tabela de `assets`.

## Active Phase
Phase 4: HITL Dashboard (Next.js SaaS)

## Session Memory

### Revisão de Código e Correções (Gemini 3.1 Pro High):
- **Phase 2 (Copy Agent) Finalizada:** Scripts e testes validados demonstrando extração robusta de JSON do OpenRouter (Gemma 4).
- **Phase 3 Planejada:** `03-CONTEXT.md` e `03-PLAN.md` criados detalhando o uso do Freepik + Remotion.
- **Integração de Rotas:** Criado endpoint assíncrono `POST /pipelines/visual` integrando o `visual-agent.ts` ao pipeline.
- **Banco de Dados:** Tabela `assets` adicionada ao `schema.sql` com isolamento RLS por tenant.

### Desvio da Pipeline GSD Detectado:
- O desenvolvimento do frontend Next.js (`web/`) foi iniciado prematuramente na Phase 1, em desacordo com o `01-CONTEXT.md` e `ROADMAP.md` (que o previam para a Phase 4).
- O código da Phase 1 foi escrito sem a geração prévia do `PLAN.md`. Isso quebra o contrato de previsibilidade e auditoria do GSD.

### Decisões Travadas (pós-auditoria 2026-05-15):
- **Multi-tenant desde o Dia 1** — Calie é operador; clientes da Calie são tenants. Supabase RLS enforça isolamento.
- **Remotion substitui Hyperframes** — Hyperframes não tem API verificada. Remotion é TypeScript-native, headless, GSAP-compatible. Licença: Automators ($0.01/render).
- **Gemma 4 via Ollama** — self-hosted no VPS Hetzner (pending: confirmar spec de RAM para Gemma 4).
- **Freepik API v1** — schema confirmado (`x-freepik-api-key` header, endpoint `/v1/ai/text-to-image`). Spike pendente.
- **Brand Guide = per-tenant** — ingestão via upload (texto/PDF), chunked + vetorizado no Supabase pgvector.

### Decisão adicionada (2026-05-15):
- **OpenRouter substitui Ollama** — sem necessidade de GPU no VPS. Gemma 4 via API gerenciada.
- **Embeddings:** OpenAI `text-embedding-3-small` ($0.02/M tokens) — custo inexpressivo para Brand Guides.

## Blockers
- A ausência do `PLAN.md` na `Phase 1` impede o fluxo correto do GSD (`gsd-plan-phase` -> `gsd-execute-phase`).

## Decisions Log
- [2026-05-16] Código revisado via Gemini 3.1 Pro High. Correção crítica de Rate Limit implementada (`trustProxy: true`). Detectada violação da pipeline GSD (ausência de PLAN.md e UI Next.js antecipada). Próximo passo definido para retomada do trilho GSD.
- [2026-05-15] Inicialização do projeto com GSD v1.42.2.
- [2026-05-15] Auditoria de planejamento identificou 4 gaps críticos: Hyperframes, Brand Bible, Orquestração, Freepik.
- [2026-05-15] Roadmap, Requirements e Project revisados para refletir arquitetura multi-tenant e Remotion.

---
*Last updated: 2026-05-16 — Revisão de Código e Alinhamento GSD Pipeline*
