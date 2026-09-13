<template>
  <header class="navbar navbar-expand bg-white border-bottom shadow-sm px-3 px-lg-4 py-2 sticky-top">
    <div class="container-fluid p-0 d-flex justify-content-between align-items-center">
      <!-- Left side: Mobile Toggle & Page context -->
      <div class="d-flex align-items-center gap-3">
        <button
          class="btn btn-light d-lg-none rounded-3 border"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminSidebarOffcanvas"
          aria-controls="adminSidebarOffcanvas"
        >
          <i class="bi bi-list fs-5"></i>
        </button>

        <div>
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <h6 class="fw-bold text-dark mb-0 fs-6">
              {{ election?.school_name || 'SMP NEGERI 2 KWADUNGAN' }}
            </h6>
            <span :class="['badge', statusBadgeClass, 'rounded-pill', 'px-2', 'py-1', 'small']">
              <i class="bi bi-circle-fill me-1" style="font-size: 6px;"></i>
              {{ election?.status || 'Berlangsung' }}
            </span>
          </div>
          <p class="text-muted small mb-0 d-none d-sm-block">
            {{ election?.election_title || 'Pemilihan Ketua dan Wakil Ketua OSIS' }} &bull; Periode {{ election?.election_period || '2026/2027' }}
          </p>
        </div>
      </div>

      <!-- Right side: Database indicator & Admin Info -->
      <div class="d-flex align-items-center gap-3">
        <!-- Live Clock -->
        <div class="d-none d-md-flex align-items-center gap-1 text-muted small bg-light px-3 py-1 rounded-pill border">
          <i class="bi bi-clock"></i>
          <span>{{ currentTime }}</span>
        </div>

        <!-- Admin Profile -->
        <div class="d-flex align-items-center gap-2">
          <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 36px; height: 36px;">
            <i class="bi bi-person-fill"></i>
          </div>
          <div class="d-none d-sm-block text-start">
            <span class="d-block fw-semibold text-dark small lh-1">{{ userProfile?.username || 'Admin' }}</span>
            <span class="text-muted text-xs" style="font-size: 11px;">Panel Administrator</span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  election: Object,
  userProfile: Object,
});

const currentTime = ref('');
let timer = null;

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const statusBadgeClass = computed(() => {
  const st = props.election?.status;
  switch (st) {
    case 'Berlangsung':
      return 'bg-success text-white';
    case 'Belum Dimulai':
      return 'bg-warning text-dark';
    case 'Selesai':
      return 'bg-secondary text-white';
    case 'Draft':
    default:
      return 'bg-light text-dark border';
  }
});
</script>
