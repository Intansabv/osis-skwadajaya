<template>
  <div class="d-flex flex-column align-items-center justify-content-center p-4">
    <div
      class="spinner-border text-primary mb-3"
      :style="{ width: size, height: size }"
      role="status"
    >
      <span class="visually-hidden">Memuat...</span>
    </div>
    <p v-if="text" class="text-muted fw-medium mb-0">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Memuat data...',
  },
  size: {
    type: String,
    default: '2.5rem',
  },
});
</script>
