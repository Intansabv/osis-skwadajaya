<template>
  <div>
    <!-- Desktop Sidebar -->
    <aside class="d-none d-lg-flex flex-column flex-shrink-0 p-3 bg-white border-end shadow-sm" style="width: 270px; min-height: 100vh; position: sticky; top: 0;">
      <!-- Brand Header -->
      <router-link to="/admin" class="d-flex align-items-center gap-3 mb-4 text-decoration-none text-dark px-2">
        <div class="d-flex align-items-center justify-content-center bg-white rounded-3 shadow-sm border p-1" style="width: 44px; height: 44px;">
          <img
            v-if="schoolLogo"
            :src="schoolLogo"
            alt="Logo"
            style="width: 100%; height: 100%; object-fit: contain;"
          />
          <i v-else class="bi bi-box-seam-fill fs-4 text-primary"></i>
        </div>
        <div>
          <span class="fs-5 fw-bold text-dark d-block lh-sm">E-OSIS</span>
          <span class="badge bg-primary bg-opacity-10 text-primary fw-bold">SMPN 2 KWADUNGAN</span>
        </div>
      </router-link>

      <hr class="my-1 border-light">

      <!-- Navigation Links -->
      <ul class="nav nav-pills flex-column mb-auto gap-1 py-3">
        <li class="nav-item">
          <router-link
            to="/admin"
            exact
            class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary"
            active-class="active bg-primary text-white shadow-sm"
          >
            <i class="bi bi-house-door-fill fs-5"></i>
            <span class="fw-semibold">Beranda</span>
          </router-link>
        </li>

        <li class="nav-item">
          <router-link
            to="/admin/voters"
            class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary"
            active-class="active bg-primary text-white shadow-sm"
          >
            <i class="bi bi-people-fill fs-5"></i>
            <span class="fw-semibold">Siswa/Pemilih</span>
          </router-link>
        </li>

        <li class="nav-item">
          <router-link
            to="/admin/tokens"
            class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary"
            active-class="active bg-primary text-white shadow-sm"
          >
            <i class="bi bi-ticket-perforated-fill fs-5"></i>
            <span class="fw-semibold">Token Voting</span>
          </router-link>
        </li>

        <li class="nav-item">
          <router-link
            to="/admin/candidates"
            class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary"
            active-class="active bg-primary text-white shadow-sm"
          >
            <i class="bi bi-person-badge-fill fs-5"></i>
            <span class="fw-semibold">Calon Kandidat</span>
          </router-link>
        </li>

        <li class="nav-item">
          <router-link
            to="/admin/results"
            class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary"
            active-class="active bg-primary text-white shadow-sm"
          >
            <i class="bi bi-bar-chart-fill fs-5"></i>
            <span class="fw-semibold">Perolehan Suara</span>
          </router-link>
        </li>

        <li class="nav-item">
          <router-link
            to="/admin/settings"
            class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary"
            active-class="active bg-primary text-white shadow-sm"
          >
            <i class="bi bi-gear-fill fs-5"></i>
            <span class="fw-semibold">Pengaturan</span>
          </router-link>
        </li>
      </ul>

      <hr class="border-light my-2">

      <!-- View Booth & Logout -->
      <div class="d-flex flex-column gap-2">
        <router-link
          to="/"
          target="_blank"
          class="btn btn-sm btn-outline-primary rounded-pill d-flex align-items-center justify-content-center gap-2 py-2"
        >
          <i class="bi bi-display"></i>
          <span>Buka Layar Siswa</span>
        </router-link>

        <button
          type="button"
          class="btn btn-sm btn-outline-danger rounded-pill d-flex align-items-center justify-content-center gap-2 py-2"
          @click="$emit('logout')"
        >
          <i class="bi bi-box-arrow-right"></i>
          <span>Keluar</span>
        </button>
      </div>
    </aside>

    <!-- Mobile Offcanvas Sidebar -->
    <div
      class="offcanvas offcanvas-start"
      tabindex="-1"
      id="adminSidebarOffcanvas"
      aria-labelledby="adminSidebarOffcanvasLabel"
      style="width: 280px;"
    >
      <div class="offcanvas-header border-bottom">
        <div class="d-flex align-items-center gap-2">
          <div class="d-flex align-items-center justify-content-center bg-white rounded-3 shadow-sm border p-1" style="width: 36px; height: 36px;">
            <img
              v-if="schoolLogo"
              :src="schoolLogo"
              alt="Logo"
              style="width: 100%; height: 100%; object-fit: contain;"
            />
            <i v-else class="bi bi-box-seam-fill fs-5 text-primary"></i>
          </div>
          <span class="fs-5 fw-bold text-dark" id="adminSidebarOffcanvasLabel">E-OSIS SMPN 2 KWADUNGAN</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
      </div>

      <div class="offcanvas-body d-flex flex-column p-3">
        <ul class="nav nav-pills flex-column mb-auto gap-1">
          <li class="nav-item" data-bs-dismiss="offcanvas">
            <router-link to="/admin" exact class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary" active-class="active bg-primary text-white">
              <i class="bi bi-house-door-fill fs-5"></i>
              <span>Beranda</span>
            </router-link>
          </li>
          <li class="nav-item" data-bs-dismiss="offcanvas">
            <router-link to="/admin/voters" class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary" active-class="active bg-primary text-white">
              <i class="bi bi-people-fill fs-5"></i>
              <span>Siswa/Pemilih</span>
            </router-link>
          </li>
          <li class="nav-item" data-bs-dismiss="offcanvas">
            <router-link to="/admin/tokens" class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary" active-class="active bg-primary text-white">
              <i class="bi bi-ticket-perforated-fill fs-5"></i>
              <span>Token Voting</span>
            </router-link>
          </li>
          <li class="nav-item" data-bs-dismiss="offcanvas">
            <router-link to="/admin/candidates" class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary" active-class="active bg-primary text-white">
              <i class="bi bi-person-badge-fill fs-5"></i>
              <span>Calon Kandidat</span>
            </router-link>
          </li>
          <li class="nav-item" data-bs-dismiss="offcanvas">
            <router-link to="/admin/results" class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary" active-class="active bg-primary text-white">
              <i class="bi bi-bar-chart-fill fs-5"></i>
              <span>Perolehan Suara</span>
            </router-link>
          </li>
          <li class="nav-item" data-bs-dismiss="offcanvas">
            <router-link to="/admin/settings" class="nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary" active-class="active bg-primary text-white">
              <i class="bi bi-gear-fill fs-5"></i>
              <span>Pengaturan</span>
            </router-link>
          </li>
        </ul>

        <hr class="border-light my-3">

        <button
          type="button"
          class="btn btn-outline-danger w-100 rounded-pill py-2"
          data-bs-dismiss="offcanvas"
          @click="$emit('logout')"
        >
          <i class="bi bi-box-arrow-right me-2"></i> Keluar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useElectionStore } from '../../stores/election';

defineEmits(['logout']);

const electionStore = useElectionStore();
const schoolLogo = computed(() => {
  return (
    electionStore.election?.school_logo_url || '/logo-ngawi.svg'
  );
});
</script>

<style scoped>
.nav-link {
  transition: all 0.2s ease;
}
.nav-link:hover:not(.active) {
  background-color: #f1f5f9;
  color: #0f4c81 !important;
}
</style>
