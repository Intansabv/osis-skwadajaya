<template>
  <div
    v-if="show"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(15, 23, 42, 0.6); z-index: 1065;"
    @click.self="$emit('cancel')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content rounded-4 border-0 shadow">
        <div class="modal-body p-4 text-center">
          <div :class="['d-inline-flex', 'p-3', 'rounded-circle', `bg-${variant}`, 'bg-opacity-10', `text-${variant}`, 'mb-3']">
            <i :class="['bi', icon, 'fs-1']"></i>
          </div>
          <h5 class="fw-bold text-dark mb-2">{{ title }}</h5>
          <p class="text-muted mb-4">{{ message }}</p>

          <div class="d-flex justify-content-center gap-2">
            <button
              type="button"
              class="btn btn-outline-secondary rounded-pill px-4"
              :disabled="loading"
              @click="$emit('cancel')"
            >
              Batal
            </button>
            <button
              type="button"
              :class="['btn', `btn-${variant}`, 'rounded-pill', 'px-4', 'fw-bold']"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Konfirmasi Aksi',
  },
  message: {
    type: String,
    default: 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  },
  confirmText: {
    type: String,
    default: 'Ya, Lanjutkan',
  },
  variant: {
    type: String,
    default: 'danger',
  },
  icon: {
    type: String,
    default: 'bi-exclamation-triangle-fill',
  },
  loading: Boolean,
});

defineEmits(['confirm', 'cancel']);
</script>
