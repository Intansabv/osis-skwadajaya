<template>
  <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
    <div class="card-body p-4">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <span class="text-muted fw-bold text-uppercase small" style="letter-spacing: 0.5px;">{{ title }}</span>
        <div :class="['rounded-3', 'd-flex', 'align-items-center', 'justify-content-center', iconBgClass]" style="width: 44px; height: 44px;">
          <i :class="['bi', icon, iconColorClass, 'fs-4']"></i>
        </div>
      </div>

      <div class="d-flex align-items-baseline gap-2 mb-2">
        <h2 class="fw-extrabold text-dark mb-0">{{ value }}</h2>
        <span v-if="unit" class="text-muted fw-semibold small">{{ unit }}</span>
      </div>

      <div v-if="subtext" class="text-muted small">
        {{ subtext }}
      </div>

      <div v-if="showProgress" class="mt-3">
        <div class="progress" style="height: 6px;">
          <div
            :class="['progress-bar', progressBarClass]"
            role="progressbar"
            :style="{ width: progressValue + '%' }"
            :aria-valuenow="progressValue"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  value: [String, Number],
  unit: String,
  subtext: String,
  icon: {
    type: String,
    default: 'bi-bar-chart',
  },
  theme: {
    type: String,
    default: 'primary', // primary, success, warning, info, danger
  },
  showProgress: Boolean,
  progressValue: {
    type: Number,
    default: 0,
  },
});

const iconBgClass = computed(() => `bg-${props.theme} bg-opacity-10`);
const iconColorClass = computed(() => `text-${props.theme}`);
const progressBarClass = computed(() => `bg-${props.theme}`);
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
</style>
