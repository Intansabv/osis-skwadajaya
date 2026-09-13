<template>
  <div class="admin-login-view min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-7 col-lg-5 col-xl-4">
          <!-- Main Card -->
          <div class="card border-0 shadow rounded-4 overflow-hidden bg-white">
            <!-- Header Brand Banner -->
            <div class="bg-primary text-white text-center p-4">
              <div
                class="d-inline-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm mb-3 p-2"
                style="width: 76px; height: 76px;"
              >
                <img
                  v-if="!logoFailedCompletely"
                  :src="displayLogo"
                  alt="Logo Sekolah"
                  class="img-fluid"
                  style="max-width: 100%; max-height: 100%; object-fit: contain;"
                  @error="handleImgError"
                />
                <i v-else class="bi bi-shield-lock-fill fs-2 text-primary"></i>
              </div>
              <h4 class="fw-bold mb-1">E-OSIS SMPN 2 KWADUNGAN</h4>
              <p class="small text-white-70 mb-0">Panel Masuk Administrator Pemilihan</p>
            </div>

            <!-- Login Form -->
            <div class="card-body p-4">
              <AlertMessage
                v-if="errorMessage"
                :message="errorMessage"
                type="danger"
                dismissible
                @close="errorMessage = null"
              />

              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="admin-identifier" class="form-label fw-semibold text-dark small">
                    Email / Username Admin
                  </label>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                      <i class="bi bi-person text-muted"></i>
                    </span>
                    <input
                      id="admin-identifier"
                      v-model="identifier"
                      type="text"
                      class="form-control border-start-0"
                      placeholder="admin"
                      required
                      autocomplete="username"
                    />
                  </div>
                </div>

                <div class="mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <label for="admin-password" class="form-label fw-semibold text-dark small mb-0">
                      Kata Sandi
                    </label>
                  </div>
                  <div class="input-group">
                    <span class="input-group-text bg-light border-end-0">
                      <i class="bi bi-key text-muted"></i>
                    </span>
                    <input
                      id="admin-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control border-start-0 border-end-0"
                      placeholder="••••••••"
                      required
                      autocomplete="current-password"
                    />
                    <button
                      type="button"
                      class="btn btn-light border border-start-0"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="['bi', showPassword ? 'bi-eye-slash' : 'bi-eye', 'text-muted']"></i>
                    </button>
                  </div>
                </div>

                <div class="d-grid mb-3">
                  <button
                    type="submit"
                    class="btn btn-primary rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                    :disabled="loading"
                  >
                    <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
                    <i v-else class="bi bi-box-arrow-in-right fs-5"></i>
                    <span>{{ loading ? 'Memverifikasi...' : 'Masuk ke Dashboard' }}</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- Card Footer -->
            <div class="card-footer bg-light border-0 py-3 text-center">
              <router-link to="/" class="text-decoration-none small text-muted">
                <i class="bi bi-arrow-left me-1"></i> Kembali ke Layar Pemilihan Siswa
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AlertMessage from '../../components/common/AlertMessage.vue';
import { useAuthStore } from '../../stores/auth';
import { useElectionStore } from '../../stores/election';

const router = useRouter();
const authStore = useAuthStore();
const electionStore = useElectionStore();

const identifier = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref(null);

const customLogo = ref('');
const logoFailedCompletely = ref(false);
const hasTriedFallback = ref(false);

const displayLogo = computed(() => {
  if (hasTriedFallback.value) {
    return '/logo-ngawi.svg';
  }
  return (
    electionStore.election?.school_logo_url ||
    customLogo.value ||
    '/logo-ngawi.svg'
  );
});

function handleImgError() {
  if (!hasTriedFallback.value && displayLogo.value !== '/logo-ngawi.svg') {
    hasTriedFallback.value = true;
  } else {
    logoFailedCompletely.value = true;
  }
}

onMounted(async () => {
  try {
    await electionStore.fetchElection();
  } catch {
    // Abaikan error fetch background
  }
});

async function handleLogin() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const res = await authStore.login(identifier.value, password.value);
    if (res.success) {
      await router.push({ name: 'AdminDashboard' });
      // Fallback in case browser router push is blocked or delayed
      setTimeout(() => {
        if (window.location.pathname.includes('/login')) {
          window.location.href = '/admin';
        }
      }, 150);
    } else {
      errorMessage.value = res.message || 'Login gagal. Periksa username dan kata sandi.';
    }
  } catch (err) {
    errorMessage.value = err.message || 'Terjadi kesalahan sistem.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.text-white-70 {
  color: rgba(255, 255, 255, 0.8);
}
</style>
