// src/routes/brand-guides.ts
// Brand Guide ingestion, chunking, vectorization, and semantic search
import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../services/supabase.js';
import {
  generateEmbeddingsBatch,
  generateEmbedding,
  chunkText,
} from '../services/embeddings.js';
import {
  UploadBrandGuideSchema,
  SearchBrandGuideSchema,
} from '../schemas/index.js';

export async function brandGuideRoutes(fastify: FastifyInstance) {

  fastify.addHook('preHandler', fastify.authenticate);

  // GET /brand-guides/:clientId — list documents for a client
  fastify.get('/brand-guides/:clientId', async (request, reply) => {
    const { clientId } = request.params as { clientId: string };
    const { agencyId } = request.auth;

    // Verify client belongs to this agency
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .single();

    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('brand_guide_documents')
      .select('id, file_name, version, is_active, created_at')
      .eq('client_id', clientId)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      fastify.log.error(error, 'Failed to fetch brand guides');
      return reply.code(500).send({ success: false, error: 'Failed to fetch brand guides' });
    }

    return reply.code(200).send({ success: true, data });
  });

  // POST /brand-guides/upload — ingest, chunk, vectorize a Brand Guide
  fastify.post('/brand-guides/upload', async (request, reply) => {
    const parseResult = UploadBrandGuideSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten(),
      });
    }

    const { clientId, fileName, rawText } = parseResult.data;
    const { agencyId } = request.auth;

    // 1. Verify client belongs to this agency
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .single();

    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    // 2. Deactivate previous versions of this client's brand guide
    await supabaseAdmin
      .from('brand_guide_documents')
      .update({ is_active: false })
      .eq('client_id', clientId)
      .eq('agency_id', agencyId);

    // 3. Get next version number
    const { data: latestDoc } = await supabaseAdmin
      .from('brand_guide_documents')
      .select('version')
      .eq('client_id', clientId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const version = (latestDoc?.version ?? 0) + 1;

    // 4. Create document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('brand_guide_documents')
      .insert({
        client_id: clientId,
        agency_id: agencyId,
        file_name: fileName,
        raw_text: rawText,
        version,
        is_active: true,
      })
      .select()
      .single();

    if (docError || !document) {
      fastify.log.error(docError, 'Failed to create brand guide document');
      return reply.code(500).send({ success: false, error: 'Failed to save document' });
    }

    // 5. Chunk the text
    const chunks = chunkText(rawText);
    fastify.log.info(`Chunked brand guide into ${chunks.length} pieces for client ${clientId}`);

    // 6. Generate embeddings in batch
    let embeddings: number[][];
    try {
      embeddings = await generateEmbeddingsBatch(chunks);
    } catch (embeddingError) {
      fastify.log.error(embeddingError, 'Failed to generate embeddings');
      // Rollback document
      await supabaseAdmin.from('brand_guide_documents').delete().eq('id', document.id);
      return reply.code(502).send({
        success: false,
        error: 'Failed to generate embeddings — check OPENAI_API_KEY',
      });
    }

    // 7. Insert chunks with embeddings
    const chunkRecords = chunks.map((content, index) => ({
      document_id: document.id,
      client_id: clientId,
      agency_id: agencyId,
      content,
      chunk_index: index,
      embedding: `[${embeddings[index].join(',')}]`, // pgvector format
      metadata: {
        charCount: content.length,
        chunkTotal: chunks.length,
      },
    }));

    const { error: chunksError } = await supabaseAdmin
      .from('brand_guide_chunks')
      .insert(chunkRecords);

    if (chunksError) {
      fastify.log.error(chunksError, 'Failed to insert brand guide chunks');
      await supabaseAdmin.from('brand_guide_documents').delete().eq('id', document.id);
      return reply.code(500).send({ success: false, error: 'Failed to store chunks' });
    }

    return reply.code(201).send({
      success: true,
      data: {
        documentId: document.id,
        version,
        chunksCreated: chunks.length,
        status: 'indexed',
      },
    });
  });

  // POST /brand-guides/search — semantic search for RAG
  fastify.post('/brand-guides/search', async (request, reply) => {
    const parseResult = SearchBrandGuideSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten(),
      });
    }

    const { clientId, query, matchCount, minSimilarity } = parseResult.data;
    const { agencyId } = request.auth;

    // Verify client access
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .single();

    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    // Generate query embedding
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch {
      return reply.code(502).send({ success: false, error: 'Failed to generate query embedding' });
    }

    // Semantic search via Supabase RPC
    const { data: results, error } = await supabaseAdmin.rpc('search_brand_guide', {
      p_client_id: clientId,
      p_query_embedding: `[${queryEmbedding.join(',')}]`,
      p_match_count: matchCount,
      p_min_similarity: minSimilarity,
    });

    if (error) {
      fastify.log.error(error, 'Semantic search failed');
      return reply.code(500).send({ success: false, error: 'Search failed' });
    }

    return reply.code(200).send({
      success: true,
      data: {
        query,
        results: results ?? [],
        count: (results ?? []).length,
      },
    });
  });
}
