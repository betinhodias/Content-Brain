// src/routes/auth.ts
import { FastifyInstance } from 'fastify';
import { supabaseAuthClient } from '../services/supabase.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    const { email, pass } = request.body as any;

    if (!email || !pass) {
      return reply.status(400).send({ error: 'Email e senha são obrigatórios' });
    }

    try {
      // Authenticate directly with Supabase Auth using the auth client
      const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error || !data.user || !data.session) {
        return reply.status(401).send({ 
          error: 'Credenciais inválidas ou erro no Supabase',
          details: error?.message 
        });
      }

      // Return the Supabase access_token — the middleware knows how to validate this
      return { 
        token: data.session.access_token, 
        user: {
          id: data.user.id,
          email: data.user.email
        }
      };
    } catch (err) {
      console.error('Login error:', err);
      return reply.status(500).send({ error: 'Erro interno no servidor' });
    }
  });
}
