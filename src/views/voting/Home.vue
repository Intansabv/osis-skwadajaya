<template>
  <div class="voting-home text-center my-auto">
    <div class="row justify-content-center">
      <div class="col-lg-8 col-xl-7">
        <!-- School & Election Branding Card -->
        <div class="card border-0 shadow-sm rounded-4 px-4 py-3 p-md-4 bg-white">
          <!-- School Logo & Emblem -->
          <div class="mb-2">
            <div
              class="d-inline-flex align-items-center justify-content-center p-2 rounded-4 bg-primary bg-opacity-10 text-primary shadow-xs"
              style="width: 64px; height: 64px;"
            >
              <img
                v-if="election?.school_logo_url"
                :src="election.school_logo_url"
                alt="Logo Sekolah"
                class="w-100 h-100 object-fit-contain"
              />
              <i v-else class="bi bi-award-fill fs-1"></i>
            </div>
          </div>

          <div class="mb-3">
            <span class="badge bg-primary px-3 py-1 rounded-pill fw-bold text-uppercase mb-1" style="font-size: 0.72rem; letter-spacing: 0.5px;">
              SISTEM E-VOTING OSIS
            </span>
            <h2 class="fw-extrabold text-dark mb-1 fs-3">
              {{ election?.election_title || 'PEMILIHAN KETUA DAN WAKIL KETUA OSIS' }}
            </h2>
            <h6 class="fw-bold text-primary mb-1">
              {{ election?.school_name || 'SMP NEGERI 2 KWADUNGAN' }}
            </h6>
            <p class="text-muted small fw-semibold mb-0">
              Tahun Ajaran / Periode {{ election?.election_period || '2026/2027' }}
            </p>
          </div>

          <!-- Status Indicator Alert -->
          <div v-if="election?.status !== 'Berlangsung'" class="alert alert-warning rounded-3 border-0 py-2 px-3 mb-3 small d-inline-flex align-items-center gap-2 mx-auto">
            <i class="bi bi-info-circle-fill fs-6"></i>
            <span v-if="election?.status === 'Belum Dimulai' || election?.status === 'Draft'">
              Pemilihan belum dimulai. Silakan menunggu instruksi panitia OSIS.
            </span>
            <span v-else-if="election?.status === 'Selesai'">
              Pemilihan telah selesai. Terima kasih atas partisipasi seluruh warga sekolah.
            </span>
            <span v-else>
              Status pemilihan: <strong>{{ election?.status }}</strong>
            </span>
          </div>

          <div v-else class="alert alert-success bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 py-1 px-3 mb-3 d-inline-flex align-items-center gap-2 mx-auto">
            <span class="spinner-grow spinner-grow-sm text-success" role="status"></span>
            <span class="fw-semibold text-success small">Pemilihan Sedang Berlangsung Aktif</span>
          </div>

          <!-- Instruction Text -->
          <div class="mb-3">
            <h5 class="fw-bold text-dark mb-1">Silakan Autentikasi untuk Memilih</h5>
            <p class="text-muted small mb-0 mx-auto" style="max-width: 480px;">
              Gunakan kartu QR Token yang telah dibagikan oleh panitia untuk masuk ke bilik suara digital.
            </p>
          </div>

          <!-- Action Buttons (Responsive side-by-side or stacked cleanly) -->
          <div class="row g-2 col-md-11 col-lg-10 mx-auto mb-2">
            <!-- 1. Scan QR Token -->
            <div class="col-12 col-sm-6">
              <router-link
                to="/vote/scan"
                class="btn btn-primary h-100 rounded-3 p-3 d-flex align-items-center justify-content-between shadow-sm transition-all text-decoration-none"
              >
                <div class="d-flex align-items-center gap-2 text-start">
                  <div class="p-2 bg-white bg-opacity-20 rounded-3 flex-shrink-0">
                    <i class="bi bi-qr-code-scan fs-4 text-white"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0 text-white">SCAN QR TOKEN</h6>
                    <span class="small text-white-70" style="font-size: 0.75rem;">Arahkan ke kamera</span>
                  </div>
                </div>
                <i class="bi bi-arrow-right-circle-fill fs-4 text-white flex-shrink-0 ms-1"></i>
              </router-link>
            </div>

            <!-- 2. Masukkan Token Manual -->
            <div class="col-12 col-sm-6">
              <router-link
                to="/vote/manual"
                class="btn btn-outline-secondary h-100 rounded-3 p-3 d-flex align-items-center justify-content-between border-2 transition-all text-decoration-none bg-white"
              >
                <div class="d-flex align-items-center gap-2 text-start">
                  <div class="p-2 bg-secondary bg-opacity-10 rounded-3 text-dark flex-shrink-0">
                    <i class="bi bi-keyboard-fill fs-4 text-secondary"></i>
                  </div>
                  <div>
                    <h6 class="fw-bold mb-0 text-dark">TOKEN MANUAL</h6>
                    <span class="small text-muted" style="font-size: 0.75rem;">Ketik 6 karakter token</span>
                  </div>
                </div>
                <i class="bi bi-arrow-right-circle fs-4 text-secondary flex-shrink-0 ms-1"></i>
              </router-link>
            </div>
          </div>

          <!-- Feature Pills -->
          <div class="d-flex justify-content-center gap-3 flex-wrap mt-3 pt-2 border-top">
            <div class="text-muted small d-flex align-items-center gap-1" style="font-size: 0.78rem;">
              <i class="bi bi-shield-check text-success"></i> Suara Rahasia & Terenkripsi
            </div>
            <div class="text-muted small d-flex align-items-center gap-1" style="font-size: 0.78rem;">
              <i class="bi bi-1-circle-fill text-primary"></i> 1 Token = 1 Suara Sah
            </div>
            <div class="text-muted small d-flex align-items-center gap-1" style="font-size: 0.78rem;">
              <i class="bi bi-person-x-fill text-info"></i> Tanpa Biodata / NISN
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useElectionStore } from '../../stores/election';

const electionStore = useElectionStore();
const election = computed(() => electionStore.election);

onMounted(() => {
  electionStore.fetchElection();
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
.btn:hover {
  transform: translateY(-2px);
}
.text-white-70 {
  color: rgba(255, 255, 255, 0.85);
}
</style>
