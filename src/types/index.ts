// src/types/index.ts
// Central TypeScript types for Creative Brain

export interface Agency {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyUser {
  id: string;
  agencyId: string;
  userId: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
}

export interface Client {
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  industry?: string;
  brandSummary?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandGuideDocument {
  id: string;
  clientId: string;
  agencyId: string;
  fileName: string;
  rawText: string;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export interface BrandGuideChunk {
  id: string;
  documentId: string;
  clientId: string;
  agencyId: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BrandGuideSearchResult {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  similarity: number;
}

export type ContentType = 'carousel' | 'reel' | 'story' | 'caption' | 'thread';
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Pipeline {
  id: string;
  clientId: string;
  agencyId: string;
  createdBy?: string;
  contentType: ContentType;
  topic: string;
  tone?: string;
  status: PipelineStatus;
  error?: string;
  copyOutput?: CopyOutput;
  visualOutput?: VisualOutput;
  motionOutput?: MotionOutput;
  thumbOutput?: ThumbOutput;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopyOutput {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  slides?: SlideContent[];  // For carousels
}

export interface SlideContent {
  index: number;
  title: string;
  body: string;
}

export interface VisualOutput {
  prompt: string;
  negativePrompt: string;
  assetIds: string[];
}

export interface MotionOutput {
  manifest: GSAPManifest;
  assetIds: string[];
}

export interface GSAPManifest {
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  layers: GSAPLayer[];
}

export interface GSAPLayer {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape';
  content?: string;
  assetUrl?: string;
  animation: {
    ease: string;
    opacity?: number;
    scale?: number;
    duration: number;
    delay?: number;
    textMask?: boolean;
  };
}

export interface ThumbOutput {
  prompt: string;
  assetId: string;
}

export interface Asset {
  id: string;
  pipelineId: string;
  clientId: string;
  agencyId: string;
  assetType: 'image' | 'video' | 'thumbnail';
  storagePath: string;
  mimeType: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationMs?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Auth context injected by middleware
export interface AuthContext {
  userId: string;
  agencyId: string;
  role: 'admin' | 'operator' | 'viewer';
}

// API Response wrappers
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
