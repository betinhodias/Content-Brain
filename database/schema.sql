-- ============================================================
-- Creative Brain — Database Schema
-- Multi-tenant SaaS for marketing content automation
-- ============================================================
-- Run via: supabase db reset  OR  psql -f schema.sql
-- Extensions required: pgvector, uuid-ossp
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE: agencies
-- Operators (e.g., Calie Marketing is one agency)
-- Created by: Nós Automação superadmin only
-- ============================================================
CREATE TABLE agencies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  -- Encrypted API keys for external services (stored per agency)
  freepik_api_key_encrypted  TEXT,
  openrouter_api_key_encrypted TEXT,
  -- Metadata
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: agency_users
-- Operators who log in to manage the dashboard
-- ============================================================
CREATE TABLE agency_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, user_id)
);

-- ============================================================
-- TABLE: clients
-- Tenants — each client of an agency (e.g., Calie's clients)
-- ============================================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  industry    TEXT,
  -- Brand identity summary (short, for prompt injection)
  brand_summary TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, slug)
);

-- ============================================================
-- TABLE: brand_guide_documents
-- Full Brand Guide documents uploaded per client
-- ============================================================
CREATE TABLE brand_guide_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  raw_text    TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: brand_guide_chunks
-- Chunked + vectorized pieces of Brand Guide documents
-- Used for RAG in Copy Agent
-- ============================================================
CREATE TABLE brand_guide_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES brand_guide_documents(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding   vector(1536),  -- OpenAI text-embedding-3-small
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: pipelines
-- Content creation pipeline runs
-- ============================================================
CREATE TABLE pipelines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_by  UUID REFERENCES auth.users(id),
  -- Pipeline configuration
  content_type TEXT NOT NULL CHECK (content_type IN ('carousel', 'reel', 'story', 'caption', 'thread')),
  topic       TEXT NOT NULL,
  tone        TEXT,
  -- Status tracking
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error       TEXT,
  -- Generated content (populated as agents run)
  copy_output    JSONB,
  visual_output  JSONB,
  motion_output  JSONB,
  thumb_output   JSONB,
  -- Approval
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: assets
-- Generated media files (images, videos, thumbnails)
-- ============================================================
CREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'thumbnail')),
  storage_path TEXT NOT NULL,  -- Supabase Storage path: /{agency_id}/{client_id}/{pipeline_id}/{filename}
  mime_type   TEXT NOT NULL,
  size_bytes  BIGINT,
  width       INTEGER,
  height      INTEGER,
  duration_ms INTEGER,  -- For video assets
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Performance indexes (critical for RLS + multi-tenant queries)
CREATE INDEX idx_agency_users_agency_id ON agency_users(agency_id);
CREATE INDEX idx_agency_users_user_id ON agency_users(user_id);
CREATE INDEX idx_clients_agency_id ON clients(agency_id);
CREATE INDEX idx_brand_guide_documents_client_id ON brand_guide_documents(client_id);
CREATE INDEX idx_brand_guide_chunks_client_id ON brand_guide_chunks(client_id);
CREATE INDEX idx_brand_guide_chunks_document_id ON brand_guide_chunks(document_id);
CREATE INDEX idx_pipelines_client_id ON pipelines(client_id);
CREATE INDEX idx_pipelines_agency_id ON pipelines(agency_id);
CREATE INDEX idx_assets_pipeline_id ON assets(pipeline_id);
CREATE INDEX idx_assets_client_id ON assets(client_id);

-- Vector similarity search index (HNSW for performance)
CREATE INDEX idx_brand_guide_chunks_embedding
  ON brand_guide_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guide_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guide_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Helper function: get the agency_id for the authenticated user
CREATE OR REPLACE FUNCTION auth.get_user_agency_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT agency_id
  FROM agency_users
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- agencies: users see only their own agency
CREATE POLICY "agencies_select_own" ON agencies
  FOR SELECT
  USING (id = auth.get_user_agency_id());

-- agency_users: users see only their agency's users
CREATE POLICY "agency_users_select_own" ON agency_users
  FOR SELECT
  USING (agency_id = auth.get_user_agency_id());

-- clients: operators see only their agency's clients
CREATE POLICY "clients_all_own_agency" ON clients
  FOR ALL
  USING (agency_id = auth.get_user_agency_id())
  WITH CHECK (agency_id = auth.get_user_agency_id());

-- brand_guide_documents: operators see only their agency's docs
CREATE POLICY "brand_guide_docs_all_own_agency" ON brand_guide_documents
  FOR ALL
  USING (agency_id = auth.get_user_agency_id())
  WITH CHECK (agency_id = auth.get_user_agency_id());

-- brand_guide_chunks: isolated by agency
CREATE POLICY "brand_guide_chunks_all_own_agency" ON brand_guide_chunks
  FOR ALL
  USING (agency_id = auth.get_user_agency_id())
  WITH CHECK (agency_id = auth.get_user_agency_id());

-- pipelines: isolated by agency
CREATE POLICY "pipelines_all_own_agency" ON pipelines
  FOR ALL
  USING (agency_id = auth.get_user_agency_id())
  WITH CHECK (agency_id = auth.get_user_agency_id());

-- assets: isolated by agency
CREATE POLICY "assets_all_own_agency" ON assets
  FOR ALL
  USING (agency_id = auth.get_user_agency_id())
  WITH CHECK (agency_id = auth.get_user_agency_id());

-- ============================================================
-- SEMANTIC SEARCH FUNCTION
-- Used by RAG in Copy Agent
-- ============================================================
CREATE OR REPLACE FUNCTION search_brand_guide(
  p_client_id   UUID,
  p_query_embedding vector(1536),
  p_match_count INTEGER DEFAULT 5,
  p_min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  chunk_index INTEGER,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT
    bgc.id,
    bgc.content,
    bgc.chunk_index,
    bgc.metadata,
    1 - (bgc.embedding <=> p_query_embedding) AS similarity
  FROM brand_guide_chunks bgc
  WHERE
    bgc.client_id = p_client_id
    AND bgc.agency_id = auth.get_user_agency_id()
    AND 1 - (bgc.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY bgc.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
