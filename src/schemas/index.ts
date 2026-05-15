// src/schemas/index.ts
// Zod validation schemas for all API endpoints
import { z } from 'zod';

// ========================
// AUTH
// ========================
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ========================
// CLIENTS
// ========================
export const CreateClientSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only'),
  industry: z.string().max(100).optional(),
  brandSummary: z.string().max(500).optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ========================
// BRAND GUIDES
// ========================
export const UploadBrandGuideSchema = z.object({
  clientId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  rawText: z.string()
    .min(100, 'Brand Guide must have at least 100 characters')
    .max(500_000, 'Brand Guide too large — max 500k characters'),
});

export const SearchBrandGuideSchema = z.object({
  clientId: z.string().uuid(),
  query: z.string().min(3).max(500),
  matchCount: z.coerce.number().int().min(1).max(20).default(5),
  minSimilarity: z.coerce.number().min(0).max(1).default(0.7),
});

// ========================
// PIPELINES
// ========================
export const CreatePipelineSchema = z.object({
  clientId: z.string().uuid(),
  contentType: z.enum(['carousel', 'reel', 'story', 'caption', 'thread']),
  topic: z.string().min(5).max(500),
  tone: z.string().max(100).optional(),
});

// ========================
// Type exports
// ========================
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type UploadBrandGuideInput = z.infer<typeof UploadBrandGuideSchema>;
export type SearchBrandGuideInput = z.infer<typeof SearchBrandGuideSchema>;
export type CreatePipelineInput = z.infer<typeof CreatePipelineSchema>;
