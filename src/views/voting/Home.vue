<template>
  <div class="voting-home text-center py-4">
    <div class="row justify-content-center">
      <div class="col-lg-8 col-xl-7">
        <!-- School & Election Branding Card -->
        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4">
          <!-- School Logo & Emblem -->
          <div class="mb-3">
            <div
              class="d-inline-flex align-items-center justify-content-center p-3 rounded-4 bg-primary bg-opacity-10 text-primary shadow-xs"
              style="width: 88px; height: 88px;"
            >
              <img
                v-if="election?.school_logo_url"
                :src="election.school_logo_url"
                alt="Logo Sekolah"
                class="w-100 h-100 object-fit-contain"
              />
              <i v-else class="bi bi-award-fill display-5"></i>
            </div>
          </div>

          <div class="mb-4">
            <span class="badge bg-primary px-3 py-2 rounded-pill fw-bold text-uppercase mb-2">
              SISTEM E-VOTING OSIS
            </span>
            <h1 class="display-6 fw-extrabold text-dark mb-1">
              {{ election?.election_title || 'PEMILIHAN KETUA DAN WAKIL KETUA OSIS' }}
            </h1>
            <h5 class="fw-bold text-primary mb-2">
              {{ election?.school_name || 'SMP NEGERI 2 KWADUNGAN' }}
            </h5>
            <p class="text-muted fw-semibold mb-0">
              Tahun Ajaran / Periode {{ election?.election_period || '2026/2027' }}
            </p>
          </div>

          <!-- Status Indicator Alert -->
          <div v-if="election?.status !== 'Berlangsung'" class="alert alert-warning rounded-3 border-0 py-3 mb-4">
            <i class="bi bi-info-circle-fill fs-5 me-2"></i>
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

          <div v-else class="alert alert-success bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 py-2 mb-4 d-inline-flex align-items-center gap-2 mx-auto">
            <span class="spinner-grow spinner-grow-sm text-success" role="status"></span>
            <span class="fw-semibold text-success small">Pemilihan Sedang Berlangsung Aktif</span>
          </div>

          <!-- Instruction Text -->
          <div class="mb-4">
            <h4 class="fw-bold text-dark mb-2">Silakan Autentikasi untuk Memilih</h4>
            <p class="text-muted mb-0 mx-auto" style="max-width: 480px;">
              Gunakan kartu QR Token yang telah dibagikan oleh panitia untuk masuk ke bilik suara digital.
            </p>
          </div>

          <!-- Action Buttons (Large, Accessible) -->
          <div class="d-grid gap-3 col-md-10 mx-auto">
            <!-- 1. Scan QR Token -->
            <router-link
              to="/vote/scan"
              class="btn btn-primary btn-lg rounded-4 p-3 d-flex align-items-center justify-content-between shadow-sm transition-all"
            >
              <div class="d-flex align-items-center gap-3 text-start">
                <div class="p-2 bg-white bg-opacity-20 rounded-3">
                  <i class="bi bi-qr-code-scan fs-3 text-white"></i>
                </div>
                <div>
                  <h5 class="fw-bold mb-0 text-white">SCAN QR TOKEN</h5>
                  <span class="small text-white-70">Arahkan kartu QR ke kamera komputer</span>
                </div>
              </div>
              <i class="bi bi-arrow-right-circle-fill fs-3 text-white"></i>
            </router-link>

            <!-- 2. Masukkan Token Manual -->
            <router-link
              to="/vote/manual"
              class="btn btn-outline-secondary btn-lg rounded-4 p-3 d-flex align-items-center justify-content-between border-2 transition-all"
            >
              <div class="d-flex align-items-center gap-3 text-start">
                <div class="p-2 bg-secondary bg-opacity-10 rounded-3 text-dark">
                  <i class="bi bi-keyboard-fill fs-3 text-secondary"></i>
                </div>
                <div>
                  <h5 class="fw-bold mb-0 text-dark">MASUKKAN TOKEN MANUAL</h5>
                  <span class="small text-muted">Ketik 6 karakter token secara langsung</span>
                </div>
              </div>
              <i class="bi bi-arrow-right-circle fs-3 text-secondary"></i>
            </router-link>
          </div>

          <!-- Feature Pills -->
          <div class="d-flex justify-content-center gap-3 flex-wrap mt-5 pt-3 border-top">
            <div class="text-muted small d-flex align-items-center gap-1">
              <i class="bi bi-shield-check text-success"></i> Suara Rahasia & Terenkripsi
            </div>
            <div class="text-muted small d-flex align-items-center gap-1">
              <i class="bi bi-1-circle-fill text-primary"></i> 1 Token = 1 Suara Sah
            </div>
            <div class="text-muted small d-flex align-items-center gap-1">
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
