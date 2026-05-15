# State: Creative Brain

## Current Position
**Fase 0 — Technical Spikes** (pronto para começar)

Projeto inicializado e revisado após auditoria de planejamento.
Próximo passo: executar spikes de validação técnica (Freepik API + Remotion headless).

## Active Phase
Phase 0: Technical Spikes

## Session Memory

### Decisões Travadas (pós-auditoria 2026-05-15):
- **Multi-tenant desde o Dia 1** — Calie é operador; clientes da Calie são tenants. Supabase RLS enforça isolamento.
- **Remotion substitui Hyperframes** — Hyperframes não tem API verificada. Remotion é TypeScript-native, headless, GSAP-compatible. Licença: Automators ($0.01/render).
- **Gemma 4 via Ollama** — self-hosted no VPS Hetzner (pending: confirmar spec de RAM para Gemma 4).
- **Freepik API v1** — schema confirmado (`x-freepik-api-key` header, endpoint `/v1/ai/text-to-image`). Spike pendente.
- **Brand Guide = per-tenant** — ingestão via upload (texto/PDF), chunked + vetorizado no Supabase pgvector.

### Pendências antes de prosseguir:
- [ ] Confirmar spec do VPS Hetzner para rodar Gemma 4 via Ollama (mínimo 8GB RAM para Gemma 4B, 16GB para 12B).
- [ ] Executar Spike Freepik (chave disponível, testar endpoint real).
- [ ] Executar Spike Remotion (composição mínima + headless render local).

## Blockers
- Nenhum bloqueador crítico. Spikes são desbloqueadores preventivos.

## Decisions Log
- [2026-05-15] Inicialização do projeto com GSD v1.42.2.
- [2026-05-15] Auditoria de planejamento identificou 4 gaps críticos: Hyperframes, Brand Bible, Orquestração, Freepik.
- [2026-05-15] Resposta do usuário: multi-tenant é requisito central; Remotion como alternativa ao Hyperframes; Freepik com chave disponível para teste.
- [2026-05-15] Roadmap, Requirements e Project revisados para refletir arquitetura multi-tenant e Remotion.

---
*Last updated: 2026-05-15 — Pós-revisão arquitetural*
