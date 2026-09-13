<template>
  <div class="scan-token-view py-4">
    <div class="row justify-content-center">
      <div class="col-lg-7 col-xl-6">
        <div class="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
          <!-- Back button & Title -->
          <div class="d-flex align-items-center justify-content-between mb-3">
            <router-link to="/" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
              <i class="bi bi-arrow-left me-1"></i> Kembali
            </router-link>
            <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 rounded-pill">
              Scan QR Token
            </span>
            <div style="width: 70px;"></div>
          </div>

          <h4 class="fw-bold text-dark mb-1">Arahkan QR Code ke Kamera</h4>
          <p class="text-muted small mb-4">
            Posisikan kartu QR token di depan kamera hingga kode berhasil dibaca otomatis.
          </p>

          <!-- Alert Message if any -->
          <AlertMessage
            v-if="errorMessage"
            :message="errorMessage"
            type="danger"
            @close="errorMessage = null"
          />

          <!-- Validating Spinner Overlay -->
          <div v-if="isValidating" class="alert alert-info d-flex align-items-center justify-content-center gap-2 py-3 rounded-3 mb-3">
            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
            <span class="fw-semibold">Sedang memverifikasi token ke database Supabase...</span>
          </div>

          <!-- QR Scanner Component -->
          <QRScanner
            v-if="!isValidating"
            @scan-success="handleScanSuccess"
            @scan-error="handleScanError"
          />

          <hr class="my-4 border-light">

          <!-- Fallback to Manual Token Input -->
          <div class="d-flex flex-column gap-2 align-items-center">
            <p class="text-muted small mb-1">Kamera bermasalah atau tidak membaca QR?</p>
            <router-link
              to="/vote/manual"
              class="btn btn-outline-primary rounded-pill px-4 fw-semibold"
            >
              <i class="bi bi-keyboard me-2"></i> Masukkan Token Manual
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import QRScanner from '../../components/voting/QRScanner.vue';
import AlertMessage from '../../components/common/AlertMessage.vue';
import { votingService } from '../../services/votingService';
import { useVotingStore } from '../../stores/voting';

const router = useRouter();
const votingStore = useVotingStore();

const isValidating = ref(false);
const errorMessage = ref(null);

async function handleScanSuccess(tokenText) {
  if (isValidating.value) return;

  isValidating.value = true;
  errorMessage.value = null;

  try {
    const result = await votingService.validateToken(tokenText);

    if (result.valid) {
      // Store session
      votingStore.setVerifiedSession(result.token, {
        electionId: result.election_id,
        title: result.election_title,
        period: result.election_period,
        schoolName: result.school_name,
      });

      // Proceed to candidates screen
      router.push('/vote/candidates');
    } else {
      errorMessage.value = result.message || 'Token tidak valid.';
    }
  } catch (err) {
    errorMessage.value = 'Terjadi masalah koneksi ke server. Silakan coba lagi.';
  } finally {
    isValidating.value = false;
  }
}

function handleScanError(err) {
  console.warn('Scanner warning:', err);
}
</script>
