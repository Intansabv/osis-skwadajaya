-- ==============================================================================
-- E-OSIS SKWADA: ALL-IN-ONE SUPABASE MIGRATION SCRIPT
-- Copy and run this entire file in Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste -> Run
-- ==============================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tables
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) DEFAULT 'Administrator OSIS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL DEFAULT 'SMP NEGERI 2 KWADUNGAN',
    school_logo_url TEXT,
    election_title VARCHAR(255) NOT NULL DEFAULT 'Pemilihan Ketua dan Wakil Ketua OSIS',
    election_period VARCHAR(50) NOT NULL DEFAULT '2026/2027',
    status VARCHAR(50) NOT NULL DEFAULT 'Berlangsung' CHECK (status IN ('Draft', 'Belum Dimulai', 'Berlangsung', 'Selesai')),
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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

CREATE INDEX IF NOT EXISTS idx_voter_tokens_token ON public.voter_tokens(token);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_election_id ON public.voter_tokens(election_id);
CREATE INDEX IF NOT EXISTS idx_voter_tokens_status ON public.voter_tokens(status);

CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_votes_election_id ON public.votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate_id ON public.votes(candidate_id);

-- 3. Row Level Security
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active elections" ON public.elections;
CREATE POLICY "Public can view active elections" ON public.elections FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage elections" ON public.elections;
CREATE POLICY "Admins can manage elections" ON public.elections FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view active candidates" ON public.candidates;
CREATE POLICY "Public can view active candidates" ON public.candidates FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage candidates" ON public.candidates;
CREATE POLICY "Admins can manage candidates" ON public.candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage voter tokens" ON public.voter_tokens;
CREATE POLICY "Admins can manage voter tokens" ON public.voter_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view vote records" ON public.votes;
CREATE POLICY "Admins can view vote records" ON public.votes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage own profile" ON public.admin_profiles;
CREATE POLICY "Admins can manage own profile" ON public.admin_profiles FOR ALL TO authenticated USING (auth.uid() = auth_user_id) WITH CHECK (auth.uid() = auth_user_id);

-- 4. RPC Functions
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
    v_clean_token := UPPER(TRIM(p_token));

    IF v_clean_token IS NULL OR LENGTH(v_clean_token) <> 6 OR NOT (v_clean_token ~ '^[A-Z0-9]{6}$') THEN
        RETURN json_build_object(
            'valid', false,
            'code', 'INVALID_FORMAT',
            'message', 'Format token tidak valid. Token harus terdiri dari 6 karakter (A-Z, 0-9).'
        );
    END IF;

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

GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO authenticated;

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

    -- Row Lock FOR UPDATE to prevent concurrency double-vote
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

    SELECT id, number, chairman_name, vice_chairman_name, is_active
    INTO v_candidate_record
    FROM public.candidates
    WHERE id = p_candidate_id AND election_id = v_election_id;

    IF NOT FOUND OR NOT v_candidate_record.is_active THEN
        RETURN json_build_object(
            'success', false,
            'code', 'CANDIDATE_NOT_AVAILABLE',
            'message', 'Kandidat tidak tersedia atau tidak aktif.'
        );
    END IF;

    -- Atomic Insert (Secret Ballot)
    INSERT INTO public.votes (election_id, candidate_id, created_at)
    VALUES (v_election_id, p_candidate_id, timezone('utc'::text, now()));

    -- Atomic Update Token Status
    UPDATE public.voter_tokens
    SET status = 'used',
        used_at = timezone('utc'::text, now())
    WHERE id = v_token_id;

    RETURN json_build_object(
        'success', true,
        'code', 'VOTE_RECORDED',
        'message', 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi.',
        'candidate_number', v_candidate_record.number
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO public;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO authenticated;

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
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'used'),
        COUNT(*) FILTER (WHERE status = 'active')
    INTO v_total_tokens, v_used_tokens, v_unused_tokens
    FROM public.voter_tokens
    WHERE election_id = p_election_id;

    SELECT COUNT(*)
    INTO v_total_votes
    FROM public.votes
    WHERE election_id = p_election_id;

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

-- 5. Seed Initial Data
DO $$
DECLARE
    v_election_id UUID;
BEGIN
    SELECT id INTO v_election_id FROM public.elections LIMIT 1;

    IF v_election_id IS NULL THEN
        INSERT INTO public.elections (
            school_name,
            school_logo_url,
            election_title,
            election_period,
            status,
            start_at,
            end_at
        ) VALUES (
            'SMP NEGERI 2 KWADUNGAN',
            'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&auto=format&fit=crop&q=80',
            'Pemilihan Ketua dan Wakil Ketua OSIS',
            '2026/2027',
            'Berlangsung',
            timezone('utc'::text, now()),
            timezone('utc'::text, now() + interval '3 days')
        )
        RETURNING id INTO v_election_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE election_id = v_election_id) THEN
        INSERT INTO public.candidates (election_id, number, chairman_name, vice_chairman_name, photo_url, slogan, vision, mission, is_active)
        VALUES
        (
            v_election_id, 1, 'Muhammad Fauzan R.', 'Nadhira Putri A.',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
            'Kreatif, Kolaboratif, Berkarakter & Menginspirasi',
            'Mewujudkan OSIS SKWADA sebagai wadah aspirasi siswa yang inovatif, berdaya saing global, serta berlandaskan integritas dan budaya gotong royong.',
            '1. Mengoptimalkan program kerja berbasis digital dan teknologi kreatif.\n2. Meningkatkan partisipasi aktif siswa dalam kegiatan akademik dan non-akademik.\n3. Membangun komunikasi transparan antara siswa, OSIS, dan sekolah.\n4. Menyelenggarakan kegiatan sosial di lingkungan sekolah.',
            true
        ),
        (
            v_election_id, 2, 'Raditya Pratama S.', 'Syifa Azzahra K.',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
            'Bersinergi Membangun Generasi Emas SKWADA yang Berprestasi',
            'Menjadikan OSIS SKWADA sebagai pelopor perubahan positif yang solid, adaptif, serta unggul dalam kepemimpinan dan prestasi ekstrakurikuler.',
            '1. Memfasilitasi pengembangan minat dan bakat melalui kompetisi berkala.\n2. Memperkuat rasa kekeluargaan dan solidaritas lintas jurusan dan angkatan.\n3. Menciptakan lingkungan sekolah ramah, inklusif, dan bebas bullying.\n4. Program mentoring kepemimpinan bagi pengurus ekstrakurikuler.',
            true
        ),
        (
            v_election_id, 3, 'Ahmad Danial F.', 'Clarissa Maharani',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
            'Aksi Nyata, Solusi Terbuka, Prestasi Mendunia',
            'Mewujudkan OSIS SKWADA yang tanggap, berintegritas tinggi, berwawasan kewirausahaan, serta menjunjung tinggi nilai kebhinekaan.',
            '1. Membuka kotak aspirasi digital 24/7 untuk menampung ide siswa.\n2. Mendukung inkubasi wirausaha muda siswa dan pameran karya kejuruan.\n3. Mengadakan festival seni dan budaya tahunan untuk mempererat kebersamaan.\n4. Menjalin kemitraan positif dengan alumni dan komunitas edukatif.',
            true
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.voter_tokens WHERE election_id = v_election_id) THEN
        INSERT INTO public.voter_tokens (election_id, token, status, voter_code, voter_name)
        VALUES
            (v_election_id, 'A7K2P9', 'active', 'VOT-001', 'Pemilih 01'),
            (v_election_id, 'B82XQ4', 'active', 'VOT-002', 'Pemilih 02'),
            (v_election_id, 'Z9M3KL', 'active', 'VOT-003', 'Pemilih 03'),
            (v_election_id, 'C3F7Y8', 'active', 'VOT-004', 'Pemilih 04'),
            (v_election_id, 'H2P9R4', 'active', 'VOT-005', 'Pemilih 05'),
            (v_election_id, 'X4K1M9', 'active', 'VOT-006', 'Pemilih 06'),
            (v_election_id, 'E7B2V6', 'active', 'VOT-007', 'Pemilih 07'),
            (v_election_id, 'W9Q3L8', 'active', 'VOT-008', 'Pemilih 08'),
            (v_election_id, 'T5R1Z4', 'active', 'VOT-009', 'Pemilih 09'),
            (v_election_id, 'M8X2K7', 'active', 'VOT-010', 'Pemilih 10'),
            (v_election_id, 'K6N4P2', 'active', 'VOT-011', 'Pemilih 11'),
            (v_election_id, 'D9L3W8', 'active', 'VOT-012', 'Pemilih 12')
        ON CONFLICT (token) DO NOTHING;
    END IF;
END $$;


-- ==============================================================================
-- Production sync additions
-- ==============================================================================
ALTER TABLE public.elections
  ADD COLUMN IF NOT EXISTS chairman_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS chairman_nip VARCHAR(100),
  ADD COLUMN IF NOT EXISTS custom_print_date VARCHAR(100);

UPDATE public.elections
SET school_name = 'SMP NEGERI 2 KWADUNGAN'
WHERE school_name IS NULL
   OR school_name ILIKE '%SMK NEGERI 2 SURAKARTA%'
   OR school_name ILIKE '%SMK/SMA SKWADA%';

GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO anon, authenticated;
