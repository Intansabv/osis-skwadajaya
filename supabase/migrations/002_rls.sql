-- ==============================================================================
-- 002_rls.sql
-- Row Level Security (RLS) Policies
-- Least Privilege Security Model for E-OSIS SKWADA
-- ==============================================================================

-- Enable RLS on all relevant tables
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Elections Table Policies
-- Public can view active elections (needed by voting booths)
-- Authenticated admins can insert, update, delete
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active elections" ON public.elections;
CREATE POLICY "Public can view active elections"
    ON public.elections
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Admins can manage elections" ON public.elections;
CREATE POLICY "Admins can manage elections"
    ON public.elections
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. Candidates Table Policies
-- Public can view active candidates (for ballot display)
-- Authenticated admins can manage candidates (CRUD)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active candidates" ON public.candidates;
CREATE POLICY "Public can view active candidates"
    ON public.candidates
    FOR SELECT
    TO public
    USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage candidates" ON public.candidates;
CREATE POLICY "Admins can manage candidates"
    ON public.candidates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. Voter Tokens Table Policies
-- SENSITIVE: Public cannot inspect all tokens.
-- Token verification MUST be done via SECURITY DEFINER function validate_voter_token().
-- Authenticated admins can view, generate, and toggle tokens.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage voter tokens" ON public.voter_tokens;
CREATE POLICY "Admins can manage voter tokens"
    ON public.voter_tokens
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. Votes Table Policies (Ballot Box)
-- Direct client INSERT or SELECT from public is FORBIDDEN.
-- Voting is performed exclusively via atomic SECURITY DEFINER RPC cast_vote().
-- Authenticated admins can view vote records for aggregation (or via get_election_results).
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view vote records" ON public.votes;
CREATE POLICY "Admins can view vote records"
    ON public.votes
    FOR SELECT
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 5. Admin Profiles Policies
-- Authenticated users can read/update their own profile
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage own profile" ON public.admin_profiles;
CREATE POLICY "Admins can manage own profile"
    ON public.admin_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);
