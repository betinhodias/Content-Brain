<domain>
Phase 2 delivers the Copy Agent — a multi-layer prompt system that generates on-brand copy for marketing content (carousels, reels, captions, threads, stories) using RAG over the client's Brand Guide. Zero AI Slop is the primary quality constraint.
</domain>

<decisions>

- **D-01: OpenRouter SDK** — usar o pacote `openai` NPM com `baseURL` apontando para OpenRouter. Drop-in replacement, sem dependência adicional.

- **D-02: Modelo** — `google/gemma-4-26b-a4b-it` em produção. `:free` tier para testes internos.

- **D-03: Arquitetura de prompts (4 camadas):**
  1. **System Layer** — Identidade do agente + lista de proibições (AI slop vocabulary) + regras de escrita humana.
  2. **Brand Context Layer** — Top-5 chunks do Brand Guide via RAG, injetados no contexto antes do task.
  3. **Format Layer** — Template de output específico por content_type (carousel, reel, caption, thread, story).
  4. **Task Layer** — Instrução específica: topic + tone + objective + additional_context.

- **D-04: Output estruturado** — Modelo retorna JSON dentro de `<output>` tags. Parse seguro com fallback para plain text se o JSON falhar.

- **D-05: RAG strategy** — `matchCount: 5`, `minSimilarity: 0.65` (levemente mais permissivo que o default para capturar mais contexto de marca). Query gerada a partir do `topic` fornecido.

- **D-06: Anti-AI-Slop enforcement** — Lista exaustiva de palavras e padrões proibidos no System Layer. Verificação pós-geração no TypeScript antes de retornar output.

- **D-07: Pipeline status tracking** — Criar registro na tabela `pipelines` antes de chamar o modelo. Atualizar status (pending → running → completed/failed) durante a execução.

- **D-08: Fallback para clients sem Brand Guide** — Se não houver chunks indexados, gerar copy baseado apenas no `brandSummary` do client. Warning incluído no response.

</decisions>

<canonical_refs>
- `.planning/REQUIREMENTS.md` — REQ-002 (escopo desta fase)
- `.planning/spikes/002-openrouter-gemma4/README.md` — contrato e integração TypeScript
- `src/services/embeddings.ts` — função `generateEmbedding` para RAG query
- `database/schema.sql` — tabela `pipelines` e função `search_brand_guide`
</canonical_refs>
