// src/routes/stats.ts
import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../services/supabase.js';

export async function statsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request, reply) => {
    const { agencyId } = request.auth;
    console.log(`[Stats] Fetching metrics for agency: ${agencyId}`);

    try {
      // 1. Total Clients
      const { count: clientCount } = await supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId);

      // 2. Total Pipelines Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: pipelineToday } = await supabaseAdmin
        .from('pipelines')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .gte('created_at', today.toISOString());

      // 3. Pending Approvals
      const { count: pendingApprovals } = await supabaseAdmin
        .from('pipelines')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'pending');

      // 4. Completed Pipelines
      const { count: completedCount } = await supabaseAdmin
        .from('pipelines')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agencyId)
        .eq('status', 'completed');

      return {
        success: true,
        data: {
          clients: clientCount || 0,
          pipelinesToday: pipelineToday || 0,
          pending: pendingApprovals || 0,
          completed: completedCount || 0
        }
      };
    } catch (err) {
      console.error('Stats error:', err);
      return reply.status(500).send({ success: false, error: 'Internal server error' });
    }
  });
}
