// src/server.ts
// Creative Brain API — Fastify server entry point
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import authPlugin from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { clientRoutes } from './routes/clients.js';
import { brandGuideRoutes } from './routes/brand-guides.js';
import { pipelineRoutes } from './routes/pipelines.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const IS_DEV = process.env.NODE_ENV !== 'production';

// Validate required env vars on startup
const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Create Fastify instance
const fastify = Fastify({
  logger: IS_DEV
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }
    : true,
});

// ========================
// Plugins
// ========================
await fastify.register(helmet, {
  contentSecurityPolicy: false, // API-only, no HTML served
});

await fastify.register(cors, {
  origin: IS_DEV ? '*' : (process.env.ALLOWED_ORIGINS ?? '').split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (req) => (req.headers['x-real-ip'] as string | undefined) ?? req.ip,
});

// Auth plugin — decorates request.auth and exposes fastify.authenticate
await fastify.register(authPlugin);

// ========================
// Routes
// ========================
await fastify.register(authRoutes);
await fastify.register(clientRoutes);
await fastify.register(brandGuideRoutes);
await fastify.register(pipelineRoutes);

// Health check (no auth required)
fastify.get('/health', async () => ({
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
}));

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
  return reply.code(404).send({
    success: false,
    error: `Route ${request.method} ${request.url} not found`,
  });
});

// Error handler
fastify.setErrorHandler(async (error, _request, reply) => {
  fastify.log.error(error);
  return reply.code(error.statusCode ?? 500).send({
    success: false,
    error: IS_DEV ? error.message : 'Internal server error',
  });
});

// ========================
// Start
// ========================
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  fastify.log.info(`🧠 Creative Brain API running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
