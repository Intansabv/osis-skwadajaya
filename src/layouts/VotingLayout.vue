<template>
  <div class="voting-layout d-flex flex-column min-vh-100 bg-light">
    <!-- Clean Minimalist Header -->
    <header class="bg-white border-bottom shadow-xs py-3">
      <div class="container d-flex align-items-center justify-content-between">
        <router-link to="/" class="d-flex align-items-center gap-3 text-decoration-none text-dark">
          <div
            class="d-flex align-items-center justify-content-center rounded-3 bg-primary text-white shadow-sm overflow-hidden"
            style="width: 44px; height: 44px;"
          >
            <img
              v-if="electionStore.election?.school_logo_url"
              :src="electionStore.election.school_logo_url"
              alt="Logo"
              class="w-100 h-100 object-fit-cover"
            />
            <i v-else class="bi bi-box-seam-fill fs-4"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold text-dark fs-5 lh-1">E-OSIS SMPN 2 KWADUNGAN</span>
              <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1 small">
                {{ electionStore.election?.status || 'Berlangsung' }}
              </span>
            </div>
            <p class="text-muted small mb-0 mt-1">
              {{ electionStore.election?.school_name || 'SMP NEGERI 2 KWADUNGAN' }} &bull; Periode {{ electionStore.election?.election_period || '2026/2027' }}
            </p>
          </div>
        </router-link>

        <div class="d-flex align-items-center gap-2">
          <router-link
            to="/admin/login"
            class="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1"
            title="Akses Administrator"
          >
            <i class="bi bi-shield-lock"></i>
            <span class="d-none d-sm-inline">Admin</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content Slot -->
    <main class="flex-grow-1 d-flex flex-column justify-content-center py-4">
      <div class="container">
        <router-view />
      </div>
    </main>

    <!-- Footer with school tagline -->
    <footer class="bg-white border-top py-3 text-center text-muted small mt-auto">
      <div class="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <span>&copy; 2026 <strong>E-OSIS SMP NEGERI 2 KWADUNGAN</strong> &bull; Sistem E-Voting Resmi Pemilihan Ketua & Wakil Ketua OSIS</span>
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
