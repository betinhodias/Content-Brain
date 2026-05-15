// src/routes/pipelines.ts
// Pipeline endpoints — create and monitor content generation pipelines
import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../services/supabase.js';
import { runCopyAgent } from '../agents/copy-agent.js';
import { CreatePipelineSchema } from '../schemas/index.js';

export async function pipelineRoutes(fastify: FastifyInstance) {

  fastify.addHook('preHandler', fastify.authenticate);

  // POST /copy — create pipeline and run Copy Agent
  fastify.post('/copy', async (request, reply) => {
    const parseResult = CreatePipelineSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten(),
      });
    }

    const { clientId, contentType, topic, tone } = parseResult.data;
    const { agencyId, userId } = request.auth;
    const additionalContext = (request.body as { additionalContext?: string }).additionalContext;

    // Verify client belongs to this agency
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .single();

    if (!client) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    // Create pipeline record
    const { data: pipeline, error: pipelineError } = await supabaseAdmin
      .from('pipelines')
      .insert({
        client_id: clientId,
        agency_id: agencyId,
        created_by: userId,
        content_type: contentType,
        topic,
        tone,
        status: 'pending',
      })
      .select()
      .single();

    if (pipelineError || !pipeline) {
      return reply.code(500).send({ success: false, error: 'Failed to create pipeline' });
    }

    // Run Copy Agent asynchronously (don't await — return immediately with pipeline ID)
    // The client polls GET /pipelines/:id for status
    runCopyAgent({
      pipelineId: pipeline.id,
      clientId,
      agencyId,
      contentType,
      topic,
      tone,
      additionalContext,
    }).catch(err => {
      fastify.log.error(err, `[CopyAgent] Pipeline ${pipeline.id} failed`);
    });

    return reply.code(202).send({
      success: true,
      data: {
        pipelineId: pipeline.id,
        status: 'pending',
        message: 'Pipeline created. Poll GET /pipelines/:id for results.',
        pollUrl: `/pipelines/${pipeline.id}`,
      },
    });
  });

  // GET /:id — poll pipeline status and retrieve results
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { agencyId } = request.auth;

    const { data: pipeline, error } = await supabaseAdmin
      .from('pipelines')
      .select('*')
      .eq('id', id)
      .eq('agency_id', agencyId)
      .single();

    if (error || !pipeline) {
      return reply.code(404).send({ success: false, error: 'Pipeline not found' });
    }

    return reply.code(200).send({
      success: true,
      data: pipeline,
    });
  });

  // GET / — list pipelines for a client
  fastify.get('/', async (request, reply) => {
    const query = request.query as { clientId?: string; status?: string; limit?: string };
    const { agencyId } = request.auth;

    let dbQuery = supabaseAdmin
      .from('pipelines')
      .select('id, client_id, content_type, topic, status, created_at, updated_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(parseInt(query.limit ?? '20', 10));

    if (query.clientId) dbQuery = dbQuery.eq('client_id', query.clientId);
    if (query.status) dbQuery = dbQuery.eq('status', query.status);

    const { data, error } = await dbQuery;

    if (error) {
      return reply.code(500).send({ success: false, error: 'Failed to fetch pipelines' });
    }

    return reply.code(200).send({ success: true, data });
  });
}
