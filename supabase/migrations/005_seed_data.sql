-- ==============================================================================
-- 005_seed_data.sql
-- Initial Seed Data for E-OSIS SKWADA
-- 1 Election, 3 Candidate Pairs, and Initial Voter Tokens
-- ==============================================================================

DO $$
DECLARE
    v_election_id UUID;
    v_cand_1 UUID;
    v_cand_2 UUID;
    v_cand_3 UUID;
BEGIN
    -- 1. Check if active election exists or create one
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

    -- 2. Insert Candidates if not exist for this election
    IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE election_id = v_election_id) THEN
        -- Paslon 01
        INSERT INTO public.candidates (
            election_id,
            number,
            chairman_name,
            vice_chairman_name,
            photo_url,
            slogan,
            vision,
            mission,
            is_active
        ) VALUES (
            v_election_id,
            1,
            'Muhammad Fauzan R.',
            'Nadhira Putri A.',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
            'Kreatif, Kolaboratif, Berkarakter & Menginspirasi',
            'Mewujudkan OSIS SKWADA sebagai wadah aspirasi siswa yang inovatif, berdaya saing global, serta berlandaskan integritas dan budaya gotong royong.',
            '1. Mengoptimalkan program kerja berbasis digital dan teknologi kreatif.
2. Meningkatkan partisipasi aktif siswa dalam kegiatan akademik dan non-akademik.
3. Membangun komunikasi yang transparan antara siswa, OSIS, dan pihak sekolah.
4. Menyelenggarakan kegiatan sosial dan pengabdian masyarakat di lingkungan sekolah.',
            true
        ) RETURNING id INTO v_cand_1;

        -- Paslon 02
        INSERT INTO public.candidates (
            election_id,
            number,
            chairman_name,
            vice_chairman_name,
            photo_url,
            slogan,
            vision,
            mission,
            is_active
        ) VALUES (
            v_election_id,
            2,
            'Raditya Pratama S.',
            'Syifa Azzahra K.',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
            'Bersinergi Membangun Generasi Emas SKWADA yang Berprestasi',
            'Menjadikan OSIS SKWADA sebagai pelopor perubahan positif yang solid, adaptif, serta unggul dalam kepemimpinan dan prestasi ekstrakurikuler.',
            '1. Memfasilitasi pengembangan minat dan bakat melalui kompetisi internal dan eksternal.
2. Memperkuat rasa kekeluargaan dan solidaritas lintas jurusan serta angkatan.
3. Menciptakan lingkungan sekolah yang ramah lingkungan, inklusif, dan bebas bullying.
4. Mengembangkan program mentoring kepemimpinan bagi pengurus ekstrakurikuler.',
            true
        ) RETURNING id INTO v_cand_2;

        -- Paslon 03
        INSERT INTO public.candidates (
            election_id,
            number,
            chairman_name,
            vice_chairman_name,
            photo_url,
            slogan,
            vision,
            mission,
            is_active
        ) VALUES (
            v_election_id,
            3,
            'Ahmad Danial F.',
            'Clarissa Maharani',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
            'Aksi Nyata, Solusi Terbuka, Prestasi Mendunia',
            'Mewujudkan OSIS SKWADA yang tanggap, berintegritas tinggi, berwawasan kewirausahaan, serta menjunjung tinggi nilai kebhinekaan.',
            '1. Membuka kotak aspirasi digital 24/7 untuk menampung kritik dan saran siswa.
2. Mendukung program inkubasi wirausaha muda siswa dan pameran karya kejuruan.
3. Mengadakan festival seni dan budaya tahunan untuk mempererat kebersamaan.
4. Menjalin kemitraan positif dengan alumni dan komunitas edukatif.',
            true
        ) RETURNING id INTO v_cand_3;
    END IF;

    -- 3. Insert Initial Voter Tokens if none exist
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
            (v_election_id, 'D9L3W8', 'active', 'VOT-012', 'Pemilih 12'),
            (v_election_id, 'Y2J7V5', 'active', 'VOT-013', 'Pemilih 13'),
            (v_election_id, 'G8P4X1', 'active', 'VOT-014', 'Pemilih 14'),
            (v_election_id, 'R3T9K6', 'active', 'VOT-015', 'Pemilih 15')
        ON CONFLICT (token) DO NOTHING;
    END IF;

END $$;
