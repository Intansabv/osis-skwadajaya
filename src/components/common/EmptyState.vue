<template>
  <div class="text-center p-5 bg-white rounded-3 border border-light shadow-sm">
    <div class="mb-3 text-muted">
      <i :class="['bi', icon, 'display-4']"></i>
    </div>
    <h5 class="fw-bold text-dark mb-2">{{ title }}</h5>
    <p class="text-muted mb-4 mx-auto" style="max-width: 420px">{{ description }}</p>
    <slot name="action"></slot>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: 'bi-inbox',
  },
  title: {
    type: String,
    default: 'Tidak Ada Data',
  },
  description: {
    type: String,
    default: 'Belum ada data yang tersedia untuk ditampilkan saat ini.',
  },
});
</script>
