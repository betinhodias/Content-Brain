// src/services/openrouter.ts
// OpenRouter client — OpenAI-compatible interface for Gemma 4
import OpenAI from 'openai';

let _openrouter: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_openrouter) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }
    _openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL ?? 'https://creative-brain.nosauto.com',
        'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'Creative Brain',
      },
    });
  }
  return _openrouter;
}

export const GEMMA_MODEL = process.env.OPENROUTER_MODEL ?? 'google/gemma-4-26b-a4b-it';
export const GEMMA_FALLBACK = process.env.OPENROUTER_FALLBACK_MODEL ?? 'google/gemma-3-27b-it';

export interface LLMCallOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Core LLM call with automatic fallback.
 * Returns raw string content from model.
 */
export async function callLLM(options: LLMCallOptions): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    temperature = 0.75,
    maxTokens = 2048,
    model = GEMMA_MODEL,
  } = options;

  try {
    const response = await getClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from model');
    return content;

  } catch (error) {
    // Retry once with fallback model
    if (model !== GEMMA_FALLBACK) {
      console.warn(`[LLM] Primary model failed, retrying with fallback: ${GEMMA_FALLBACK}`);
      return callLLM({ ...options, model: GEMMA_FALLBACK });
    }
    throw error;
  }
}

/**
 * Extract JSON from model output.
 * Model is instructed to wrap output in <output>...</output> tags.
 */
export function extractJSON<T>(rawContent: string): T | null {
  // Try <output> tag extraction first
  const tagMatch = rawContent.match(/<output>([\s\S]*?)<\/output>/i);
  const jsonStr = tagMatch ? tagMatch[1].trim() : rawContent.trim();

  // Try to parse as JSON directly or find the first JSON object/array
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Try to find a JSON block in the string
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
