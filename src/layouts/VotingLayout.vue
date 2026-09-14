<template>
  <div class="voting-layout d-flex flex-column min-vh-100 bg-light">
    <!-- Clean Minimalist Header (Compact) -->
    <header class="bg-white border-bottom shadow-xs py-2">
      <div class="container d-flex align-items-center justify-content-between">
        <router-link to="/" class="d-flex align-items-center gap-2 text-decoration-none text-dark">
          <div
            class="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white shadow-sm overflow-hidden flex-shrink-0"
            style="width: 36px; height: 36px;"
          >
            <img
              v-if="electionStore.election?.school_logo_url"
              :src="electionStore.election.school_logo_url"
              alt="Logo"
              class="w-100 h-100 object-fit-contain"
            />
            <i v-else class="bi bi-box-seam-fill fs-5"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-dark fs-6 lh-1">E-OSIS {{ electionStore.election?.school_name || 'SMPN 2 KWADUNGAN' }}</span>
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-0 small" style="font-size: 0.72rem;">
                {{ electionStore.election?.status || 'Berlangsung' }}
              </span>
            </div>
            <p class="text-muted small mb-0" style="font-size: 0.75rem;">
              {{ electionStore.election?.election_title || 'Pemilihan Ketua & Wakil Ketua OSIS' }} &bull; Periode {{ electionStore.election?.election_period || '2026/2027' }}
            </p>
          </div>
        </router-link>

        <div class="d-flex align-items-center gap-2">
          <router-link
            to="/admin/login"
            class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-1"
            title="Akses Administrator"
          >
            <i class="bi bi-shield-lock"></i>
            <span class="d-none d-sm-inline small">Admin</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content Slot -->
    <main class="flex-grow-1 d-flex flex-column justify-content-center py-2 py-md-3">
      <div class="container">
        <router-view />
      </div>
    </main>

    <!-- Footer (Compact) -->
    <footer class="bg-white border-top py-2 text-center text-muted small mt-auto" style="font-size: 0.78rem;">
      <div class="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-1">
        <span>&copy; 2026 <strong>E-OSIS {{ electionStore.election?.school_name || 'SMP NEGERI 2 KWADUNGAN' }}</strong></span>
        <span class="badge bg-light text-secondary border">Rahasia &bull; Langsung &bull; Adil &bull; Jujur</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useElectionStore } from '../stores/election';

const electionStore = useElectionStore();

onMounted(() => {
  electionStore.fetchElection();
});
</script>

<style scoped>
.shadow-xs {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
</style>
