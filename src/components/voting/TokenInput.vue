<template>
  <div class="token-input-wrapper text-center">
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label for="token-field" class="form-label text-muted fw-semibold mb-2">
          Masukkan 6 Karakter Token Pemilihan:
        </label>
        
        <!-- Large High-Contrast Input -->
        <div class="position-relative mx-auto" style="max-width: 360px;">
          <input
            id="token-field"
            ref="inputRef"
            type="text"
            class="form-control form-control-lg text-center fw-bold fs-2 text-primary tracking-wider font-monospace border-2 rounded-4 shadow-sm"
            style="letter-spacing: 8px; text-transform: uppercase;"
            placeholder="A7K2P9"
            maxlength="6"
            :value="tokenValue"
            :disabled="loading"
            autocomplete="off"
            autofocus
            @input="handleInput"
            @paste="handlePaste"
          />
        </div>
        <div class="form-text text-muted mt-2">
          Hanya huruf kapital (A-Z) dan angka (0-9). Contoh: <strong>A7K2P9</strong>
        </div>
      </div>

      <div class="d-grid gap-2 col-md-8 mx-auto">
        <button
          type="submit"
          class="btn btn-primary btn-lg rounded-pill py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
          :disabled="tokenValue.length !== 6 || loading"
        >
          <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
          <i v-else class="bi bi-arrow-right-circle-fill fs-5"></i>
          <span>{{ loading ? 'Memverifikasi Token...' : 'Lanjutkan ke Pemilihan' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { formatTokenInput } from '../../utils/token';

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  initialValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['submit-token']);

const tokenValue = ref(props.initialValue || '');
const inputRef = ref(null);

function handleInput(e) {
  const sanitized = formatTokenInput(e.target.value);
  tokenValue.value = sanitized;
  e.target.value = sanitized;
}

function handlePaste(e) {
  e.preventDefault();
  const pasted = e.clipboardData.getData('text');
  const sanitized = formatTokenInput(pasted);
  tokenValue.value = sanitized;
}

function handleSubmit() {
  if (tokenValue.value.length === 6 && !props.loading) {
    emit('submit-token', tokenValue.value);
  }
}

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
});
</script>

<style scoped>
.tracking-wider {
  letter-spacing: 6px;
}
input:focus {
  border-color: #0f4c81;
  box-shadow: 0 0 0 0.25rem rgba(15, 76, 129, 0.25);
}
</style>
