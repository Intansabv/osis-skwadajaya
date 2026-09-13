<template>
  <div class="manual-token-view py-4">
    <div class="row justify-content-center">
      <div class="col-lg-6 col-xl-5">
        <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white text-center">
          <!-- Back button & Badge -->
          <div class="d-flex align-items-center justify-content-between mb-4">
            <router-link to="/" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
              <i class="bi bi-arrow-left me-1"></i> Kembali
            </router-link>
            <span class="badge bg-secondary bg-opacity-10 text-secondary fw-bold px-3 py-2 rounded-pill">
              Input Manual
            </span>
            <div style="width: 70px;"></div>
          </div>

          <div class="mb-3">
            <div class="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-2">
              <i class="bi bi-keyboard-fill fs-2"></i>
            </div>
            <h3 class="fw-bold text-dark mb-1">Masukkan Token Pemilih</h3>
            <p class="text-muted small mb-0">
              Ketik 6 karakter kode token yang tertera pada kartu pemilihan Anda.
            </p>
          </div>

          <!-- Error Alert -->
          <AlertMessage
            v-if="errorMessage"
            :message="errorMessage"
            type="danger"
            @close="errorMessage = null"
          />

          <!-- Token Input Component -->
          <TokenInput
            :loading="isValidating"
            @submit-token="handleTokenSubmit"
          />

          <hr class="my-4 border-light">

          <!-- Link to QR Scanner -->
          <div class="d-flex flex-column align-items-center">
            <p class="text-muted small mb-2">Lebih suka memindai kode?</p>
            <router-link
              to="/vote/scan"
              class="btn btn-outline-secondary rounded-pill px-4 btn-sm"
            >
              <i class="bi bi-qr-code-scan me-1"></i> Buka Kamera Scanner QR
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
import TokenInput from '../../components/voting/TokenInput.vue';
import AlertMessage from '../../components/common/AlertMessage.vue';
import { votingService } from '../../services/votingService';
import { useVotingStore } from '../../stores/voting';

const router = useRouter();
const votingStore = useVotingStore();

const isValidating = ref(false);
const errorMessage = ref(null);

async function handleTokenSubmit(tokenText) {
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

      // Navigate to candidates ballot
      router.push('/vote/candidates');
    } else {
      errorMessage.value = result.message || 'Token tidak valid atau tidak ditemukan.';
    }
  } catch (err) {
    errorMessage.value = 'Terjadi kesalahan saat memvalidasi token. Silakan periksa koneksi.';
  } finally {
    isValidating.value = false;
  }
}
</script>
