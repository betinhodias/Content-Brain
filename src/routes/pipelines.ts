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

  // POST /visual — run Visual Agent for an existing pipeline
  fastify.post('/visual', async (request, reply) => {
    const { pipelineId, imageCount } = request.body as { pipelineId: string; imageCount?: number };
    const { agencyId } = request.auth;

    if (!pipelineId) {
      return reply.code(400).send({ success: false, error: 'pipelineId is required' });
    }

    // Fetch pipeline and verify ownership
    const { data: pipeline, error: pipelineError } = await supabaseAdmin
      .from('pipelines')
      .select('*, clients(name, industry, brand_summary)')
      .eq('id', pipelineId)
      .eq('agency_id', agencyId)
      .single();

    if (pipelineError || !pipeline) {
      return reply.code(404).send({ success: false, error: 'Pipeline not found' });
    }

    if (!pipeline.copy_output) {
      return reply.code(400).send({ success: false, error: 'Pipeline must have copy_output before running visual agent' });
    }

    // Set status to running so the frontend resumes polling
    await supabaseAdmin.from('pipelines').update({ status: 'running' }).eq('id', pipelineId);

    // We do not await this so it runs asynchronously, like /copy
    const { runVisualAgent } = await import('../agents/visual-agent.js');
    
    runVisualAgent({
      pipelineId: pipeline.id,
      clientId: pipeline.client_id,
      agencyId: pipeline.agency_id,
      contentType: pipeline.content_type,
      copyOutput: pipeline.copy_output,
      brandContext: pipeline.clients.brand_summary,
      clientName: pipeline.clients.name,
      industry: pipeline.clients.industry,
      imageCount: imageCount || 1,
    }).catch(err => {
      fastify.log.error(err, `[VisualAgent] Pipeline ${pipeline.id} failed`);
    });

    return reply.code(202).send({
      success: true,
      message: 'Visual Agent started. Poll GET /pipelines/:id for results.',
      pollUrl: `/pipelines/${pipeline.id}`,
    });
  });

  // POST /pipelines/motion — run Curation & Motion Agent for an existing pipeline
  fastify.post('/motion', async (request, reply) => {
    const { pipelineId, rawVideoUrl, videoStart, videoEnd } = request.body as { 
      pipelineId: string; 
      rawVideoUrl?: string; 
      videoStart?: number; 
      videoEnd?: number; 
    };
    const { agencyId } = request.auth;

    if (!pipelineId) {
      return reply.code(400).send({ success: false, error: 'pipelineId is required' });
    }

    // Fetch pipeline and verify ownership
    const { data: pipeline, error: pipelineError } = await supabaseAdmin
      .from('pipelines')
      .select('*, clients(name, industry, brand_summary)')
      .eq('id', pipelineId)
      .eq('agency_id', agencyId)
      .single();

    if (pipelineError || !pipeline) {
      return reply.code(404).send({ success: false, error: 'Pipeline not found' });
    }

    if (!pipeline.copy_output) {
      return reply.code(400).send({ success: false, error: 'Pipeline must have copy_output before running motion agent' });
    }

    // Retrieve visual assets generated by Visual Agent to pass as layers
    const { data: assets } = await supabaseAdmin
      .from('assets')
      .select('storage_path')
      .eq('pipeline_id', pipelineId)
      .eq('asset_type', 'image');

    const imageAssetUrls = assets?.map(a => {
      const { data: urlData } = supabaseAdmin.storage
        .from(process.env.STORAGE_BUCKET ?? 'creative-brain-assets')
        .getPublicUrl(a.storage_path);
      return urlData.publicUrl;
    }) || [];

    // Set status to running so the frontend resumes polling
    await supabaseAdmin.from('pipelines').update({ status: 'running' }).eq('id', pipelineId);

    // Trigger Motion Agent asynchronously (non-blocking)
    const { runMotionAgent } = await import('../agents/motion-agent.js');

    runMotionAgent({
      pipelineId: pipeline.id,
      clientId: pipeline.client_id,
      agencyId: pipeline.agency_id,
      contentType: pipeline.content_type,
      copyOutput: pipeline.copy_output,
      imageAssetUrls,
      brandTone: pipeline.tone,
      brandColors: '#000037,#FFFFFF', // Default composition color scheme
      rawVideoUrl,
      videoStart,
      videoEnd,
    }).catch(err => {
      fastify.log.error(err, `[MotionAgent] Pipeline ${pipeline.id} failed`);
    });

    return reply.code(202).send({
      success: true,
      message: 'Curation & Motion Agent started. Poll GET /pipelines/:id for results.',
      pollUrl: `/pipelines/${pipeline.id}`,
    });
  });

  // POST /pipelines/thumb — run Thumb Agent for an existing pipeline
  fastify.post('/thumb', async (request, reply) => {
    const { pipelineId } = request.body as { pipelineId: string };
    const { agencyId } = request.auth;

    if (!pipelineId) {
      return reply.code(400).send({ success: false, error: 'pipelineId is required' });
    }

    // Fetch pipeline and verify ownership
    const { data: pipeline, error: pipelineError } = await supabaseAdmin
      .from('pipelines')
      .select('*, clients(name, industry, brand_summary)')
      .eq('id', pipelineId)
      .eq('agency_id', agencyId)
      .single();

    if (pipelineError || !pipeline) {
      return reply.code(404).send({ success: false, error: 'Pipeline not found' });
    }

    if (!pipeline.copy_output) {
      return reply.code(400).send({ success: false, error: 'Pipeline must have copy_output before running thumb agent' });
    }

    // Set status to running so the frontend resumes polling
    await supabaseAdmin.from('pipelines').update({ status: 'running' }).eq('id', pipelineId);

    // Trigger Thumb Agent asynchronously (non-blocking)
    const { runThumbAgent } = await import('../agents/thumb-agent.js');

    runThumbAgent({
      pipelineId: pipeline.id,
      clientId: pipeline.client_id,
      agencyId: pipeline.agency_id,
      copyOutput: pipeline.copy_output,
      brandContext: pipeline.clients.brand_summary,
      clientName: pipeline.clients.name,
      industry: pipeline.clients.industry,
    }).catch(err => {
      fastify.log.error(err, `[ThumbAgent] Pipeline ${pipeline.id} failed`);
    });

    return reply.code(202).send({
      success: true,
      message: 'Thumb Agent started. Poll GET /pipelines/:id for results.',
      pollUrl: `/pipelines/${pipeline.id}`,
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
