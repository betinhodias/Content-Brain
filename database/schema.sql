-- ============================================================
-- Creative Brain — Database Schema (FIXED FOR PERMISSIONS)
-- Multi-tenant SaaS for marketing content automation
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- TABLE: agencies
-- ============================================================
CREATE TABLE IF NOT EXISTS agencies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  freepik_api_key_encrypted  TEXT,
  openrouter_api_key_encrypted TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: agency_users
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL, -- Isolated from auth.users for schema permission reasons
  role        TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, user_id)
);

-- ============================================================
-- TABLE: clients
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  industry    TEXT,
  brand_summary TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, slug)
);

-- ============================================================
-- TABLE: pipelines
-- ============================================================
CREATE TABLE IF NOT EXISTS pipelines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  created_by  UUID,
  content_type TEXT NOT NULL,
  topic       TEXT NOT NULL,
  tone        TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  error       TEXT,
  copy_output    JSONB,
  visual_output  JSONB,
  motion_output  JSONB,
  thumb_output   JSONB,
  approved_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HELPER FUNCTION (IN PUBLIC SCHEMA)
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_agency_id()
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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;

-- Simple Policies
DROP POLICY IF EXISTS "clients_all_own_agency" ON clients;
CREATE POLICY "clients_all_own_agency" ON clients
  FOR ALL
  USING (agency_id = get_user_agency_id());

DROP POLICY IF EXISTS "pipelines_all_own_agency" ON pipelines;
CREATE POLICY "pipelines_all_own_agency" ON pipelines
  FOR ALL
  USING (agency_id = get_user_agency_id());

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- TABLE: brand_guide_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_guide_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: brand_guide_chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_guide_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES brand_guide_documents(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(1536), -- text-embedding-3-small generates 1536 dims
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (Brand Guides)
-- ============================================================
ALTER TABLE brand_guide_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guide_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_guide_documents_own_agency" ON brand_guide_documents;
CREATE POLICY "brand_guide_documents_own_agency" ON brand_guide_documents
  FOR ALL USING (agency_id = get_user_agency_id());

DROP POLICY IF EXISTS "brand_guide_chunks_own_agency" ON brand_guide_chunks;
CREATE POLICY "brand_guide_chunks_own_agency" ON brand_guide_chunks
  FOR ALL USING (agency_id = get_user_agency_id());

-- ============================================================
-- FUNCTION: search_brand_guide
-- ============================================================
CREATE OR REPLACE FUNCTION search_brand_guide(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_client_id UUID,
  p_agency_id UUID
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    brand_guide_chunks.id,
    brand_guide_chunks.content,
    1 - (brand_guide_chunks.embedding <=> query_embedding) AS similarity
  FROM brand_guide_chunks
  WHERE brand_guide_chunks.client_id = p_client_id
    AND brand_guide_chunks.agency_id = p_agency_id
    AND 1 - (brand_guide_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY brand_guide_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- TABLE: assets
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  asset_type  TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'thumb')),
  storage_path TEXT NOT NULL,
  mime_type   TEXT,
  size_bytes  BIGINT,
  width       INTEGER,
  height      INTEGER,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_own_agency" ON assets;
CREATE POLICY "assets_own_agency" ON assets
  FOR ALL USING (agency_id = get_user_agency_id());
