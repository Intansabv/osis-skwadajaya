-- ==============================================================================
-- 003_voting_function.sql
-- Supabase RPC Functions: validate_voter_token, cast_vote, get_election_results
-- Atomic, Secure, Race-Condition Protected Voting Mechanism
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. RPC: validate_voter_token
-- Validates token format, status, and election status without revealing
-- other tokens to the public client.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_voter_token(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_token VARCHAR(6);
    v_token_record RECORD;
    v_election_record RECORD;
BEGIN
    -- 1. Format sanitation
    v_clean_token := UPPER(TRIM(p_token));

    IF v_clean_token IS NULL OR LENGTH(v_clean_token) <> 6 OR NOT (v_clean_token ~ '^[A-Z0-9]{6}$') THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'INVALID_FORMAT',
            'message', 'Format token tidak valid. Token harus terdiri dari 6 karakter (A-Z, 0-9).'
        );
    END IF;

    -- 2. Lookup token in database
    SELECT id, election_id, token, status, used_at, created_at
    INTO v_token_record
    FROM public.voter_tokens
    WHERE token = v_clean_token;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'NOT_FOUND',
            'message', 'Token tidak ditemukan atau tidak valid.'
        );
    END IF;

    -- 3. Check token status
    IF v_token_record.status = 'used' OR v_token_record.used_at IS NOT NULL THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'ALREADY_USED',
            'message', 'Anda sudah menggunakan hak suara.'
        );
    END IF;

    IF v_token_record.status = 'inactive' THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'INACTIVE_TOKEN',
            'message', 'Token ini berstatus nonaktif. Silakan hubungi panitia OSIS.'
        );
    END IF;

    -- 4. Check associated election status
    SELECT id, school_name, school_logo_url, election_title, election_period, status
    INTO v_election_record
    FROM public.elections
    WHERE id = v_token_record.election_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'ELECTION_NOT_FOUND',
            'message', 'Periode pemilihan tidak ditemukan.'
        );
    END IF;

    IF v_election_record.status = 'Belum Dimulai' OR v_election_record.status = 'Draft' THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'ELECTION_NOT_STARTED',
            'message', 'Pemilihan belum dimulai. Silakan tunggu jadwal dari panitia.'
        );
    END IF;

    IF v_election_record.status = 'Selesai' THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'ELECTION_ENDED',
            'message', 'Pemilihan telah berakhir. Terima kasih atas partisipasi Anda.'
        );
    END IF;

    IF v_election_record.status <> 'Berlangsung' THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'ELECTION_INACTIVE',
            'message', 'Status pemilihan saat ini tidak aktif (' || v_election_record.status || ').'
        );
    END IF;

    -- 5. Valid token
    RETURN json_build_object(
        'valid', true,
        'token', v_clean_token,
        'election_id', v_election_record.id,
        'election_title', v_election_record.election_title,
        'election_period', v_election_record.election_period,
        'school_name', v_election_record.school_name,
        'school_logo_url', v_election_record.school_logo_url,
        'message', 'Token valid. Silakan pilih kandidat Anda.'
    );
END;
$$;

-- Grant execute to public/anon
GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. RPC: cast_vote
-- Atomic voting transaction with explicit row-level locking (FOR UPDATE)
-- Guarantees 1 Token = Exactly 1 Vote even under concurrent requests.
-- Anonymizes vote by NEVER linking token_id to the votes table.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_token TEXT,
    p_candidate_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_token VARCHAR(6);
    v_token_id UUID;
    v_election_id UUID;
    v_token_status VARCHAR(50);
    v_token_used_at TIMESTAMPTZ;
    v_election_status VARCHAR(50);
    v_candidate_record RECORD;
BEGIN
    -- 1. Sanitize token input
    v_clean_token := UPPER(TRIM(p_token));

    IF v_clean_token IS NULL OR LENGTH(v_clean_token) <> 6 OR NOT (v_clean_token ~ '^[A-Z0-9]{6}$') THEN
        RETURN json_build_object(
            'success', false,
            'code', 'INVALID_TOKEN_FORMAT',
            'message', 'Format token tidak valid.'
        );
    END IF;

    IF p_candidate_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'code', 'INVALID_CANDIDATE',
            'message', 'Silakan tentukan kandidat pilihan Anda.'
        );
    END IF;

    -- 2. ACQUIRE EXCLUSIVE ROW LOCK on voter_tokens row
    -- Any parallel transaction attempting to use the same token will block here
    -- until this transaction completes, preventing double-voting.
    SELECT id, election_id, status, used_at
    INTO v_token_id, v_election_id, v_token_status, v_token_used_at
    FROM public.voter_tokens
    WHERE token = v_clean_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'code', 'TOKEN_NOT_FOUND',
            'message', 'Token tidak ditemukan atau tidak valid.'
        );
    END IF;

    -- 3. Strict verification of token status
    IF v_token_status = 'used' OR v_token_used_at IS NOT NULL THEN
        RETURN json_build_object(
            'success', false,
            'code', 'ALREADY_VOTED',
            'message', 'Anda sudah menggunakan hak suara.'
        );
    END IF;

    IF v_token_status = 'inactive' THEN
        RETURN json_build_object(
            'success', false,
            'code', 'TOKEN_INACTIVE',
            'message', 'Token ini dinonaktifkan oleh panitia.'
        );
    END IF;

    -- 4. Verify election status
    SELECT status
    INTO v_election_status
    FROM public.elections
    WHERE id = v_election_id;

    IF NOT FOUND OR v_election_status <> 'Berlangsung' THEN
        RETURN json_build_object(
            'success', false,
            'code', 'ELECTION_NOT_ACTIVE',
            'message', 'Pemilihan sedang tidak berlangsung.'
        );
    END IF;

    -- 5. Verify candidate exists, is active, and belongs to this election
    SELECT id, number, chairman_name, vice_chairman_name, is_active
    INTO v_candidate_record
    FROM public.candidates
    WHERE id = p_candidate_id AND election_id = v_election_id;

    IF NOT FOUND OR NOT v_candidate_record.is_active THEN
        RETURN json_build_object(
            'success', false,
            'code', 'CANDIDATE_NOT_AVAILABLE',
            'message', 'Kandidat tidak tersedia atau tidak aktif dalam pemilihan ini.'
        );
    END IF;

    -- 6. ATOMIC VOTE INSERT (Anonymous: does not store token or voter ID)
    INSERT INTO public.votes (election_id, candidate_id, created_at)
    VALUES (v_election_id, p_candidate_id, timezone('utc'::text, now()));

    -- 7. ATOMIC TOKEN MARK AS USED
    UPDATE public.voter_tokens
    SET status = 'used',
        used_at = timezone('utc'::text, now())
    WHERE id = v_token_id;

    -- 8. Return success
    RETURN json_build_object(
        'success', true,
        'code', 'VOTE_RECORDED',
        'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi.',
        'candidate_number', v_candidate_record.number
    );
END;
$$;

-- Grant execute to public/anon
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO public;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. RPC: get_election_results
-- Aggregates vote counts safely without exposing raw votes
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_election_results(p_election_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_votes BIGINT;
    v_total_tokens BIGINT;
    v_used_tokens BIGINT;
    v_unused_tokens BIGINT;
    v_candidates_json JSON;
BEGIN
    -- Total registered tokens & token breakdown
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'used'),
        COUNT(*) FILTER (WHERE status = 'active')
    INTO v_total_tokens, v_used_tokens, v_unused_tokens
    FROM public.voter_tokens
    WHERE election_id = p_election_id;

    -- Total cast votes
    SELECT COUNT(*)
    INTO v_total_votes
    FROM public.votes
    WHERE election_id = p_election_id;

    -- Candidate breakdown with counts and percentages
    SELECT json_agg(c_row)
    INTO v_candidates_json
    FROM (
        SELECT
            c.id,
            c.number,
            c.chairman_name,
            c.vice_chairman_name,
            c.photo_url,
            c.slogan,
            COUNT(v.id) AS vote_count,
            CASE
                WHEN v_total_votes > 0 THEN ROUND((COUNT(v.id)::NUMERIC / v_total_votes::NUMERIC) * 100, 1)
                ELSE 0.0
            END AS percentage
        FROM public.candidates c
        LEFT JOIN public.votes v ON v.candidate_id = c.id
        WHERE c.election_id = p_election_id AND c.is_active = true
        GROUP BY c.id, c.number, c.chairman_name, c.vice_chairman_name, c.photo_url, c.slogan
        ORDER BY c.number ASC
    ) c_row;

    RETURN json_build_object(
        'election_id', p_election_id,
        'total_tokens', COALESCE(v_total_tokens, 0),
        'used_tokens', COALESCE(v_used_tokens, 0),
        'unused_tokens', COALESCE(v_unused_tokens, 0),
        'total_votes', COALESCE(v_total_votes, 0),
        'turnout_percentage', CASE
            WHEN v_total_tokens > 0 THEN ROUND((v_used_tokens::NUMERIC / v_total_tokens::NUMERIC) * 100, 1)
            ELSE 0.0
        END,
        'candidates', COALESCE(v_candidates_json, '[]'::json)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO public;
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO authenticated;
