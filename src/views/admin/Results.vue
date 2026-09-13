<template>
  <div class="admin-results">
    <!-- KOP Surat Resmi untuk Hasil Cetak Berita Acara Sesuai Format Resmi SMPN 2 Kwadungan -->
    <div :class="['kop-surat-resmi mb-3', showKopPreview ? 'd-block' : 'print-only d-none']">
      <div class="kop-header-container d-flex align-items-center justify-content-between">
        <!-- Logo Pemerintah Kabupaten Ngawi / Logo Sekolah di Kiri -->
        <div class="kop-logo-wrapper me-3 flex-shrink-0">
          <img
            :src="schoolLogoUrl"
            alt="Logo Pemerintah Kabupaten Ngawi"
            class="kop-logo-img"
            @error="onLogoLoadError"
          />
        </div>

        <!-- Teks KOP Surat Resmi di Tengah -->
        <div class="kop-text-wrapper text-center flex-grow-1">
          <h5 class="text-uppercase fw-bold mb-0 text-dark kop-instansi-1">
            PEMERINTAH KABUPATEN NGAWI
          </h5>
          <h5 class="text-uppercase fw-bold mb-0 text-dark kop-instansi-2">
            DINAS PENDIDIKAN DAN KEBUDAYAAN
          </h5>
          <h3 class="text-uppercase fw-extrabold text-dark mb-1 kop-nama-sekolah">
            SMP NEGERI 2 KWADUNGAN
          </h3>
          <p class="mb-1 text-dark kop-nomor-statistik fw-semibold">
            NSS : 20105905097 &nbsp;-&nbsp; NIS : 200970 &nbsp;-&nbsp; NPSN : 20508503
          </p>
          <p class="text-dark mb-0 kop-alamat">
            Alamat : Jl. Raya Kendung – Pojok Telp. 6285187816641 kec. Kwadungan Ngawi 63283, E-mail : smpn2kwadungan2004@gmail.com, Website : https://ngawismpn2kwadungan.blogspot.com
          </p>
        </div>

        <!-- Penyeimbang sisi kanan agar teks simetris sempurna di tengah dokumen cetak -->
        <div class="kop-logo-placeholder me-3 flex-shrink-0 d-none d-print-block" style="width: 80px; visibility: hidden;"></div>
      </div>

      <!-- Garis Ganda Pembatas KOP Surat Khas Dinas (Tebal atas, tipis bawah) -->
      <div class="kop-double-divider my-2"></div>

      <!-- Judul Dokumen Berita Acara -->
      <div class="mt-2 mb-3 text-center">
        <h5 class="fw-extrabold text-uppercase text-dark mb-0" style="font-size: 15px; text-decoration: underline; letter-spacing: 0.5px;">
          BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA
        </h5>
        <p class="small text-secondary mb-0 fw-semibold" style="font-size: 11.5px;">
          PEMILIHAN KETUA DAN WAKIL KETUA OSIS MASA BAKTI 2026/2027
        </p>
      </div>
    </div>

    <!-- Header (Disembunyikan saat cetak) -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 no-print">
      <div>
        <h3 class="fw-extrabold text-dark mb-1">Perolehan Suara (Live Count)</h3>
        <p class="text-muted mb-0">
          Hasil rekapitulasi perolehan suara pemilihan Ketua & Wakil Ketua OSIS secara langsung
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <!-- Auto Refresh Switch -->
        <div class="form-check form-switch bg-white px-3 py-2 rounded-pill border shadow-xs d-flex align-items-center gap-2 m-0">
          <input
            id="autoRefreshSwitch"
            v-model="autoRefresh"
            class="form-check-input ms-0 mt-0"
            type="checkbox"
          />
          <label class="form-check-label text-dark small fw-semibold" for="autoRefreshSwitch">
            <i class="bi bi-broadcast text-danger me-1"></i> Auto Refresh (5s)
          </label>
        </div>

        <button class="btn btn-outline-primary rounded-pill px-3" :disabled="loading" @click="fetchResultsData">
          <i :class="['bi', 'bi-arrow-clockwise', loading ? 'spin' : '', 'me-1']"></i>
          Perbarui
        </button>

        <button class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold" @click="printResults">
          <i class="bi bi-printer me-1"></i> Cetak Berita Acara
        </button>
      </div>
    </div>

    <!-- Summary Metrics Bar -->
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold">TOTAL SUARA MASUK</span>
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="fw-extrabold text-primary mb-0">{{ totalVotes }}</h2>
            <span class="text-muted small">Suara</span>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold">TOTAL PEMILIH TERDAFTAR</span>
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="fw-extrabold text-dark mb-0">{{ totalVoters }}</h2>
            <span class="text-muted small">Siswa</span>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold">TINGKAT PARTISIPASI</span>
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="fw-extrabold text-success mb-0">{{ turnoutRate }}%</h2>
            <span class="text-muted small">Tercapai</span>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-lg-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
          <span class="text-muted small fw-bold">BELUM MENGGUNAKAN SUARA</span>
          <div class="d-flex align-items-baseline gap-2">
            <h2 class="fw-extrabold text-warning mb-0">{{ unvotedCount }}</h2>
            <span class="text-muted small">Pemilih</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content: Charts & Table -->
    <div class="row g-4 mb-4">
      <!-- Left: Charts (Bar Chart & Doughnut) -->
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold text-dark mb-0">Visualisasi Hasil Perolehan Suara</h5>
            <div class="btn-group btn-group-sm">
              <button
                :class="['btn', chartType === 'bar' ? 'btn-primary' : 'btn-light border']"
                @click="chartType = 'bar'"
              >
                <i class="bi bi-bar-chart"></i> Batang
              </button>
              <button
                :class="['btn', chartType === 'doughnut' ? 'btn-primary' : 'btn-light border']"
                @click="chartType = 'doughnut'"
              >
                <i class="bi bi-pie-chart"></i> Lingkaran
              </button>
            </div>
          </div>

          <!-- Chart Canvas Container with Responsive Height -->
          <div class="position-relative w-100 d-flex align-items-center justify-content-center" style="min-height: 320px;">
            <canvas ref="chartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Right: Perolehan Suara Table Breakdown -->
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
          <h5 class="fw-bold text-dark mb-3">Klasemen Pasangan Calon</h5>

          <div v-if="results.length === 0" class="text-center py-5 text-muted">
            <i class="bi bi-bar-chart fs-1 mb-2 d-block"></i>
            Belum ada suara yang masuk.
          </div>

          <div v-else class="d-flex flex-column gap-3">
            <div
              v-for="(cand, idx) in sortedResults"
              :key="cand.id"
              class="p-3 border rounded-3 bg-light"
            >
              <div class="d-flex align-items-center justify-content-between mb-2">
                <div class="d-flex align-items-center gap-2">
                  <div class="candidate-badge-number fs-6" style="width: 36px; height: 36px;">
                    0{{ cand.number }}
                  </div>
                  <div>
                    <h6 class="fw-bold text-dark mb-0">Paslon 0{{ cand.number }}</h6>
                    <span class="text-muted small">{{ cand.chairman_name }} & {{ cand.vice_chairman_name }}</span>
                  </div>
                </div>

                <div class="text-end">
                  <span class="fw-extrabold fs-5 text-primary">{{ cand.votes }}</span>
                  <span class="text-muted small d-block">{{ cand.percentage }}%</span>
                </div>
              </div>

              <!-- Candidate Vote Progress Bar -->
              <div class="progress" style="height: 10px;">
                <div
                  :class="['progress-bar', getCandidateColorClass(idx)]"
                  role="progressbar"
                  :style="{ width: cand.percentage + '%' }"
                  :aria-valuenow="cand.percentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Printable Official Recap Table -->
    <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
      <div class="card-header bg-white border-0 p-4 pb-0">
        <h5 class="fw-bold text-dark mb-1">Rincian Lengkap Hasil Suara Sah</h5>
        <p class="text-muted small mb-0">Rekapitulasi resmi surat suara digital</p>
      </div>

      <div class="table-responsive p-4 pt-3">
        <table class="table table-bordered align-middle mb-0 text-center">
          <thead class="table-light">
            <tr>
              <th style="width: 80px;">No. Urut</th>
              <th class="text-start">Nama Calon Ketua & Wakil</th>
              <th>Perolehan Suara</th>
              <th>Persentase</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cand, idx) in sortedResults" :key="cand.id">
              <td class="fw-bold fs-5 text-primary">0{{ cand.number }}</td>
              <td class="text-start">
                <strong class="text-dark">{{ cand.chairman_name }}</strong> &bull;
                <span class="text-muted">{{ cand.vice_chairman_name }}</span>
              </td>
              <td class="fw-bold fs-5 text-dark">{{ cand.votes }} Suara</td>
              <td class="fw-bold text-primary">{{ cand.percentage }}%</td>
              <td>
                <span v-if="idx === 0 && cand.votes > 0" class="badge bg-success px-3 py-2 rounded-pill">
                  <i class="bi bi-trophy-fill me-1"></i> Suara Terbanyak
                </span>
                <span v-else class="badge bg-light text-muted border px-3 py-2 rounded-pill">
                  Peringkat {{ idx + 1 }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Toolbar Pengaturan KOP Surat & Tanda Tangan Cetak (Hanya di layar admin, disembunyikan saat cetak) -->
      <div class="no-print bg-light border-top border-bottom p-3 px-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-sliders text-primary fs-5"></i>
            <div>
              <span class="fw-bold text-dark small d-block">Pengaturan Format KOP & Tanda Tangan Berita Acara</span>
              <span class="text-muted small" style="font-size: 11.5px;">
                Sesuaikan logo instansi, nama panitia, dan tanggal yang dicetak pada Berita Acara resmi
              </span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-xs"
              @click="showKopPreview = !showKopPreview"
            >
              <i :class="['bi', showKopPreview ? 'bi-eye-slash-fill text-danger' : 'bi-eye-fill text-primary', 'me-1']"></i>
              {{ showKopPreview ? 'Sembunyikan Pratinjau KOP di Layar' : 'Pratinjau KOP di Layar' }}
            </button>
          </div>
        </div>

        <!-- Panel Ganti Logo KOP Surat -->
        <div class="p-3 bg-white rounded-3 border mb-3 shadow-xs">
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="border rounded p-1 bg-light text-center flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 58px; height: 68px;">
                <img
                  :src="schoolLogoUrl"
                  alt="Logo Preview"
                  class="w-100 h-100"
                  style="object-fit: contain;"
                  @error="onLogoLoadError"
                />
              </div>
              <div>
                <div class="fw-bold text-dark small mb-0">Logo KOP Surat Berita Acara</div>
                <div class="text-muted small" style="font-size: 11.5px;">
                  Gunakan tombol <strong>Upload File Logo</strong> dari komputer atau tentukan path / URL gambar logo.
                </div>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <!-- Hidden input file upload -->
              <input
                type="file"
                ref="logoFileInputRef"
                class="d-none"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                @change="handleLogoFileUpload"
              />
              <button
                type="button"
                class="btn btn-sm btn-primary rounded-pill px-3 shadow-xs fw-semibold"
                @click="triggerLogoUpload"
              >
                <i class="bi bi-cloud-arrow-up-fill me-1"></i> Upload Logo Baru
              </button>

              <button
                type="button"
                class="btn btn-sm btn-outline-secondary rounded-pill px-3"
                @click="resetSchoolLogo"
                title="Kembalikan ke logo standar Kabupaten Ngawi"
              >
                <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Logo
              </button>
            </div>
          </div>

          <!-- Input URL / Path Logo -->
          <div class="mt-2 pt-2 border-top">
            <div class="row g-2 align-items-center">
              <div class="col-md-3">
                <label class="form-label small text-secondary fw-semibold mb-0">
                  <i class="bi bi-link-45deg me-1"></i>Path / URL File Logo:
                </label>
              </div>
              <div class="col-md-9">
                <div class="input-group input-group-sm">
                  <input
                    type="text"
                    class="form-control rounded-start-pill"
                    v-model="schoolLogoUrl"
                    @change="saveLogoUrl"
                    placeholder="Contoh: /logo-ngawi.svg atau /logo-sekolah.png atau https://..."
                  />
                  <button class="btn btn-outline-primary rounded-end-pill px-3" type="button" @click="saveLogoUrl">
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel Tanda Tangan & Tanggal -->
        <div class="row g-2">
          <div class="col-md-5">
            <label class="form-label small text-secondary fw-semibold mb-1">Nama Ketua Panitia (Cetak):</label>
            <input
              type="text"
              class="form-control form-control-sm rounded-pill"
              v-model="committeeChairmanName"
              placeholder=""
            />
          </div>
          <div class="col-md-3">
            <label class="form-label small text-secondary fw-semibold mb-1">NIS / NIP Ketua:</label>
            <input
              type="text"
              class="form-control form-control-sm rounded-pill"
              v-model="committeeChairmanNip"
              placeholder=""
            />
          </div>
          <div class="col-md-4">
            <label class="form-label small text-secondary fw-semibold mb-1">Tanggal Berita Acara:</label>
            <input
              type="text"
              class="form-control form-control-sm rounded-pill"
              v-model="customPrintDate"
              :placeholder="currentDateFormatted"
            />
          </div>
        </div>
      </div>

      <!-- Format Pengesahan & Tanda Tangan Akhir Berita Acara Sesuai Permintaan User -->
      <div class="berita-acara-signatures p-4 pt-4 bg-white">
        <!-- 1. TANDA TANGAN KETUA PANITIA DI KANAN BAWAH AKHIR BERITA ACARA -->
        <div class="d-flex justify-content-end mb-4">
          <div class="signature-box-chairman text-center" style="min-width: 270px;">
            <p class="mb-1 text-secondary small">Kwadungan, {{ currentDateFormatted }}</p>
            <p class="fw-bold text-dark mb-0">Ketua Panitia Pemilihan OSIS,</p>
            <!-- Ruang tanda tangan resmi -->
            <div class="signature-space my-4" style="height: 65px;"></div>
            <p class="fw-bold text-dark mb-0 text-decoration-underline" style="font-size: 14px;">
              ( {{ committeeChairmanName.trim() || '..................................................' }} )
            </p>
            <p class="text-muted small mb-0">
              NIS / NIP. {{ committeeChairmanNip.trim() || '......................................' }}
            </p>
          </div>
        </div>

        <!-- 2. DI BAWAHNYA ADA TANDA TANGAN PASLON 1, TANDA TANGAN PASLON 2, DAN TANDA TANGAN PASLON 3 -->
        <div class="pt-4 border-top border-dashed">
          <div class="text-center mb-3">
            <span class="fw-bold text-dark text-uppercase small tracking-wide">
              Saksi Pasangan Calon Ketua & Wakil Ketua OSIS:
            </span>
          </div>

          <div class="row text-center g-3 justify-content-center">
            <!-- Tanda Tangan Paslon 1 -->
            <div class="col-4">
              <div class="signature-card-paslon p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <span class="badge bg-primary text-white mb-2 px-2 py-1 rounded-pill" style="font-size: 10px;">
                    PASLON 01
                  </span>
                  <div class="fw-bold text-dark mb-1" style="font-size: 13px;">
                    Tanda Tangan Paslon 1
                  </div>
                  <div class="text-secondary small mb-1" style="font-size: 11px;">
                    {{  }} &bull; {{  }}
                  </div>
                </div>
                <!-- Ruang tanda tangan -->
                <div class="signature-space my-3" style="height: 55px;"></div>
                <div class="fw-bold text-dark" style="font-size: 12px;">
                  ( .................................................. )
                </div>
              </div>
            </div>

            <!-- Tanda Tangan Paslon 2 -->
            <div class="col-4">
              <div class="signature-card-paslon p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <span class="badge bg-info text-white mb-2 px-2 py-1 rounded-pill" style="font-size: 10px;">
                    PASLON 02
                  </span>
                  <div class="fw-bold text-dark mb-1" style="font-size: 13px;">
                    Tanda Tangan Paslon 2
                  </div>
                  <div class="text-secondary small mb-1" style="font-size: 11px;">
                    {{ p}} &bull; {{ }}
                  </div>
                </div>
                <!-- Ruang tanda tangan -->
                <div class="signature-space my-3" style="height: 55px;"></div>
                <div class="fw-bold text-dark" style="font-size: 12px;">
                  ( .................................................. )
                </div>
              </div>
            </div>

            <!-- Tanda Tangan Paslon 3 -->
            <div class="col-4">
              <div class="signature-card-paslon p-3 border rounded-3 bg-light bg-opacity-50 h-100 d-flex flex-column justify-content-between">
                <div>
                  <span class="badge bg-success text-white mb-2 px-2 py-1 rounded-pill" style="font-size: 10px;">
                    PASLON 03
                  </span>
                  <div class="fw-bold text-dark mb-1" style="font-size: 13px;">
                    Tanda Tangan Paslon 3
                  </div>
                  <div class="text-secondary small mb-1" style="font-size: 11px;">
                    {{ }} &bull; {{  }}
                  </div>
                </div>
                <!-- Ruang tanda tangan -->
                <div class="signature-space my-3" style="height: 55px;"></div>
                <div class="fw-bold text-dark" style="font-size: 12px;">
                  ( .................................................. )
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { votingService } from '../../services/votingService';
import { tokenService } from '../../services/tokenService';
import { settingsService } from '../../services/settingsService';
import { useElectionStore } from '../../stores/election';

Chart.register(...registerables);

const electionStore = useElectionStore();
const loading = ref(false);
const autoRefresh = ref(true);
let refreshTimer = null;

const chartCanvas = ref(null);
let chartInstance = null;
const chartType = ref('bar');

const results = ref([]);
const totalVoters = ref(0);

const totalVotes = computed(() => {
  return results.value.reduce((acc, c) => acc + (c.votes ?? c.vote_count ?? 0), 0);
});

const turnoutRate = computed(() => {
  if (totalVoters.value === 0) return 0;
  return parseFloat(((totalVotes.value / totalVoters.value) * 100).toFixed(1));
});

const unvotedCount = computed(() => {
  return Math.max(0, totalVoters.value - totalVotes.value);
});

const sortedResults = computed(() => {
  const sum = totalVotes.value;
  return [...results.value]
    .map((c) => {
      const v = c.votes ?? c.vote_count ?? 0;
      return {
        ...c,
        votes: v,
        vote_count: v,
        percentage: sum > 0 ? parseFloat(((v / sum) * 100).toFixed(1)) : 0,
      };
    })
    .sort((a, b) => (b.votes || 0) - (a.votes || 0));
});

const palette = [
  '#0F4C81', // SKWADA Blue
  '#2563EB', // Blue 600
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#8B5CF6', // Purple 500
  '#EC4899', // Pink 500
];

// =========================================================================
// 🏢 PENGATURAN KOP SURAT & LOGO SEKOLAH (HASIL CETAK BERITA ACARA)
// =========================================================================
// CARA MENGGANTI LOGO:
// 1. Lewat Kode: Taruh file logo Anda di folder 'public/' (misal: /public/logo-sekolah.png)
//    lalu ubah nilai DEFAULT_SCHOOL_LOGO di bawah ini menjadi path file Anda:
//    const DEFAULT_SCHOOL_LOGO = '/logo-sekolah.png';
//
// 2. Lewat Browser: Buka halaman Perolehan Suara di panel Admin, klik tombol
//    "Upload Logo Baru" atau masukkan link gambar di kolom "Path / URL File Logo".
// =========================================================================
const DEFAULT_SCHOOL_LOGO = '/logo-ngawi.svg';

const showKopPreview = ref(false);
const logoFileInputRef = ref(null);
const schoolLogoUrl = ref(DEFAULT_SCHOOL_LOGO);

function triggerLogoUpload() {
  logoFileInputRef.value?.click();
}

async function handleLogoFileUpload(event) {
  const target = event.target;
  const file = target?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const result = e.target?.result;
    if (result && typeof result === 'string') {
      try {
        const url = await settingsService.uploadSchoolLogo(file);
        schoolLogoUrl.value = url;
        await electionStore.updateElection({ school_logo_url: url });
      } catch (err) {
        console.error('Gagal mengunggah logo:', err);
        schoolLogoUrl.value = electionStore.election?.school_logo_url || DEFAULT_SCHOOL_LOGO;
      }
    }
  };
  reader.readAsDataURL(file);
}

async function saveLogoUrl() {
  if (!schoolLogoUrl.value || !schoolLogoUrl.value.trim()) {
    schoolLogoUrl.value = DEFAULT_SCHOOL_LOGO;
  }
  const cleanUrl = schoolLogoUrl.value.trim();
  try {
    await electionStore.updateElection({ school_logo_url: cleanUrl });
  } catch (err) {
    console.warn('Could not sync logo URL to server:', err);
  }
}

async function resetSchoolLogo() {
  schoolLogoUrl.value = DEFAULT_SCHOOL_LOGO;
  try {
    await electionStore.updateElection({ school_logo_url: DEFAULT_SCHOOL_LOGO });
  } catch (err) {
    console.warn('Could not reset logo on server:', err);
  }
}

function onLogoLoadError() {
  if (schoolLogoUrl.value !== DEFAULT_SCHOOL_LOGO) {
    schoolLogoUrl.value = DEFAULT_SCHOOL_LOGO;
  }
}

// Data Pengesahan Berita Acara (Ketua Panitia & Tanggal)
const committeeChairmanName = ref('');
const committeeChairmanNip = ref('');
const customPrintDate = ref('');

let chairmanSyncDebounce = null;
function syncChairmanToServer() {
  if (chairmanSyncDebounce) clearTimeout(chairmanSyncDebounce);
  chairmanSyncDebounce = setTimeout(async () => {
    try {
      await electionStore.updateElection({
        chairman_name: committeeChairmanName.value,
        chairman_nip: committeeChairmanNip.value,
        custom_print_date: customPrintDate.value,
      });
    } catch (e) {
      // ignore
    }
  }, 500);
}

watch(committeeChairmanName, (val) => {
  syncChairmanToServer();
});

watch(committeeChairmanNip, (val) => {
  syncChairmanToServer();
});

watch(customPrintDate, (val) => {
  syncChairmanToServer();
});

// Urutan Kandidat Paslon 1, Paslon 2, Paslon 3 untuk Tanda Tangan
const candidatesByNumber = computed(() => {
  const list = [...results.value].sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
  if (list.length >= 3) return list;

  const defaultList = [
    { number: 1, chairman_name: 'Muhammad Fauzan R.', vice_chairman_name: 'Nadhira Putri A.', votes: 0, percentage: 0 },
    { number: 2, chairman_name: 'Raditya Pratama S.', vice_chairman_name: 'Syifa Azzahra K.', votes: 0, percentage: 0 },
    { number: 3, chairman_name: 'Ahmad Danial F.', vice_chairman_name: 'Clarissa Maharani', votes: 0, percentage: 0 },
  ];

  return defaultList.map((def) => {
    const found = list.find((c) => Number(c.number) === def.number);
    return found ? found : def;
  });
});

const paslon1 = computed(() => candidatesByNumber.value.find((c) => Number(c.number) === 1) || candidatesByNumber.value[0]);
const paslon2 = computed(() => candidatesByNumber.value.find((c) => Number(c.number) === 2) || candidatesByNumber.value[1]);
const paslon3 = computed(() => candidatesByNumber.value.find((c) => Number(c.number) === 3) || candidatesByNumber.value[2]);

const currentDateFormatted = computed(() => {
  if (customPrintDate.value && customPrintDate.value.trim()) {
    return customPrintDate.value.trim();
  }
  try {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (e) {
    return '14 September 2026';
  }
});

function getCandidateColorClass(index) {
  const classes = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning text-dark', 'bg-secondary'];
  return classes[index % classes.length];
}

async function fetchResultsData() {
  loading.value = true;
  try {
    await electionStore.fetchElection();
    const election = electionStore.election;
    if (election) {
      if (election.school_logo_url) {
        schoolLogoUrl.value = election.school_logo_url;
      }
      if (election.chairman_name !== undefined && election.chairman_name !== null) {
        if (!committeeChairmanName.value && election.chairman_name) {
          committeeChairmanName.value = election.chairman_name;
        }
      }
      if (election.chairman_nip !== undefined && election.chairman_nip !== null) {
        if (!committeeChairmanNip.value && election.chairman_nip) {
          committeeChairmanNip.value = election.chairman_nip;
        }
      }
    }

    const electionId = election?.id;
    const [resData, tokenList] = await Promise.all([
      votingService.getResults(electionId),
      tokenService.getTokens(electionId),
    ]);

    results.value = Array.isArray(resData) ? resData : (resData?.candidates || []);
    totalVoters.value = resData?.total_tokens || tokenList.length;

    renderChart();
  } catch (err) {
    console.error('Error fetching voting results:', err);
  } finally {
    loading.value = false;
  }
}

function renderChart() {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = results.value.map((c) => `0${c.number}. ${c.chairman_name}`);
  const data = results.value.map((c) => c.votes ?? c.vote_count ?? 0);

  const colors = results.value.map((_, i) => palette[i % palette.length]);

  chartInstance = new Chart(chartCanvas.value, {
    type: chartType.value,
    data: {
      labels,
      datasets: [
        {
          label: 'Jumlah Suara',
          data,
          backgroundColor: colors,
          borderRadius: chartType.value === 'bar' ? 8 : 0,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartType.value === 'doughnut',
          position: 'bottom',
        },
      },
      scales:
        chartType.value === 'bar'
          ? {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
            }
          : {},
    },
  });
}

function printResults() {
  window.print();
}

watch(chartType, () => {
  renderChart();
});

watch(autoRefresh, (enabled) => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (enabled) {
    refreshTimer = setInterval(fetchResultsData, 5000);
  }
});

onMounted(() => {
  fetchResultsData();
  refreshTimer = setInterval(fetchResultsData, 5000);
});

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  if (chartInstance) chartInstance.destroy();
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.shadow-xs {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
.border-dashed {
  border-style: dashed !important;
}

/* Tipografi & Tata Letak KOP Surat Resmi */
.kop-surat-resmi {
  font-family: 'Times New Roman', Times, 'Liberation Serif', serif;
  color: #111827;
  padding: 4px 8px;
}

.kop-logo-wrapper {
  width: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kop-logo-img {
  width: 85px;
  max-width: 90px;
  height: 95px;
  object-fit: contain;
}

.kop-instansi-1 {
  font-size: 15px;
  letter-spacing: 0.5px;
  line-height: 1.25;
}

.kop-instansi-2 {
  font-size: 15.5px;
  letter-spacing: 0.5px;
  line-height: 1.25;
}

.kop-nama-sekolah {
  font-size: 20px;
  letter-spacing: 0.8px;
  line-height: 1.25;
  margin-top: 2px;
}

.kop-nomor-statistik {
  font-size: 12px;
  letter-spacing: 0.5px;
  line-height: 1.3;
}

.kop-alamat {
  font-size: 10px;
  line-height: 1.35;
}

.kop-double-divider {
  border-top: 3px solid #000000;
  border-bottom: 1.2px solid #000000;
  height: 4px;
  margin: 6px 0 10px 0;
}

.signature-card-paslon {
  background-color: #f8fafc;
  transition: all 0.2s ease;
}

/* Format Khusus Cetak Berita Acara (Print Mode) */
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 10mm 10mm;
  }

  .no-print,
  .admin-layout > div > header,
  aside,
  nav,
  button,
  .btn,
  .modal-backdrop {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .admin-results {
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .card {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .kop-surat-resmi {
    display: block !important;
    padding: 0 !important;
    margin-bottom: 8px !important;
  }

  .kop-logo-img {
    width: 85px !important;
    max-width: 90px !important;
    height: 95px !important;
    object-fit: contain !important;
  }

  .kop-double-divider {
    border-top: 3px solid #000 !important;
    border-bottom: 1.2px solid #000 !important;
    height: 4px !important;
    margin: 6px 0 10px 0 !important;
  }

  .table {
    border: 1.5px solid #000 !important;
    margin-bottom: 0 !important;
  }

  .table th,
  .table td {
    border: 1px solid #000 !important;
    color: #000 !important;
    padding: 5px 8px !important;
    font-size: 11px !important;
  }

  .table-light {
    background-color: #f1f5f9 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .badge {
    border: 1px solid #000 !important;
    color: #000 !important;
    background: transparent !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .berita-acara-signatures {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-top: 12px !important;
    padding: 8px 0 0 0 !important;
    border-top: 1px solid #000 !important;
  }

  .signature-box-chairman {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .signature-card-paslon {
    border: 1.5px solid #000 !important;
    background: #ffffff !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
