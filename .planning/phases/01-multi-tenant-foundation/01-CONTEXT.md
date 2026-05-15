<domain>
Phase 1 delivers the complete multi-tenant backend foundation: database schema with RLS, Fastify API with JWT auth, tenant middleware, client CRUD, and Brand Guide ingestion + semantic search.
</domain>

<decisions>

- **D-01: Estrutura do projeto** — Single-package TypeScript com `src/`. Next.js (Phase 4) ficará em `packages/web/` quando adicionado. Por enquanto, tudo em `/` com separação clara de módulos.

- **D-02: Package manager** — pnpm. Mais rápido, melhor deduplicação de deps.

- **D-03: Auth strategy** — Supabase Auth para operadores de agência (usuários do dashboard). Backend usa `SUPABASE_SERVICE_ROLE_KEY` para operações administrativas. JWT emitido pelo Supabase contém `user_id`; o `agency_id` e `tenant_id` são resolvidos pelo middleware a partir da tabela `agency_users`.

- **D-04: Schema hierárquico** — `agencies` → `agency_users` → `clients` (tenants) → `brand_guide_documents` → `brand_guide_chunks`. Toda tabela com dados de tenant tem coluna `client_id` (= tenant_id).

- **D-05: RLS enforcement** — RLS ativo em todas as tabelas de dados. Política: usuário só acessa rows onde `client_id` pertence à sua `agency_id`. Backend usa service_role para bypass controlado apenas em operações admin explícitas.

- **D-06: Brand Guide ingestion — texto only na Phase 1** — Input como texto puro (markdown ou plain text). PDF parsing é deferred para Phase 2. Chunking: 500 tokens, 50 tokens overlap, usando `RecursiveCharacterTextSplitter` (implementação manual, sem LangChain).

- **D-07: Embeddings** — OpenAI `text-embedding-3-small`, 1536 dimensões. Custo negligível (~$0.02/M tokens). Armazenado em `brand_guide_chunks.embedding vector(1536)` via Supabase pgvector.

- **D-08: Pipeline orchestration na Phase 1** — Sem fila externa (BullMQ deferred para Phase 3). Fastify processa requisições de forma async direta. Endpoints de pipeline retornam job_id + status polling.

- **D-09: Docker** — Dockerfile multi-stage (builder + runner). docker-compose.yml para desenvolvimento local com variáveis de ambiente via `.env`.

- **D-10: Framework de testes** — Vitest. Unit tests para services e middleware. Integration tests com Supabase local (supabase start) deferred para Phase 5.

- **D-11: Validação de input** — Zod em todos os endpoints. Schemas definidos em `src/schemas/`.

</decisions>

<canonical_refs>
- `.planning/REQUIREMENTS.md` — REQ-000 e REQ-001 (escopo desta fase)
- `.planning/spikes/001-freepik-api/README.md` — contrato de API Freepik (referência para futuras fases)
- `.planning/spikes/002-openrouter-gemma4/README.md` — contrato OpenRouter/Gemma 4
- `.planning/PROJECT.md` — modelo de dados hierárquico (`agencies → clients → brand_guides`)
</canonical_refs>

<code_context>
Projeto greenfield. Nenhum código existente. Estrutura de diretórios a ser criada do zero.
</code_context>
