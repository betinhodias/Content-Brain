# Spike 001 — Freepik API
**Data:** 2026-05-15 | **Status:** ✅ VALIDADO

## Hipótese
A Freepik API v1 aceita prompts de texto e retorna imagens fotorrealistas em base64, viável para uso programático no backend TypeScript.

## Resultado

### HTTP Contract (Confirmado)
```
POST https://api.freepik.com/v1/ai/text-to-image
Header: x-freepik-api-key: {chave}
Header: Content-Type: application/json

Body:
{
  "prompt": string,
  "negative_prompt": string (optional),
  "aspect_ratio": "1:1" | "16:9" | "9:16"
}
```

### Response Schema (Confirmado)
```json
{
  "data": [
    {
      "base64": "string (imagem em base64, ~72KB para 1024x1024)",
      "has_nsfw": false
    }
  ],
  "meta": {
    "prompt": "prompt original",
    "seed": -1,
    "image": {
      "size": "square",
      "width": 1024,
      "height": 1024
    },
    "num_inference_steps": 8,
    "guidance_scale": 1.5
  }
}
```

### Métricas
- **Latência:** ~2s por imagem (excelente)
- **Resolução:** 1024x1024 (aspect_ratio 1:1)
- **Formato:** base64 inline (não requer download separado)
- **NSFW guard:** incluído nativamente
- **Qualidade:** Fotorrealista — bokeh, iluminação natural, composição profissional ✅

### Decisões de Implementação
1. **Decode base64 → Buffer → Supabase Storage** — não salvar base64 no banco, apenas na storage.
2. **Seed (-1 = random)** — para reproductibilidade, salvar o `seed` retornado por geração.
3. **Timeout:** configurar 15s no cliente Fastify (API responde em ~2s, margem para picos).
4. **Chave por operador (agency)** — não por tenant. Armazenada encrypted na tabela `agencies`.
5. **Rate limit:** não documentado na resposta, implementar retry com exponential backoff (3 tentativas, 1s/2s/4s).

## Verdict: VALIDATED ✅
Integração viável. Schema simples e direto. Sem necessidade de polling (resposta síncrona).
