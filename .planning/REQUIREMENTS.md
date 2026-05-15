# Requirements: Creative Brain — SaaS Multi-Tenant

---

## REQ-000: Multi-Tenant Foundation (PREREQUISITE)
**Fase:** 1
**Description:** Toda a plataforma é isolada por tenant. Um "tenant" é um cliente final da agência operadora (ex: cada cliente da Calie é um tenant). A agência é o operador. A Nós Automação é a desenvolvedora.

**Modelo de dados:**
```
agencies (operadores: Calie Marketing)
  └── clients (tenants: clientes da Calie)
        └── brand_guides (Brand Bible do cliente)
        └── pipelines (execuções de criação de conteúdo)
        └── assets (imagens/vídeos gerados)
```

**Acceptance Criteria:**
- CRUD de `agencies` (apenas superadmin da Nós Automação pode criar).
- CRUD de `clients` (operador da agência gerencia seus clientes).
- Supabase RLS ativo em todas as tabelas com `tenant_id` na cláusula USING.
- JWT contém `tenant_id` e `agency_id` nos claims.
- Um usuário autenticado de um tenant NUNCA vê dados de outro tenant.
- Endpoint `GET /clients` retorna apenas clientes do operador logado.

---

## REQ-001: Brand Guide System
**Fase:** 1
**Description:** Sistema de ingestão, chunking e vetorização de Brand Guides por cliente. Suporta upload de texto/PDF. Alimenta o RAG do Copy Agent.

**Schema Supabase:**
```sql
brand_guide_documents (id, client_id, tenant_id, file_name, raw_text, created_at)
brand_guide_chunks (id, document_id, tenant_id, content, embedding vector(1536), metadata jsonb)
```

**Acceptance Criteria:**
- Upload de Brand Guide (texto ou PDF) via API.
- Chunking automático em trechos de ~500 tokens com 50 tokens de overlap.
- Geração de embeddings via `text-embedding-3-small` (OpenAI) ou modelo local.
- Busca semântica retorna chunks relevantes filtrados por `tenant_id`.
- Index `tenant_id` criado para performance.
- RLS ativo na tabela `brand_guide_chunks`.

---

## REQ-002: Copy Agent (Zero AI Slop)
**Fase:** 2
**Description:** Agente que gera roteiros e copies com voz de marca autêntica usando RAG sobre o Brand Guide do tenant ativo.

**Prompt Architecture (multicamada):**
1. **System Layer:** Identidade do agente + regras anti-AI-slop (sem clichês, sem fórmulas genéricas).
2. **Brand Context Layer:** Chunks do Brand Guide recuperados via RAG (top-5 por relevância).
3. **Format Layer:** Template do formato de output (Carrossel, Reel, Legenda, etc.).
4. **Task Layer:** Instrução específica da pauta (tema + hook + objetivo).

**Acceptance Criteria:**
- Dado um tema e formato, gera copy sem clichês de IA.
- Copy usa tom de voz definido no Brand Guide do tenant.
- Suporte a formatos: Carrossel (slides), Reel (roteiro), Legenda Instagram, Thread LinkedIn.
- Output inclui: título/hook, corpo, CTA, hashtags sugeridas.
- Teste manual: 10 pautas geradas → revisor humano avalia 0% de "AI Slop".

---

## REQ-003: Visual Agent (Freepik API)
**Fase:** 3
**Description:** Geração de imagens fotorrealistas via Freepik API com prompt engineering especializado.

**API Contract (confirmado via pesquisa):**
```
POST https://api.freepik.com/v1/ai/text-to-image
Header: x-freepik-api-key: {agency_api_key}
Body: { prompt: string, aspect_ratio: "1:1"|"16:9"|"9:16", negative_prompt?: string }
```

**Acceptance Criteria:**
- Prompts gerados incluem descritores técnicos: focal length, lighting type, color grade, mood.
- Negative Prompting ativo: rejeita elementos que violam Brand Guide (ex: "no text overlay, no cartoonish").
- Chave API armazenada por agência (não por tenant) com criptografia em repouso.
- Assets salvos no Supabase Storage com path isolado por tenant: `/{tenant_id}/assets/{pipeline_id}/`.
- Retry automático com backoff em caso de rate limit (429).

---

## REQ-004: Motion Agent (Remotion + GSAP)
**Fase:** 3
**Description:** Geração de vídeos animados via Remotion com composições GSAP sincronizadas frame-by-frame.

**Arquitetura Remotion:**
- Composições React em `src/remotion/compositions/`
- GSAP timeline pausada e controlada via `useCurrentFrame() / fps` do Remotion
- Renderização headless via `@remotion/renderer` no servidor Fastify
- Output: H.264 MP4, specs por formato:
  - Reels: 1080x1920, 9:16, 30fps, max 90s
  - Stories: 1080x1920, 9:16, 15fps, max 15s
  - Carrossel frame: 1080x1080, 1:1, estático (export PNG)

**Parâmetros controlados pelo agente:**
| Parâmetro | Tipo | Descrição |
|:---|:---|:---|
| `timeline.ease` | `string` | Curvas GSAP (ex: `power4.out`) |
| `layer.opacity` | `number` | Transparência 0-1 |
| `layer.scale` | `number` | Zoom/Escala |
| `animation.duration` | `number` | Duração em segundos |
| `text.mask` | `boolean` | Máscaras de texto dinâmicas |
| `bg_video_clip` | `url` | Injeção de vídeo do Supabase Storage |

**Acceptance Criteria:**
- Dado um manifesto JSON de parâmetros, Remotion renderiza vídeo H.264.
- GSAP timeline sincroniza com `useCurrentFrame()` — zero frame-drop.
- Vídeo final validado via FFmpeg (codec, resolução, duração).
- Asset salvo em path isolado por tenant no Supabase Storage.
- Licença Remotion: "Automators" ($0.01/render) — configurar billing tracking.

---

## REQ-005: Thumb Agent
**Fase:** 3
**Description:** Geração de thumbnail/capa estratégica baseada no Hook do copy gerado pelo REQ-002.

**Acceptance Criteria:**
- Recebe o Hook do Copy Agent como input.
- Gera prompt de imagem otimizado para thumbnail (alta legibilidade, contraste, rosto humano se aplicável).
- Output: imagem 1280x720 (16:9) via Freepik API.
- Salvo em path de tenant com sufixo `_thumb`.

---

## REQ-006: HITL Dashboard (Next.js)
**Fase:** 4
**Description:** Interface SaaS "Nós Dark Mode" para operadores de agência gerenciarem clientes e aprovarem conteúdo gerado.

**Design System:** "Nós Dark Mode" — variação escura do design system existente:
- Background: `#0A0A0F` (preto profundo)
- Surface: `#13131A` (carvão)
- Accent primário: `#00A79D` (teal da Nós Automação)
- Accent secundário: `#8DC63F` (lime)
- Tipografia: Barlow Semi Condensed (headings) + Inter (body) — herda do design system

**Funcionalidades:**
1. **Client Manager:** Lista de clientes do operador, criação, edição, inativação.
2. **Brand Guide Manager:** Upload e gerenciamento do Brand Guide por cliente.
3. **Pipeline Launcher:** Formulário para disparar pipeline (tema, formato, tom, cliente selecionado).
4. **Batch Approval Grid:** Grid visual dos assets gerados — aprovar, rejeitar, ajustar.
5. **Parametric Modal:** Ajuste fino de parâmetros GSAP e re-render sem sair da tela.

**Acceptance Criteria:**
- Operador seleciona cliente → todos assets, pipelines e Brand Guide são isolados ao tenant.
- Grid de aprovação com preview de imagem/vídeo inline.
- Modal paramétrico permite alterar `timeline.ease`, `layer.opacity`, `animation.duration` e re-disparar render.
- Interface responsiva: desktop (1440px) e tablet (1024px).
- Validada pela checklist do design system (cursor:pointer, contrast 4.5:1, focus states).

---

## Definition of Done (Global)
- Código TypeScript sem erros de lint (strict mode).
- Testes unitários para agentes de prompt e camadas de RAG.
- RLS testado com usuários de tenants distintos.
- Interface validada pelo checklist do design system.
- Output de vídeo validado via FFmpeg (codec H.264, resolução correta, sem artifacts).
- Nenhum asset de um tenant visível para outro tenant em qualquer endpoint.

---
*Last updated: 2026-05-15 — Revisão pós-auditoria: Multi-tenant, Remotion, Freepik API contract*
