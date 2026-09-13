-- ==============================================================================
-- 006_production_sync.sql
-- Menjadikan Supabase sebagai satu-satunya database pusat E-OSIS SKWADA.
-- Jalankan setelah migration 001-005 pada Supabase SQL Editor.
-- ======================================================================

-- Kolom tambahan untuk kebutuhan Berita Acara/KOP surat.
ALTER TABLE public.elections
  ADD COLUMN IF NOT EXISTS chairman_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS chairman_nip VARCHAR(100),
  ADD COLUMN IF NOT EXISTS custom_print_date VARCHAR(100);

-- Normalisasi nama sekolah sesuai project.
UPDATE public.elections
SET school_name = 'SMP NEGERI 2 KWADUNGAN'
WHERE school_name IS NULL
   OR school_name ILIKE '%SMK NEGERI 2 SURAKARTA%'
   OR school_name ILIKE '%SMK/SMA SKWADA%';

-- Memastikan fungsi voting tetap dapat dipanggil dari perangkat siswa.
GRANT EXECUTE ON FUNCTION public.validate_voter_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cast_vote(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO anon, authenticated;

-- Public hanya membaca data yang memang diperlukan layar voting.
DROP POLICY IF EXISTS "Public can view active elections" ON public.elections;
CREATE POLICY "Public can view active elections"
  ON public.elections FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view active candidates" ON public.candidates;
CREATE POLICY "Public can view active candidates"
  ON public.candidates FOR SELECT TO anon, authenticated USING (is_active = true);

-- Token dan data suara tidak boleh dibaca langsung oleh siswa.
-- Validasi token dan pencatatan suara dilakukan melalui RPC SECURITY DEFINER.
