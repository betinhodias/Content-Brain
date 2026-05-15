// src/middleware/auth.ts
// JWT authentication + agency context injection
import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { supabaseAdmin } from '../services/supabase.js';
import type { AuthContext } from '../types/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    auth: AuthContext;
  }
}

/**
 * Resolves the agency_id for a given Supabase user_id.
 */
async function resolveAgencyContext(userId: string): Promise<AuthContext | null> {
  const { data, error } = await supabaseAdmin
    .from('agency_users')
    .select('agency_id, role')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    userId,
    agencyId: data.agency_id,
    role: data.role as AuthContext['role'],
  };
}

/**
 * Handler that verifies Supabase JWT and injects auth context.
 * Used as preHandler in protected routes.
 */
async function authenticateHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({
      success: false,
      error: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.slice(7);

  // Verify token with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return reply.code(401).send({
      success: false,
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID',
    });
  }

  // Resolve agency context
  const context = await resolveAgencyContext(user.id);

  if (!context) {
    return reply.code(403).send({
      success: false,
      error: 'User is not associated with any active agency',
      code: 'NO_AGENCY',
    });
  }

  request.auth = context;
}

/**
 * Fastify plugin: exposes fastify.authenticate for use in route preHandlers.
 */
async function authPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest('auth', null);
  fastify.decorate('authenticate', authenticateHandler);
}

export default fp(authPlugin, {
  name: 'auth',
  fastify: '4.x',
});
