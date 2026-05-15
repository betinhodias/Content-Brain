# Roadmap: Creative Brain — SaaS Multi-Tenant

---

## Phase 0: Technical Spikes (Validações Críticas)
**Status:** pending
**Goal:** Validar as duas integrações externas críticas antes de qualquer código de produção. Resultado: decisões de arquitetura travadas para Fases 1-3.
**Requirements:** (pre-requisite para todos)
**Entregáveis:**
- `spike-freepik/` — chamada real à API Freepik com a chave disponível, schema de resposta documentado.
- `spike-remotion/` — composição Remotion mínima com GSAP sincronizado, renderizada headless localmente.
**Estimativa:** 1 sessão de desenvolvimento (2-3h)

---

## Phase 1: Multi-Tenant Foundation + Brand Guide
**Status:** pending
**Goal:** Infraestrutura completa para isolamento de tenants, autenticação JWT, schema de banco de dados com RLS, e sistema de ingestão de Brand Guides.
**Requirements:** REQ-000, REQ-001
**Entregáveis:**
- `schema.sql` — DDL completo com RLS policies
- Fastify server com middleware de tenant context
- Endpoints: `POST /auth/login`, `GET/POST/PUT /clients`, `POST /brand-guides/upload`, `GET /brand-guides/search`
- Docker + docker-compose para desenvolvimento local
- `.env.example` com todas as variáveis necessárias

---

## Phase 2: Copy Agent (Zero AI Slop)
**Status:** pending
**Goal:** Sistema de prompts multicamadas com RAG sobre Brand Guide do tenant ativo. Output de copy para Carrossel, Reel, Legenda e Thread.
**Requirements:** REQ-002
**Entregáveis:**
- `src/agents/copy-agent.ts` — orquestrador do pipeline de copy
- `src/prompts/` — camadas de System, Brand Context, Format, Task
- Endpoint `POST /pipelines/copy`
- Teste manual: 10 pautas → 0% AI Slop (resultado documentado)

---

## Phase 3: Visual + Motion + Thumb Agents
**Status:** pending
**Goal:** Integração Freepik para imagens, composições Remotion + GSAP para vídeos, e Thumb Agent para capas.
**Requirements:** REQ-003, REQ-004, REQ-005
**Entregáveis:**
- `src/agents/visual-agent.ts` — integração Freepik API com retry/backoff
- `src/remotion/compositions/` — templates GSAP para Reels e Stories
- `src/agents/motion-agent.ts` — geração de manifesto GSAP e trigger de renderização Remotion
- `src/agents/thumb-agent.ts` — geração de capa a partir do Hook
- FFmpeg validation service
- Endpoints: `POST /pipelines/visual`, `POST /pipelines/motion`, `POST /pipelines/thumb`
- Assets salvos em Supabase Storage com isolamento por tenant

---

## Phase 4: HITL Dashboard (Next.js SaaS)
**Status:** pending
**Goal:** Interface "Nós Dark Mode" multi-tenant com Client Manager, Brand Guide Manager, Pipeline Launcher e Batch Approval Grid.
**Requirements:** REQ-006
**Entregáveis:**
- Next.js app com Supabase Auth integrado
- Client Manager (CRUD de clientes por operador)
- Brand Guide Manager (upload e status de indexação)
- Pipeline Launcher (formulário de disparo de pipeline)
- Batch Approval Grid (preview inline de imagem/vídeo)
- Parametric Modal (ajuste GSAP + re-render)
- Design system "Nós Dark Mode" documentado em tokens CSS

---

## Phase 5: Integration, E2E Tests & Polish
**Status:** pending
**Goal:** Testes end-to-end do pipeline completo, validação de segurança multi-tenant, polimento de UX e preparação para entrega ao cliente Calie.
**Requirements:** ALL
**Entregáveis:**
- Pipeline completo testado: Input (tema + cliente) → Copy → Visual → Motion → Thumb → Approval Grid
- Teste de segurança: tenant A não vê dados do tenant B
- Validação de output: FFmpeg + checklist de plataforma (Instagram Reels specs)
- Documentação de operação para a Calie Marketing
- Deploy em produção (Hetzner VPS)

---

## Backlog (Fase 2 do PRD — Out of Scope v1)
- **999.1:** Módulo de Ingestão & Planejamento — Integração com calendário editorial e planejamento automático de pautas.
- **999.2:** Publicação automatizada — Push direto para Instagram/LinkedIn via Meta Business API.
- **999.3:** Billing por tenant — Cobrança proporcional ao uso de renders.

---
*Last updated: 2026-05-15 — Revisado pós-auditoria: Phase 0 Spikes, multi-tenant architecture, Remotion*
