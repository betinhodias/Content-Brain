# Project: Creative Brain — Nós Automação SaaS Platform

## What This Is
Uma **plataforma SaaS multi-tenant** de produção de conteúdo de alta fidelidade (Zero AI Slop) para agências de marketing. A Nós Automação é a desenvolvedora; o cliente direto (ex: Calie Marketing) é o **operador/agência**; os clientes da Calie são os **tenants finais** com seus próprios Brand Guides.

## Core Value
Permitir que uma agência de marketing gerencie múltiplos clientes dentro de um único sistema, gerando conteúdo visual e textual de qualidade premium com identidade de marca isolada por cliente — sem nenhum "AI Slop".

## Architecture Model
```
Nós Automação (Dev)
  └── Creative Brain Platform
        └── Calie Marketing (Agency Operator)
              ├── Cliente A (Tenant) — Brand Guide A
              ├── Cliente B (Tenant) — Brand Guide B
              └── Cliente N (Tenant) — Brand Guide N
```

## Technical Stack
- **Backend (Core Engine):** TypeScript / Node.js (Fastify) — multi-tenant middleware
- **Database & RAG:** Supabase (PostgreSQL + pgvector + RLS para isolamento de tenant)
- **Cérebro (LLM):** Gemma 4 (Ollama self-hosted no VPS Hetzner)
- **Motor de Imagem:** Freepik API v1 (chave por operador/tenant)
- **Motor de Vídeo:** Remotion (headless render, @remotion/renderer) + GSAP compositions
- **Validação de Mídia:** FFmpeg (Node.js)
- **Interface (HITL):** Next.js — dashboard multi-tenant com seleção de cliente
- **Autenticação:** Supabase Auth + JWT com claims de tenant_id
- **Orquestrador futuro:** n8n (desacoplado — Fase 2 out-of-scope)

## Requirements

### Active
- [ ] **REQ-000: Multi-Tenant Foundation** — Isolamento de dados por tenant via Supabase RLS, CRUD de clientes, JWT com tenant_id.
- [ ] **REQ-001: Brand Guide System** — Ingestão, chunking e vetorização de Brand Guides por cliente (Supabase pgvector).
- [ ] **REQ-002: Copy Agent (Zero AI Slop)** — Sistema de prompts multicamadas + RAG com Brand Guide do tenant ativo.
- [ ] **REQ-003: Visual Agent (Freepik)** — Engenharia de prompt para Freepik API, Negative Prompting, isolamento de assets por tenant.
- [ ] **REQ-004: Motion Agent (Remotion + GSAP)** — Geração de manifestos GSAP, composições Remotion, renderização headless.
- [ ] **REQ-005: Thumb Agent** — Capa estratégica gerada a partir do Hook de copy, modelo Freepik.
- [ ] **REQ-006: HITL Dashboard (Next.js)** — Interface SaaS "Nós Dark Mode", seleção de cliente, Batch Approval Grid, ajuste paramétrico.

### Out of Scope (v1)
- **Fase 2: Ingestão & Planejamento** — Calendário automático e planejamento de pautas (desenvolvido após estabilização do Módulo de Criação).
- **Publicação automatizada** — Push direto para Instagram/LinkedIn (requer API Meta Business).
- **Billing por tenant** — Cobrança proporcional ao uso de renders/geração.

## Key Decisions
| Decision | Rationale | Outcome |
| :--- | :--- | :--- |
| **Multi-tenant desde o Dia 1** | Calie é operador de múltiplos clientes finais; design single-tenant causaria retrabalho total. | — Definido |
| **Remotion como motor de vídeo** | Substitui Hyperframes (sem API verificada). TypeScript-native, headless rendering, GSAP-compatible, $0.01/render. | — Definido |
| **Supabase RLS para isolamento de tenant** | Garante que dados de um cliente jamais sejam visíveis para outro, mesmo em falha de app-layer. | — Definido |
| **Gemma 4 via Ollama (self-hosted)** | Latência controlada, sem custo por token, privacy-first para dados de Brand Guide. | — Pending (confirmar VPS spec) |
| **Freepik API v1** | Chave verificada pelo operador, schema confirmado (`x-freepik-api-key` header). | — Pending (spike) |
| **Pure Code over No-Code** | Controle granular sobre animações GSAP, prompts multicamadas, isolamento de tenant. | — Definido |

## Evolution
Este documento evolui nas transições de fase e marcos de milestone.

---
*Last updated: 2026-05-15 — Revisão pós-auditoria: Multi-tenant architecture + Remotion*
