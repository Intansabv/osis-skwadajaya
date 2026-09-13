<template>
  <div
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.7); z-index: 1060;"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
        <!-- Header Banner -->
        <div class="bg-primary text-white p-4 text-center">
          <div class="d-inline-flex p-3 bg-white bg-opacity-20 rounded-circle mb-2">
            <i class="bi bi-shield-check fs-1 text-white"></i>
          </div>
          <h4 class="fw-bold mb-1">Konfirmasi Pilihan Suara</h4>
          <p class="small text-white-70 mb-0">Pastikan pilihan Anda sudah benar sebelum dikirim</p>
        </div>

        <div class="modal-body p-4 text-center">
          <p class="text-muted fw-medium mb-3">Apakah Anda yakin ingin memilih pasangan calon berikut?</p>

          <!-- Candidate Summary Card -->
          <div v-if="candidate" class="card border border-primary border-opacity-25 bg-light rounded-3 p-3 mb-3">
            <div class="d-flex align-items-center gap-3 text-start">
              <div class="candidate-badge-number fs-4" style="width: 48px; height: 48px;">
                0{{ candidate.number }}
              </div>
              <div class="overflow-hidden flex-grow-1">
                <div class="badge bg-primary px-2 py-1 mb-1">Pasangan Calon No. 0{{ candidate.number }}</div>
                <h5 class="fw-bold text-dark mb-0">{{ candidate.chairman_name }}</h5>
                <p class="text-secondary small mb-0">& {{ candidate.vice_chairman_name }}</p>
              </div>
            </div>
          </div>

          <div class="alert alert-warning d-flex align-items-center gap-2 p-2 px-3 rounded-3 small text-start mb-0">
            <i class="bi bi-exclamation-circle-fill text-warning fs-5 flex-shrink-0"></i>
            <span>Pilihan yang telah dikirim bersifat <strong>final</strong> dan token Anda tidak dapat digunakan kembali.</span>
          </div>
        </div>

        <div class="modal-footer border-0 p-4 pt-0 d-flex gap-2 justify-content-center">
          <button
            type="button"
            class="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold"
            :disabled="isSubmitting"
            @click="$emit('cancel')"
          >
            <i class="bi bi-arrow-left me-1"></i> Kembali
          </button>

          <button
            type="button"
            class="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
            :disabled="isSubmitting"
            @click="$emit('confirm')"
          >
            <span v-if="isSubmitting" class="spinner-border spinner-border-sm" role="status"></span>
            <i v-else class="bi bi-check2-circle fs-5"></i>
            <span>{{ isSubmitting ? 'Mengirim Suara...' : 'YA, KIRIM SUARA' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  candidate: {
    type: Object,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['confirm', 'cancel']);
</script>
