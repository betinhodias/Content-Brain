// src/prompts/task-builder.ts
// Task Layer — builds the specific content brief for each generation request
import type { ContentType } from '../types/index.js';

export interface TaskContext {
  topic: string;
  contentType: ContentType;
  tone?: string;
  additionalContext?: string;
  brandChunks?: string[];  // RAG results from Brand Guide
  clientName?: string;
}

/**
 * Builds the user-facing prompt (task layer).
 * Combines brand context (RAG) + format + specific task brief.
 */
export function buildTaskPrompt(ctx: TaskContext): string {
  const parts: string[] = [];

  // 1. Brand Guide context (RAG layer)
  if (ctx.brandChunks && ctx.brandChunks.length > 0) {
    parts.push(`## BRAND GUIDE CONTEXT
The following excerpts are from the client's Brand Guide. Use this to match their voice, values, and audience:

${ctx.brandChunks.map((chunk, i) => `### Excerpt ${i + 1}:\n${chunk}`).join('\n\n')}`);
  }

  // 2. Tone definition
  const toneInstruction = ctx.tone
    ? `**Tone:** ${ctx.tone}`
    : `**Tone:** Professional but approachable. Direct. Confident without being arrogant.`;

  // 3. Client context
  const clientRef = ctx.clientName ? `**Client:** ${ctx.clientName}` : '';

  // 4. Core task
  parts.push(`## CONTENT BRIEF

${clientRef ? clientRef + '\n' : ''}${toneInstruction}
**Topic:** ${ctx.topic}

## YOUR TASK

Write the content described in the format section above.

Requirements:
- Apply ALL anti-AI-slop rules from the system instructions.
- Use the brand voice and language patterns from the Brand Guide context.
- Be specific to the topic — avoid generic marketing advice that could apply to any business.
- If you reference numbers, statistics, or case studies, make them relevant to the industry/niche.
- Write for the reader who is scrolling fast and has seen 50 other posts today. Beat the competition.

${ctx.additionalContext ? `## ADDITIONAL CONTEXT FROM OPERATOR\n${ctx.additionalContext}` : ''}

Now write the content. Respond ONLY with valid JSON inside <output></output> tags. Nothing else.`);

  return parts.join('\n\n');
}
