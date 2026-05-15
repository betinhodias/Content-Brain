// src/routes/clients.ts
// Client (tenant) CRUD — isolated by agency_id
import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../services/supabase.js';
import {
  CreateClientSchema,
  UpdateClientSchema,
} from '../schemas/index.js';

export async function clientRoutes(fastify: FastifyInstance) {

  // All client routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET / — list all clients for the agency
  fastify.get('/', async (request, reply) => {
    const { agencyId } = request.auth;

    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });

    if (error) {
      fastify.log.error(error, 'Failed to fetch clients');
      return reply.code(500).send({ success: false, error: 'Failed to fetch clients' });
    }

    return reply.code(200).send({ success: true, data });
  });

  // GET /:id — get client details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { agencyId } = request.auth;

    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('agency_id', agencyId)  // Tenant isolation enforced at app layer too
      .single();

    if (error || !data) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    return reply.code(200).send({ success: true, data });
  });

  // POST / — create new client
  fastify.post('/', async (request, reply) => {
    const parseResult = CreateClientSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten(),
      });
    }

    const { agencyId } = request.auth;
    const { name, slug, industry, brandSummary } = parseResult.data;

    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert({
        agency_id: agencyId,
        name,
        slug,
        industry,
        brand_summary: brandSummary,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {  // Unique violation
        return reply.code(409).send({
          success: false,
          error: `Slug '${slug}' is already taken in your agency`,
          code: 'SLUG_TAKEN',
        });
      }
      fastify.log.error(error, 'Failed to create client');
      return reply.code(500).send({ success: false, error: 'Failed to create client' });
    }

    return reply.code(201).send({ success: true, data });
  });

  // PUT /clients/:id — update client
  fastify.put('/clients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { agencyId } = request.auth;

    const parseResult = UpdateClientSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.flatten(),
      });
    }

    // Build update payload — only include fields that were provided
    const updates: Record<string, unknown> = {};
    const { name, slug, industry, brandSummary, isActive } = parseResult.data;
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (industry !== undefined) updates.industry = industry;
    if (brandSummary !== undefined) updates.brand_summary = brandSummary;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabaseAdmin
      .from('clients')
      .update(updates)
      .eq('id', id)
      .eq('agency_id', agencyId)  // Tenant isolation
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23505') {
        return reply.code(409).send({ success: false, error: 'Slug already taken', code: 'SLUG_TAKEN' });
      }
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    return reply.code(200).send({ success: true, data });
  });

  // DELETE /clients/:id — soft delete (deactivate)
  fastify.delete('/clients/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { agencyId, role } = request.auth;

    if (role === 'viewer') {
      return reply.code(403).send({ success: false, error: 'Insufficient permissions' });
    }

    const { error } = await supabaseAdmin
      .from('clients')
      .update({ is_active: false })
      .eq('id', id)
      .eq('agency_id', agencyId);

    if (error) {
      return reply.code(404).send({ success: false, error: 'Client not found' });
    }

    return reply.code(200).send({ success: true, data: { deactivated: true } });
  });
}
