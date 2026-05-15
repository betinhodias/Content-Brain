// src/services/embeddings.ts
// OpenAI embeddings for Brand Guide RAG
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.EMBEDDINGS_MODEL ?? 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding vector for a single text string.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, ' '), // OpenAI recommends replacing newlines
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single API call (more efficient).
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map(t => t.replace(/\n/g, ' ')),
    dimensions: EMBEDDING_DIMENSIONS,
  });

  // Sort by index to maintain order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}

/**
 * Split text into overlapping chunks for RAG ingestion.
 * Strategy: character-based splitting with word boundary respect.
 */
export function chunkText(
  text: string,
  chunkSize: number = 2000,  // ~500 tokens for text-embedding-3-small
  overlap: number = 200       // ~50 tokens overlap
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Don't cut in the middle of a word — find the last space before end
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) {
        end = lastSpace;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, respecting overlap
    start = end - overlap;
    if (start <= 0) start = end; // Safety: prevent infinite loop
  }

  return chunks;
}
