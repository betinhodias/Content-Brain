# Spike 002 — OpenRouter + Gemma 4
**Data:** 2026-05-15 | **Status:** ✅ VALIDADO

## Hipótese
OpenRouter roteia chamadas para o Gemma 4 (Google) com latência aceitável e custo viável para uso em pipeline de produção de conteúdo.

## Resultado

### HTTP Contract (Confirmado — OpenAI-compatible)
```
POST https://openrouter.ai/api/v1/chat/completions
Header: Authorization: Bearer {chave}
Header: HTTP-Referer: https://creative-brain.nosauto.com
Header: X-Title: Creative Brain

Body: (idêntico ao formato OpenAI chat completions)
{
  "model": "google/gemma-4-26b-a4b-it",
  "messages": [...],
  "max_tokens": number,
  "temperature": number
}
```

### Modelos Gemma 4 Disponíveis

| Modelo | Context | Prompt | Completion | Indicação |
|---|---|---|---|---|
| `google/gemma-4-26b-a4b-it:free` | 262k | $0 | $0 | Dev/Testes |
| `google/gemma-4-26b-a4b-it` | 262k | $0.06/M | $0.33/M | **Produção recomendado** |
| `google/gemma-4-31b-it` | 262k | $0.12/M | $0.37/M | Qualidade máxima |
| `google/gemma-3-27b-it` | 131k | $0.08/M | $0.16/M | Fallback estável |

### Métricas Gemma 4 (26b)
- **Latência:** ~2.3s first token (excelente para uso assíncrono)
- **Provider:** Novita (via OpenRouter routing)
- **Custo por pipeline de copy:** ~$0.000012 (inexpressivo)
- **Context window:** 262k tokens — suficiente para Brand Guide completo no contexto

### Qualidade do Output (Teste Anti-AI-Slop)
```
Prompt: "Write one punchy Instagram hook about digital marketing automation. No AI clichés. One sentence."
Output: "Stop trading your sleep for manual data entry."
```
**Avaliação:** Direto, sem clichê, sem buzzwords. Output aceitável como linha de base. ✅

### Decisões de Implementação
1. **Modelo de produção:** `google/gemma-4-26b-a4b-it` (não o :free para garantir SLA)
2. **Context window de 262k** permite injetar Brand Guide completo sem chunking excessivo no system prompt.
3. **SDK:** Usar `openai` npm package — OpenRouter é 100% compatível com a interface OpenAI.
4. **Chave por operador** — armazenada encrypted na tabela `agencies`.
5. **Fallback:** Se Gemma 4 falhar → `google/gemma-3-27b-it` (mais estável, context 131k).

### Integração TypeScript
```typescript
import OpenAI from 'openai'; // funciona direto com OpenRouter

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://creative-brain.nosauto.com',
    'X-Title': 'Creative Brain',
  },
});
```

## Verdict: VALIDATED ✅
OpenRouter + Gemma 4 é drop-in replacement para qualquer SDK OpenAI. Custo inexpressivo. Sem necessidade de VPS com GPU.
