// src/agents/copy-agent.ts
// Copy Agent — orchestrates the 4-layer prompt system to generate on-brand copy
import { supabaseAdmin } from '../services/supabase.js';
import { generateEmbedding } from '../services/embeddings.js';
import { callLLM, extractJSON } from '../services/openrouter.js';
import { buildSystemPrompt } from '../prompts/system.js';
import { buildFormatPrompt } from '../prompts/format-templates.js';
import { buildTaskPrompt } from '../prompts/task-builder.js';
import { detectSlop, flattenCopyToText } from '../prompts/slop-detector.js';
import type { ContentType, CopyOutput } from '../types/index.js';

export interface CopyAgentInput {
  pipelineId: string;
  clientId: string;
  agencyId: string;
  contentType: ContentType;
  topic: string;
  tone?: string;
  additionalContext?: string;
}

export interface CopyAgentResult {
  pipelineId: string;
  copyOutput: CopyOutput;
  slopScore: number;
  slopWarnings: string[];
  ragChunksUsed: number;
  hadBrandGuide: boolean;
}

/**
 * Main Copy Agent.
 * Retrieves brand context via RAG, assembles 4-layer prompt, generates copy,
 * validates for AI slop, and persists results to the pipeline record.
 */
export async function runCopyAgent(input: CopyAgentInput): Promise<CopyAgentResult> {
  const {
    pipelineId,
    clientId,
    agencyId,
    contentType,
    topic,
    tone,
    additionalContext,
  } = input;

  // =====================
  // 1. Update pipeline status → running
  // =====================
  await supabaseAdmin
    .from('pipelines')
    .update({ status: 'running' })
    .eq('id', pipelineId);

  try {
    // =====================
    // 2. Fetch client data (for brandSummary and name)
    // =====================
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('name, brand_summary')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .single();

    // =====================
    // 3. RAG — retrieve brand guide chunks
    // =====================
    let brandChunks: string[] = [];
    let ragChunksUsed = 0;
    let hadBrandGuide = false;

    try {
      // Generate embedding for the topic query
      const queryEmbedding = await generateEmbedding(topic);

      // Search brand guide via Supabase function
      const { data: searchResults } = await supabaseAdmin.rpc('search_brand_guide', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.65,
        match_count: 5,
        p_client_id: clientId,
        p_agency_id: agencyId,
      });

      if (searchResults && searchResults.length > 0) {
        brandChunks = searchResults.map((r: { content: string }) => r.content);
        ragChunksUsed = brandChunks.length;
        hadBrandGuide = true;
      }
    } catch (ragError) {
      // RAG failure is non-fatal — fallback to brandSummary only
      console.warn(`[CopyAgent] RAG search failed for client ${clientId}:`, ragError);
    }

    // =====================
    // 4. Build prompts (4 layers)
    // =====================

    // Layer 1: System (identity + anti-slop rules + optional brand summary)
    const systemPrompt = buildSystemPrompt(client?.brand_summary ?? undefined);

    // Layer 2+3: Format + Brand Context are assembled together in the user prompt
    const formatSection = buildFormatPrompt(contentType);

    const userPrompt = [
      formatSection,
      buildTaskPrompt({
        topic,
        contentType,
        tone,
        additionalContext,
        brandChunks: brandChunks.length > 0 ? brandChunks : undefined,
        clientName: client?.name,
      }),
    ].join('\n\n---\n\n');

    // =====================
    // 5. Call LLM
    // =====================
    const rawOutput = await callLLM({
      systemPrompt,
      userPrompt,
      temperature: 0.75,
      maxTokens: 2500,
    });

    // =====================
    // 6. Parse output
    // =====================
    const parsed = extractJSON<CopyOutput>(rawOutput);

    // If JSON parse fails, build a minimal structured output from raw text
    const copyOutput: CopyOutput = parsed ?? {
      hook: topic,
      body: rawOutput.slice(0, 1000),
      cta: 'Entre em contato',
      hashtags: [],
    };

    // =====================
    // 7. Slop detection
    // =====================
    const flatText = flattenCopyToText(copyOutput as unknown as Record<string, unknown>);
    const slopResult = detectSlop(flatText);

    const slopWarnings: string[] = [];
    if (slopResult.offendingWords.length > 0) {
      slopWarnings.push(`Banned words detected: ${slopResult.offendingWords.join(', ')}`);
    }
    if (slopResult.offendingPatterns.length > 0) {
      slopWarnings.push(`Banned patterns detected: ${slopResult.offendingPatterns.length} pattern(s)`);
    }

    // =====================
    // 8. Persist to pipeline
    // =====================
    await supabaseAdmin
      .from('pipelines')
      .update({
        status: 'completed',
        copy_output: copyOutput,
      })
      .eq('id', pipelineId);

    return {
      pipelineId,
      copyOutput,
      slopScore: slopResult.slopScore,
      slopWarnings,
      ragChunksUsed,
      hadBrandGuide,
    };

  } catch (error) {
    // Mark pipeline as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabaseAdmin
      .from('pipelines')
      .update({
        status: 'failed',
        error: errorMessage,
      })
      .eq('id', pipelineId);

    throw error;
  }
}
