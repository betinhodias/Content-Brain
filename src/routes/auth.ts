// src/routes/auth.ts
// Authentication endpoints — login, token refresh, me
import type { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../services/supabase.js';
import { LoginSchema } from '../schemas/index.js';

export async function authRoutes(fastify: FastifyInstance) {

  // POST /auth/login — exchange email/password for Supabase JWT
  fastify.post('/auth/login', async (request, reply) => {
    const parseResult = LoginSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }

    const { email, password } = parseResult.data;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Fetch agency context for the logged-in user
    const { data: agencyUser } = await supabaseAdmin
      .from('agency_users')
      .select('agency_id, role, agencies(name, slug, plan)')
      .eq('user_id', data.user.id)
      .single();

    return reply.code(200).send({
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: agencyUser?.role ?? 'operator',
        },
        agency: agencyUser?.agencies ?? null,
      },
    });
  });

  // POST /auth/refresh — refresh access token
  fastify.post('/auth/refresh', async (request, reply) => {
    const body = request.body as { refreshToken?: string };

    if (!body.refreshToken) {
      return reply.code(400).send({
        success: false,
        error: 'refreshToken is required',
      });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: body.refreshToken,
    });

    if (error || !data.session) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'REFRESH_INVALID',
      });
    }

    return reply.code(200).send({
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at,
      },
    });
  });

  // GET /auth/me — get current user context (requires auth middleware)
  fastify.get('/auth/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { userId, agencyId, role } = request.auth;

    const { data: agency } = await supabaseAdmin
      .from('agencies')
      .select('id, name, slug, plan')
      .eq('id', agencyId)
      .single();

    return reply.code(200).send({
      success: true,
      data: {
        userId,
        role,
        agency,
      },
    });
  });
}
