-- ==============================================================================
-- 001_initial_schema.sql
-- E-OSIS SKWADA: Database Schema Definition
-- Pemilihan Ketua & Wakil Ketua OSIS
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Table: admin_profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) DEFAULT 'Administrator OSIS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. Table: elections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL DEFAULT 'SMK/SMA SKWADA',
    school_logo_url TEXT,
    election_title VARCHAR(255) NOT NULL DEFAULT 'Pemilihan Ketua dan Wakil Ketua OSIS',
    election_period VARCHAR(50) NOT NULL DEFAULT '2026/2027',
    status VARCHAR(50) NOT NULL DEFAULT 'Berlangsung' CHECK (status IN ('Draft', 'Belum Dimulai', 'Berlangsung', 'Selesai')),
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. Table: candidates
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    number INTEGER NOT NULL CHECK (number > 0),
    photo_url TEXT,
    chairman_name VARCHAR(255) NOT NULL,
    vice_chairman_name VARCHAR(255) NOT NULL,
    vision TEXT,
    mission TEXT,
    slogan VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_candidate_number_per_election UNIQUE (election_id, number)
);

-- ------------------------------------------------------------------------------
-- 4. Table: voter_tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.voter_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    token VARCHAR(6) NOT NULL UNIQUE CHECK (token ~ '^[A-Z0-9]{6}$'),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'inactive')),
    voter_code VARCHAR(100),
    voter_name VARCHAR(255),
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast token lookups
CREATE INDEX IF NOT EXISTS idx_voter_tokens_token ON public.voter_tokens(token);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_election_id ON public.voter_tokens(election_id);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_status ON public.voter_tokens(status);

-- ------------------------------------------------------------------------------
-- 5. Table: votes (Secret Ballot - NO voter identity or token reference)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_votes_election_id ON public.votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON public.votes(candidate_id);

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_elections_updated_at ON public.elections;
CREATE TRIGGER tr_elections_updated_at
    BEFORE UPDATE ON public.elections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_candidates_updated_at ON public.candidates;
CREATE TRIGGER tr_candidates_updated_at
    BEFORE UPDATE ON public.candidates
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER tr_admin_profiles_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
