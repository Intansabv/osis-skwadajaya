<template>
  <div
    v-if="message"
    :class="['alert', `alert-${type}`, 'd-flex', 'align-items-center', 'rounded-3', 'shadow-sm', 'mb-3']"
    role="alert"
  >
    <i :class="['bi', iconClass, 'fs-4', 'me-3']"></i>
    <div class="flex-grow-1">
      <strong v-if="title" class="d-block mb-1">{{ title }}</strong>
      <span>{{ message }}</span>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="btn-close ms-2"
      aria-label="Tutup"
      @click="$emit('close')"
    ></button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  message: String,
  title: String,
  type: {
    type: String,
    default: 'danger', // danger, success, warning, info
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close']);

const iconClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bi-check-circle-fill text-success';
    case 'warning':
      return 'bi-exclamation-triangle-fill text-warning';
    case 'info':
      return 'bi-info-circle-fill text-info';
    case 'danger':
    default:
      return 'bi-x-circle-fill text-danger';
  }
});
</script>
