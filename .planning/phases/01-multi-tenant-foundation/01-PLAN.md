# Phase 1: Multi-Tenant Foundation + Brand Guide - Plan

**Status:** Executado (Retroativo)

## Objective
Estabelecer a infraestrutura backend completa para suporte multi-tenant (agência → clientes), configuração de banco de dados com RLS (Supabase), autenticação JWT e rotas base para ingestão de Brand Guides e pipelines. Adicionalmente, engloba o setup prematuro do front-end Next.js.

## Tasks

### 1. Database & Schema (Supabase)
- [x] Criar `database/schema.sql` com tabelas `agencies`, `agency_users`, `clients`, `brand_guide_documents` e `brand_guide_chunks`.
- [x] Habilitar Row Level Security (RLS) nas tabelas.
- [x] Criar políticas RLS para garantir isolamento por `agency_id` (via JWT claims/middleware).
- [x] Configurar extensão `pgvector` para a tabela de embeddings (`brand_guide_chunks`).

### 2. Core API Foundation (Fastify)
- [x] Criar `src/server.ts` e registrar plugins essenciais: `cors`, `helmet`, e `rate-limit`.
- [x] Configurar `trustProxy: true` no Fastify para funcionar atrás de proxy (Hetzner/VPS).
- [x] Criar `src/services/supabase.ts` para conectar via Supabase Admin Key.
- [x] Criar `src/middleware/auth.ts` para interceptar chamadas e resolver `tenant_id` a partir do JWT.

### 3. API Routes & Business Logic
- [x] **Auth:** Implementar `POST /auth/login` em `src/routes/auth.ts` utilizando Supabase Auth.
- [x] **Clients:** Implementar CRUD de clientes (`GET`, `POST`, `PUT`, `DELETE`) em `src/routes/clients.ts`.
- [x] **Brand Guides:** Implementar rota de upload e chunking de texto (`POST /brand-guides/upload`) e busca semântica em `src/routes/brand-guides.ts`.
- [x] **Pipelines & Stats:** Scaffolding inicial em `src/routes/pipelines.ts` e `src/routes/stats.ts`.

### 4. UI Foundation (Next.js - Antecipado)
- [x] Inicializar app Next.js na pasta `web/`.
- [x] Implementar tela de login com roteamento de sucesso (`web/pages/login.tsx`) e chamadas à API via Axios (`web/lib/api.ts`).
- [x] Implementar estrutura base da interface "Nós Dark Mode" no dashboard de Settings (`web/pages/settings/index.tsx`).

## Verification Requirements
- Uma agência autenticada não pode listar clientes de outra agência (RLS test).
- O Rate Limiting deve bloquear adequadamente o excesso de requisições, considerando o IP real via `trustProxy`.
- O login retorna um token válido que é aceito pelas rotas protegidas.
