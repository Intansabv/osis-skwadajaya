<template>
  <div class="admin-layout d-flex min-vh-100 bg-light">
    <!-- Admin Sidebar Component (No Kelas menu) -->
    <AdminSidebar class="no-print" @logout="handleLogout" />

    <!-- Main Content Area -->
    <div class="d-flex flex-column flex-grow-1 admin-main-content" style="min-width: 0;">
      <AdminHeader
        class="no-print"
        :election="electionStore.election"
        :user-profile="authStore.adminProfile"
      />

      <div class="p-3 p-lg-4 flex-grow-1 admin-content-body">
        <!-- Supabase Migration Status Banner (Informative & Helpful) -->
        <div
          v-if="!supabaseStatus.tablesReady && !dismissBanner"
          class="alert alert-warning alert-dismissible fade show rounded-4 border-0 shadow-sm mb-4 d-flex align-items-start gap-3 p-3 no-print"
          role="alert"
        >
          <i class="bi bi-database-exclamation fs-3 text-warning flex-shrink-0"></i>
          <div class="flex-grow-1">
            <h6 class="fw-bold mb-1">Database Supabase Memerlukan Migrasi SQL</h6>
            <p class="small mb-2 text-dark">
              Tabel database pusat belum siap atau belum dapat diakses. Sistem tidak lagi menggunakan database lokal sebagai cadangan agar data voting tidak terpisah antar perangkat.
              Jalankan skrip SQL di Supabase dan pastikan environment Vercel sudah berisi konfigurasi Supabase.
            </p>
            <router-link to="/admin/settings" class="btn btn-sm btn-warning text-dark fw-bold rounded-pill px-3">
              <i class="bi bi-code-slash me-1"></i> Buka Panduan & Salin Skrip SQL
            </router-link>
          </div>
          <button type="button" class="btn-close" @click="dismissBanner = true" aria-label="Close"></button>
        </div>

        <!-- Dynamic Admin Router View -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from '../components/admin/AdminSidebar.vue';
import AdminHeader from '../components/admin/AdminHeader.vue';
import { useAuthStore } from '../stores/auth';
import { useElectionStore } from '../stores/election';
import { checkSupabaseStatus } from '../services/supabase';

const router = useRouter();
const authStore = useAuthStore();
const electionStore = useElectionStore();

const supabaseStatus = ref({ connected: true, tablesReady: true });
const dismissBanner = ref(false);

async function handleLogout() {
  await authStore.logout();
  router.push('/admin/login');
}

onMounted(async () => {
  electionStore.fetchElection();
  const status = await checkSupabaseStatus();
  supabaseStatus.value = status;
});
</script>

<style>
@media print {
  .no-print,
  aside,
  nav,
  header {
    display: none !important;
  }
  .admin-layout {
    display: block !important;
    background: #ffffff !important;
    min-height: 0 !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .admin-main-content,
  .admin-content-body {
    display: block !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
  }
}
</style>
