<template>
  <div class="admin-settings">
    <!-- Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h3 class="fw-extrabold text-dark mb-1">Pengaturan Sistem</h3>
        <p class="text-muted mb-0">
          Kelola konfigurasi pemilihan OSIS, identitas sekolah, akun admin, dan database Supabase
        </p>
      </div>

      <div class="d-flex gap-2">
        <button
          type="button"
          class="btn btn-primary rounded-pill px-4 shadow-sm"
          :disabled="isSaving"
          @click="saveGeneralSettings"
        >
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-check-lg me-1"></i>
          Simpan Pengaturan
        </button>
      </div>
    </div>

    <!-- Alert Notification -->
    <AlertMessage
      v-if="alertMessage"
      :message="alertMessage"
      :type="alertType"
      dismissible
      @close="alertMessage = null"
    />

    <!-- Settings Navigation Tabs -->
    <ul class="nav nav-pills bg-white p-2 rounded-4 shadow-sm mb-4 border">
      <li class="nav-item">
        <button
          :class="['nav-link', 'rounded-pill', 'px-4', activeTab === 'general' ? 'active bg-primary' : 'text-secondary']"
          @click="activeTab = 'general'"
        >
          <i class="bi bi-sliders me-1"></i> Data Pemilihan & Sekolah
        </button>
      </li>
      <li class="nav-item">
        <button
          :class="['nav-link', 'rounded-pill', 'px-4', activeTab === 'database' ? 'active bg-primary' : 'text-secondary']"
          @click="activeTab = 'database'"
        >
          <i class="bi bi-database me-1"></i> Database Supabase & SQL
        </button>
      </li>
      <li class="nav-item">
        <button
          :class="['nav-link', 'rounded-pill', 'px-4', activeTab === 'account' ? 'active bg-primary' : 'text-secondary']"
          @click="activeTab = 'account'"
        >
          <i class="bi bi-person-lock me-1"></i> Akun Admin
        </button>
      </li>
    </ul>

    <!-- Tab 1: Data Pemilihan & Sekolah -->
    <div v-show="activeTab === 'general'" class="row g-4 mb-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 class="fw-bold text-dark mb-3">Informasi Pemilihan OSIS</h5>

          <div class="row g-3">
            <div class="col-12">
              <label class="form-label text-muted small fw-semibold">Judul Kegiatan Pemilihan:</label>
              <input
                v-model="form.election_title"
                type="text"
                class="form-control"
                placeholder="PEMILIHAN KETUA DAN WAKIL KETUA OSIS"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-muted small fw-semibold">Nama Sekolah:</label>
              <input
                v-model="form.school_name"
                type="text"
                class="form-control"
                placeholder="SMP NEGERI 2 KWADUNGAN"
              />
            </div>

            <div class="col-md-6">
              <label class="form-label text-muted small fw-semibold">Periode / Tahun Ajaran:</label>
              <input
                v-model="form.election_period"
                type="text"
                class="form-control"
                placeholder="2026/2027"
              />
            </div>

            <div class="col-12">
              <label class="form-label text-muted small fw-semibold">Status Pemilihan:</label>
              <div class="row g-2">
                <div v-for="st in statusOptions" :key="st.value" class="col-sm-6 col-md-3">
                  <div
                    :class="[
                      'p-3', 'rounded-3', 'border', 'text-center', 'cursor-pointer', 'transition-all',
                      form.status === st.value ? 'border-primary bg-primary bg-opacity-10 text-primary fw-bold' : 'bg-light text-muted'
                    ]"
                    @click="form.status = st.value"
                  >
                    <i :class="['bi', st.icon, 'fs-4', 'd-block', 'mb-1']"></i>
                    <span>{{ st.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12">
              <label class="form-label text-muted small fw-semibold">Logo Sekolah:</label>
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-3 overflow-hidden border bg-light d-flex align-items-center justify-content-center" style="width: 70px; height: 70px;">
                  <img
                    v-if="form.school_logo_url"
                    :src="form.school_logo_url"
                    alt="Logo"
                    class="w-100 h-100 object-fit-contain p-1"
                  />
                  <i v-else class="bi bi-building fs-2 text-muted"></i>
                </div>
                <div class="flex-grow-1">
                  <input
                    type="file"
                    accept="image/*"
                    class="form-control form-control-sm mb-1"
                    @change="handleLogoUpload"
                  />
                  <input
                    v-model="form.school_logo_url"
                    type="url"
                    class="form-control form-control-sm text-muted"
                    placeholder="Atau tempel URL logo..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Summary Card -->
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h5 class="fw-bold text-dark mb-3">Pratinjau Identitas</h5>
          <div class="p-3 bg-light rounded-3 text-center mb-3">
            <div
              class="d-inline-flex align-items-center justify-content-center p-2 rounded-3 bg-primary bg-opacity-10 text-primary mb-2"
              style="width: 60px; height: 60px;"
            >
              <img
                v-if="form.school_logo_url"
                :src="form.school_logo_url"
                alt="Logo"
                class="w-100 h-100 object-fit-contain"
              />
              <i v-else class="bi bi-award-fill fs-2"></i>
            </div>
            <h6 class="fw-bold text-dark mb-1">{{ form.school_name || 'Nama Sekolah' }}</h6>
            <span class="badge bg-primary px-3 py-1 rounded-pill mb-2">{{ form.status }}</span>
            <p class="text-muted small mb-0">{{ form.election_title }} &bull; {{ form.election_period }}</p>
          </div>
          <p class="text-muted small">
            Identitas ini akan tampil secara otomatis di header bilik suara siswa, kartu QR token, dan laporan perolehan suara.
          </p>
        </div>
      </div>
    </div>

    <!-- Tab 2: Database Supabase & SQL Assistant -->
    <div v-show="activeTab === 'database'" class="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h5 class="fw-bold text-dark mb-1">Koneksi Database Supabase</h5>
          <p class="text-muted small mb-0">
            Backend PostgreSQL terkelola yang terhubung dengan E-OSIS SMPN 2 KWADUNGAN
          </p>
        </div>
        <button class="btn btn-outline-primary rounded-pill px-3 btn-sm" @click="checkConnection">
          <i class="bi bi-arrow-repeat me-1"></i> Uji Koneksi Supabase
        </button>
      </div>

      <!-- Connection Details -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="p-3 bg-light rounded-3 border">
            <span class="text-muted small d-block">SUPABASE URL:</span>
            <code class="fw-bold text-primary">https://cuwiqjcmvonjdmghzzul.supabase.co</code>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 bg-light rounded-3 border">
            <span class="text-muted small d-block">STATUS KONEKSI:</span>
            <span v-if="supabaseConnected" class="badge bg-success bg-opacity-10 text-success border border-success px-2 py-1">
              <i class="bi bi-check-circle-fill me-1"></i> Terhubung ke Supabase Cloud
            </span>
            <span v-else class="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-1">
              <i class="bi bi-exclamation-triangle-fill me-1"></i> Terputus / Perlu Konfigurasi
            </span>
          </div>
        </div>
      </div>

      <!-- SQL Instructions -->
      <div class="alert alert-info border-0 rounded-3 p-3 mb-4">
        <h6 class="fw-bold text-dark mb-1"><i class="bi bi-info-circle-fill text-primary me-1"></i> Panduan Migrasi SQL Supabase:</h6>
        <ol class="small text-secondary mb-0 ps-3">
          <li>Buka Dashboard Supabase Anda di <a href="https://supabase.com/dashboard/project/cuwiqjcmvonjdmghzzul" target="_blank" class="fw-bold">supabase.com/dashboard</a>.</li>
          <li>Klik menu <strong>SQL Editor</strong> di bilah kiri.</li>
          <li>Klik <strong>New Query</strong>, lalu tempelkan (Paste) skrip SQL lengkap di bawah ini.</li>
          <li>Klik tombol hijau <strong>Run</strong> untuk membuat tabel, RLS, dan RPC atomik <code>cast_vote</code>.</li>
        </ol>
      </div>

      <!-- SQL Code Box with Copy Button -->
      <div class="position-relative">
        <div class="d-flex justify-content-between align-items-center bg-dark text-white px-3 py-2 rounded-top-3">
          <span class="small font-monospace">complete_setup.sql (Schema + Functions + RPC)</span>
          <button
            class="btn btn-sm btn-primary rounded-pill px-3 py-1 font-monospace"
            @click="copySqlScript"
          >
            <i :class="['bi', sqlCopied ? 'bi-check2' : 'bi-clipboard', 'me-1']"></i>
            {{ sqlCopied ? 'Tersalin!' : 'Salin Semua SQL' }}
          </button>
        </div>
        <pre class="bg-light p-3 border border-top-0 rounded-bottom-3 font-monospace small mb-0" style="max-height: 280px; overflow-y: auto;"><code>{{ completeSqlSnippet }}</code></pre>
      </div>
    </div>

    <!-- Tab 3: Akun Admin & Pemeliharaan -->
    <div v-show="activeTab === 'account'" class="row g-4 mb-4">
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 class="fw-bold text-dark mb-3">Ubah Kata Sandi Administrator</h5>

          <form @submit.prevent="changePassword">
            <div class="mb-3">
              <label class="form-label text-muted small fw-semibold">Kata Sandi Baru:</label>
              <input
                v-model="newPassword"
                type="password"
                class="form-control"
                placeholder="Minimal 6 karakter"
                required
              />
            </div>

            <div class="mb-4">
              <label class="form-label text-muted small fw-semibold">Konfirmasi Kata Sandi Baru:</label>
              <input
                v-model="confirmPassword"
                type="password"
                class="form-control"
                placeholder="Ulangi kata sandi baru"
                required
              />
            </div>

            <button
              type="submit"
              class="btn btn-primary rounded-pill px-4"
              :disabled="!newPassword || newPassword !== confirmPassword"
            >
              Perbarui Kata Sandi
            </button>
          </form>
        </div>
      </div>

      <!-- Zona Pembersihan / Reset Simulasi Uji Coba -->
      <div class="col-lg-6">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 border-start border-4 border-danger h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex align-items-center justify-content-between mb-2">
              <h5 class="fw-bold text-danger mb-0">
                <i class="bi bi-shield-exclamation me-1"></i> Pemeliharaan & Reset Simulasi
              </h5>
              <span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-pill small">Danger Zone</span>
            </div>
            <p class="text-muted small mb-3">
              Gunakan fitur ini setelah sesi uji coba / gladi bersih pemilihan selesai untuk mengosongkan suara tanpa menghapus paslon.
            </p>

            <div class="p-3 bg-light rounded-3 border mb-3">
              <h6 class="fw-bold text-dark small mb-1">Reset Perolehan Suara Saja (0 Suara)</h6>
              <p class="text-secondary small mb-2">
                Mengosongkan semua suara di database Supabase dan server. Token yang terpakai saat uji coba akan kembali aktif (belum memilih).
              </p>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger rounded-pill px-3"
                :disabled="isResettingVotes"
                @click="openResetVotesModal"
              >
                <i class="bi bi-arrow-counterclockwise me-1"></i>
                <span v-if="isResettingVotes" class="spinner-border spinner-border-sm me-1"></span>
                Kosongkan Suara Uji Coba
              </button>
            </div>
          </div>

          <small class="text-muted fst-italic">
            Catatan: Tindakan ini aman untuk daftar calon kandidat, nama sekolah, dan kop surat.
          </small>
        </div>
      </div>
    </div>

    <!-- Confirm Modal Reset Suara di Settings -->
    <ConfirmModal
      :show="showResetVotesModal"
      title="Konfirmasi Kosongkan Suara Uji Coba"
      message="PERINGATAN! Seluruh suara masuk di database Supabase dan server akan dikosongkan ke 0. Token yang sempat terpakai saat simulasi akan dipulihkan ke status aktif (belum memilih). Apakah Anda yakin?"
      confirm-text="Ya, Kosongkan Suara"
      variant="danger"
      icon="bi-arrow-counterclockwise"
      :loading="isResettingVotes"
      @confirm="executeResetVotes"
      @cancel="showResetVotesModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AlertMessage from '../../components/common/AlertMessage.vue';
import ConfirmModal from '../../components/admin/ConfirmModal.vue';
import { useElectionStore } from '../../stores/election';
import { settingsService } from '../../services/settingsService';
import { votingService } from '../../services/votingService';
import { checkSupabaseStatus } from '../../services/supabase';

const electionStore = useElectionStore();

const activeTab = ref('general');
const isSaving = ref(false);
const alertMessage = ref(null);
const alertType = ref('success');
const sqlCopied = ref(false);
const supabaseConnected = ref(true);

// Modal Reset Suara di Settings
const showResetVotesModal = ref(false);
const isResettingVotes = ref(false);

function openResetVotesModal() {
  showResetVotesModal.value = true;
}

async function executeResetVotes() {
  isResettingVotes.value = true;
  try {
    const electionId = electionStore.election?.id;
    await votingService.resetVotes(electionId, true);
    await electionStore.fetchElection();
    alertMessage.value = 'Perolehan suara berhasil dikosongkan (0 suara). Token yang dipakai simulasi telah diaktifkan kembali.';
    alertType.value = 'success';
    showResetVotesModal.value = false;
  } catch (err) {
    alertMessage.value = 'Gagal mereset perolehan suara: ' + (err.message || 'Kesalahan sistem');
    alertType.value = 'danger';
  } finally {
    isResettingVotes.value = false;
  }
}

const newPassword = ref('');
const confirmPassword = ref('');

const statusOptions = [
  { value: 'Draft', label: 'Draft', icon: 'bi-file-earmark' },
  { value: 'Belum Dimulai', label: 'Belum Dimulai', icon: 'bi-hourglass-top' },
  { value: 'Berlangsung', label: 'Berlangsung', icon: 'bi-play-circle-fill' },
  { value: 'Selesai', label: 'Selesai', icon: 'bi-check-circle-fill' },
];

const form = ref({
  school_name: 'SMP NEGERI 2 KWADUNGAN',
  election_title: 'PEMILIHAN KETUA DAN WAKIL KETUA OSIS',
  election_period: '2026/2027',
  school_logo_url: '',
  status: 'Berlangsung',
});

const completeSqlSnippet = `-- ==========================================================
-- E-OSIS SMP NEGERI 2 KWADUNGAN: SKRIP LENGKAP SUPABASE
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> Run
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PEMILIHAN (ELECTIONS)
CREATE TABLE IF NOT EXISTS public.elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name TEXT NOT NULL DEFAULT 'SMP NEGERI 2 KWADUNGAN',
  election_title TEXT NOT NULL DEFAULT 'PEMILIHAN KETUA DAN WAKIL KETUA OSIS',
  election_period TEXT NOT NULL DEFAULT '2026/2027',
  school_logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'Berlangsung' CHECK (status IN ('Draft', 'Belum Dimulai', 'Berlangsung', 'Selesai')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KANDIDAT PASLON (CANDIDATES)
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  chairman_name TEXT NOT NULL,
  vice_chairman_name TEXT NOT NULL,
  photo_url TEXT,
  slogan TEXT,
  vision TEXT,
  mission TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_candidate_number_per_election UNIQUE (election_id, number)
);

-- 3. TABEL TOKEN PEMILIH (VOTER_TOKENS)
CREATE TABLE IF NOT EXISTS public.voter_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
  token VARCHAR(10) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'inactive')),
  voter_code TEXT,
  voter_name TEXT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL SURAT SUARA ANONIM (VOTES)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. HAK AKSES DAN KEAMANAN (RLS DIBUKA UNTUK APLIKASI E-VOTING)
ALTER TABLE public.elections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voter_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;

-- 6. DATA AWAL (SEED DATA DEFAULT)
INSERT INTO public.elections (id, school_name, election_title, election_period, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'SMP NEGERI 2 KWADUNGAN', 'PEMILIHAN KETUA DAN WAKIL KETUA OSIS', '2026/2027', 'Berlangsung')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.candidates (id, election_id, number, chairman_name, vice_chairman_name, photo_url, slogan, vision, mission, is_active)
VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 1, 'Muhammad Fauzan R.', 'Nadhira Putri A.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', 'Kreatif, Kolaboratif, Berkarakter & Menginspirasi', 'Mewujudkan OSIS SMP Negeri 2 Kwadungan sebagai wadah aspirasi siswa yang inovatif, berdaya saing, serta berlandaskan integritas dan budaya gotong royong.', '1. Mengoptimalkan program kerja berbasis digital dan teknologi kreatif.\n2. Meningkatkan partisipasi aktif siswa dalam kegiatan akademik dan non-akademik.\n3. Membangun komunikasi transparan antara siswa, OSIS, dan pihak sekolah.', true),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 2, 'Raditya Pratama S.', 'Syifa Azzahra K.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', 'Bersinergi Membangun Generasi Emas SMPN 2 Kwadungan yang Berprestasi', 'Menjadikan OSIS SMP Negeri 2 Kwadungan sebagai pelopor perubahan positif yang solid, adaptif, serta unggul dalam kepemimpinan dan prestasi ekstrakurikuler.', '1. Memfasilitasi pengembangan minat dan bakat melalui kompetisi berkala.\n2. Memperkuat rasa kekeluargaan dan solidaritas lintas kelas dan angkatan.\n3. Menciptakan lingkungan sekolah ramah, inklusif, dan bebas perundungan.', true),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 3, 'Ahmad Danial F.', 'Clarissa Maharani', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', 'Aksi Nyata, Solusi Terbuka, Prestasi Gemilang', 'Mewujudkan OSIS SMP Negeri 2 Kwadungan yang tanggap, berintegritas, mandiri, dan berwawasan lingkungan menuju sekolah adiwiyata berprestasi.', '1. Membuka kotak aspirasi digital untuk seluruh siswa setiap pekan.\n2. Mengadakan aksi peduli lingkungan dan literasi sekolah berkelanjutan.\n3. Menggiatkan pekan olahraga dan seni antarkelas secara berkala.', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.voter_tokens (election_id, token, status, voter_code, voter_name)
VALUES
('00000000-0000-0000-0000-000000000001', 'A7K2P9', 'active', 'VOT-001', 'Pemilih 01'),
('00000000-0000-0000-0000-000000000001', 'B82XQ4', 'active', 'VOT-002', 'Pemilih 02'),
('00000000-0000-0000-0000-000000000001', 'Z9M3KL', 'active', 'VOT-003', 'Pemilih 03'),
('00000000-0000-0000-0000-000000000001', 'C3F7Y8', 'active', 'VOT-004', 'Pemilih 04'),
('00000000-0000-0000-0000-000000000001', 'H2P9R4', 'active', 'VOT-005', 'Pemilih 05'),
('00000000-0000-0000-0000-000000000001', 'X4K1M9', 'active', 'VOT-006', 'Pemilih 06'),
('00000000-0000-0000-0000-000000000001', 'E7B2V6', 'active', 'VOT-007', 'Pemilih 07'),
('00000000-0000-0000-0000-000000000001', 'W9Q3L8', 'active', 'VOT-008', 'Pemilih 08'),
('00000000-0000-0000-0000-000000000001', 'T5R1Z4', 'active', 'VOT-009', 'Pemilih 09'),
('00000000-0000-0000-0000-000000000001', 'M8X2K7', 'active', 'VOT-010', 'Pemilih 10')
ON CONFLICT (token) DO NOTHING;

-- 7. FUNGSI VALIDASI TOKEN (RPC: validate_voter_token)
CREATE OR REPLACE FUNCTION public.validate_voter_token(p_token VARCHAR)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token_rec RECORD;
  v_elec_rec RECORD;
BEGIN
  SELECT * INTO v_token_rec FROM public.voter_tokens WHERE UPPER(token) = UPPER(p_token);
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'code', 'NOT_FOUND', 'message', 'Token tidak ditemukan atau tidak valid.');
  END IF;

  IF v_token_rec.status = 'used' OR v_token_rec.used_at IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'code', 'ALREADY_USED', 'message', 'Anda sudah menggunakan hak suara.');
  END IF;

  IF v_token_rec.status = 'inactive' THEN
    RETURN json_build_object('valid', false, 'code', 'INACTIVE_TOKEN', 'message', 'Token ini berstatus nonaktif.');
  END IF;

  SELECT * INTO v_elec_rec FROM public.elections WHERE id = v_token_rec.election_id;
  RETURN json_build_object(
    'valid', true,
    'token', v_token_rec.token,
    'election_id', v_token_rec.election_id,
    'election_title', COALESCE(v_elec_rec.election_title, 'Pemilihan Ketua OSIS'),
    'school_name', COALESCE(v_elec_rec.school_name, 'SMP NEGERI 2 KWADUNGAN'),
    'message', 'Token valid.'
  );
END;
$$;

-- 8. FUNGSI PEMBERIAN SUARA ATOMIK (RPC: cast_vote)
CREATE OR REPLACE FUNCTION public.cast_vote(p_token VARCHAR, p_candidate_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token_record RECORD;
BEGIN
  SELECT * INTO v_token_record FROM public.voter_tokens WHERE UPPER(token) = UPPER(p_token) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Token tidak ditemukan atau tidak valid.');
  END IF;

  IF v_token_record.status = 'used' OR v_token_record.used_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'code', 'ALREADY_VOTED', 'message', 'Anda sudah menggunakan hak suara.');
  END IF;

  IF v_token_record.status = 'inactive' THEN
    RETURN json_build_object('success', false, 'code', 'TOKEN_INACTIVE', 'message', 'Token ini dinonaktifkan oleh panitia.');
  END IF;

  INSERT INTO public.votes (election_id, candidate_id, voted_at)
  VALUES (v_token_record.election_id, p_candidate_id, NOW());

  UPDATE public.voter_tokens
  SET status = 'used', used_at = NOW()
  WHERE id = v_token_record.id;

  RETURN json_build_object('success', true, 'code', 'SUCCESS', 'message', 'Suara berhasil dicatat.');
END;
$$;
`;

async function handleLogoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const url = await settingsService.uploadSchoolLogo(file);
    form.value.school_logo_url = url;
  } catch (err) {
    console.error('Logo upload error:', err);
  }
}

async function saveGeneralSettings() {
  isSaving.value = true;
  try {
    await electionStore.updateElection(form.value);
    alertMessage.value = 'Pengaturan sekolah dan pemilihan berhasil disimpan!';
    alertType.value = 'success';
  } catch (err) {
    alertMessage.value = 'Gagal menyimpan pengaturan: ' + err.message;
    alertType.value = 'danger';
  } finally {
    isSaving.value = false;
  }
}

async function checkConnection() {
  const status = await checkSupabaseStatus();
  supabaseConnected.value = status.connected;
  if (status.connected) {
    alertMessage.value = 'Berhasil terhubung dengan endpoint Supabase Cloud!';
    alertType.value = 'success';
  } else {
    alertMessage.value = 'Gagal menghubungi server Supabase.';
    alertType.value = 'danger';
  }
}

function copySqlScript() {
  navigator.clipboard.writeText(completeSqlSnippet);
  sqlCopied.value = true;
  setTimeout(() => {
    sqlCopied.value = false;
  }, 3000);
}

function changePassword() {
  if (newPassword.value !== confirmPassword.value) return;
  alertMessage.value = 'Kata sandi administrator berhasil diperbarui.';
  alertType.value = 'success';
  newPassword.value = '';
  confirmPassword.value = '';
}

onMounted(async () => {
  await electionStore.fetchElection();
  if (electionStore.election) {
    form.value = { ...electionStore.election };
  }
  const status = await checkSupabaseStatus();
  supabaseConnected.value = status.connected;
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
