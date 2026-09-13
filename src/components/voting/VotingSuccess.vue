<template>
  <div class="voting-success-container text-center py-5">
    <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 mx-auto bg-white" style="max-width: 580px;">
      <!-- Big Check Icon -->
      <div class="mb-4">
        <div class="d-inline-flex p-4 rounded-circle bg-success bg-opacity-10 text-success">
          <i class="bi bi-check-circle-fill display-1"></i>
        </div>
      </div>

      <!-- Main Headline -->
      <h1 class="fw-bold text-dark mb-3">SUARA BERHASIL DICATAT</h1>

      <p class="lead text-muted mb-4 px-3">
        Suara Anda berhasil dicatat, terima kasih telah berpartisipasi dalam Pemilihan Ketua dan Wakil Ketua OSIS.
      </p>

      <!-- Token Status Notice -->
      <div class="alert alert-info border-0 rounded-3 mb-4 py-3">
        <i class="bi bi-shield-lock-fill me-2 fs-5"></i>
        <span>Hak suara Anda telah tersimpan secara anonim dan aman. Token Anda kini telah ditutup.</span>
      </div>

      <!-- Countdown redirect indicator -->
      <div class="countdown-wrapper p-3 bg-light rounded-pill d-inline-flex align-items-center justify-content-center gap-2 mx-auto px-4 mb-3 border">
        <div class="spinner-grow spinner-grow-sm text-primary" role="status"></div>
        <span class="fw-bold text-dark">
          Kembali ke halaman awal dalam <span class="text-primary fs-5">{{ countdown }}</span> detik...
        </span>
      </div>

      <div class="mt-2">
        <button
          type="button"
          class="btn btn-sm btn-link text-decoration-none text-muted"
          @click="$emit('redirect-now')"
        >
          Selesai sekarang <i class="bi bi-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import confetti from 'canvas-confetti';

defineProps({
  countdown: {
    type: Number,
    default: 4,
  },
});

defineEmits(['redirect-now']);

onMounted(() => {
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  } catch (err) {
    console.warn('Confetti effect skipped:', err);
  }
});
</script>
