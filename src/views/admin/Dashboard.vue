<template>
  <div class="admin-dashboard">
    <!-- Top Greeting & Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h3 class="fw-extrabold text-dark mb-1">Beranda Administrator</h3>
        <p class="text-muted mb-0">
          Ringkasan aktivitas dan partisipasi pemilihan Ketua & Wakil Ketua OSIS
        </p>
      </div>

      <div class="d-flex align-items-center gap-2 flex-wrap">
        <router-link to="/admin/tokens" class="btn btn-primary rounded-pill px-3 shadow-sm d-flex align-items-center gap-2">
          <i class="bi bi-plus-circle"></i>
          <span>Generate Token</span>
        </router-link>
        <router-link to="/admin/results" class="btn btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-2">
          <i class="bi bi-bar-chart-fill"></i>
          <span>Live Hasil Suara</span>
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading" text="Memuat statistik pemilihan..." />

    <div v-else>
      <!-- Stats Grid (5 Main Metrics) -->
      <div class="row g-3 mb-4">
        <!-- 1. Total Pemilih -->
        <div class="col-sm-6 col-xl">
          <StatCard
            title="Total Pemilih"
            :value="stats.totalTokens"
            unit="Siswa"
            subtext="Total token terdaftar"
            icon="bi-people-fill"
            theme="primary"
          />
        </div>

        <!-- 2. Sudah Memilih -->
        <div class="col-sm-6 col-xl">
          <StatCard
            title="Sudah Memilih"
            :value="stats.usedTokens"
            unit="Suara"
            subtext="Suara telah dicatat"
            icon="bi-check-circle-fill"
            theme="success"
          />
        </div>

        <!-- 3. Belum Memilih -->
        <div class="col-sm-6 col-xl">
          <StatCard
            title="Belum Memilih"
            :value="stats.unusedTokens"
            unit="Token"
            subtext="Token belum digunakan"
            icon="bi-hourglass-split"
            theme="warning"
          />
        </div>

        <!-- 4. Total Kandidat -->
        <div class="col-sm-6 col-xl">
          <StatCard
            title="Total Kandidat"
            :value="stats.totalCandidates"
            unit="Paslon"
            subtext="Pasangan calon aktif"
            icon="bi-person-badge-fill"
            theme="info"
          />
        </div>

        <!-- 5. Persentase Partisipasi -->
        <div class="col-sm-12 col-xl">
          <StatCard
            title="Partisipasi"
            :value="stats.turnoutPercentage + '%'"
            :subtext="`${stats.usedTokens} dari ${stats.totalTokens} pemilih`"
            icon="bi-pie-chart-fill"
            theme="success"
            show-progress
            :progress-value="stats.turnoutPercentage"
          />
        </div>
      </div>

      <!-- Main Overview Cards (2 Columns) -->
      <div class="row g-4 mb-4">
        <!-- Left: Status Pemilihan & Partisipasi Progress -->
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div class="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold text-dark mb-1">Status & Kemajuan Pemilihan</h5>
                <p class="text-muted small mb-0">Pemantauan tingkat partisipasi secara langsung</p>
              </div>
              <span :class="['badge', statusBadgeClass, 'px-3', 'py-2', 'rounded-pill']">
                {{ election?.status }}
              </span>
            </div>

            <div class="card-body p-4">
              <!-- Big Progress Bar -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="fw-bold text-dark">Tingkat Partisipasi Pemilih:</span>
                  <span class="fw-extrabold fs-5 text-primary">{{ stats.turnoutPercentage }}%</span>
                </div>
                <div class="progress rounded-pill shadow-xs" style="height: 18px;">
                  <div
                    class="progress-bar bg-primary progress-bar-striped progress-bar-animated"
                    role="progressbar"
                    :style="{ width: stats.turnoutPercentage + '%' }"
                    :aria-valuenow="stats.turnoutPercentage"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <div class="d-flex justify-content-between text-muted small mt-1">
                  <span>0%</span>
                  <span>Target: 100% ({{ stats.totalTokens }} Pemilih)</span>
                </div>
              </div>

              <!-- Election Details Grid -->
              <div class="row g-3 p-3 bg-light rounded-3 mb-3">
                <div class="col-sm-6">
                  <span class="text-muted small d-block">Judul Pemilihan:</span>
                  <strong class="text-dark">{{ election?.election_title }}</strong>
                </div>
                <div class="col-sm-6">
                  <span class="text-muted small d-block">Sekolah:</span>
                  <strong class="text-dark">{{ election?.school_name }}</strong>
                </div>
                <div class="col-sm-6">
                  <span class="text-muted small d-block">Periode:</span>
                  <strong class="text-dark">{{ election?.election_period }}</strong>
                </div>
                <div class="col-sm-6">
                  <span class="text-muted small d-block">Kerahasiaan Suara:</span>
                  <span class="badge bg-success bg-opacity-10 text-success">
                    <i class="bi bi-shield-check me-1"></i> Anonim (Tanpa Relasi Token-Paslon)
                  </span>
                </div>
              </div>

              <!-- Quick Action Navigation -->
              <div class="d-flex gap-2 flex-wrap">
                <router-link to="/admin/settings" class="btn btn-sm btn-outline-secondary rounded-pill px-3">
                  <i class="bi bi-gear me-1"></i> Atur Periode / Status
                </router-link>
                <router-link to="/admin/tokens" class="btn btn-sm btn-outline-primary rounded-pill px-3">
                  <i class="bi bi-printer me-1"></i> Cetak Kartu Token
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Ringkasan Kandidat Paslon -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div class="card-header bg-transparent border-0 p-4 pb-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 class="fw-bold text-dark mb-1">Daftar Pasangan Calon</h5>
                <p class="text-muted small mb-0">{{ candidates.length }} Paslon terdaftar</p>
              </div>
              <router-link to="/admin/candidates" class="btn btn-sm btn-light border rounded-pill px-3">
                Kelola <i class="bi bi-arrow-right"></i>
              </router-link>
            </div>

            <div class="card-body p-4">
              <div v-if="candidates.length === 0" class="text-center py-4 text-muted">
                <i class="bi bi-people fs-1 mb-2 d-block"></i>
                <p class="small mb-0">Belum ada data calon kandidat.</p>
              </div>

              <div v-else class="d-flex flex-column gap-3">
                <div
                  v-for="cand in candidates"
                  :key="cand.id"
                  class="p-3 border rounded-3 d-flex align-items-center gap-3"
                >
                  <div class="candidate-badge-number fs-5" style="width: 42px; height: 42px;">
                    0{{ cand.number }}
                  </div>
                  <div class="overflow-hidden flex-grow-1">
                    <h6 class="fw-bold text-dark mb-0">{{ cand.chairman_name }}</h6>
                    <span class="text-muted small">& {{ cand.vice_chairman_name }}</span>
                  </div>
                  <span v-if="cand.is_active" class="badge bg-success bg-opacity-10 text-success rounded-pill px-2">
                    Aktif
                  </span>
                  <span v-else class="badge bg-secondary rounded-pill px-2">
                    Nonaktif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import StatCard from '../../components/admin/StatCard.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import { useElectionStore } from '../../stores/election';
import { tokenService } from '../../services/tokenService';
import { candidateService } from '../../services/candidateService';
import { votingService } from '../../services/votingService';

const electionStore = useElectionStore();
const election = computed(() => electionStore.election);

const loading = ref(true);
const candidates = ref([]);
const stats = ref({
  totalTokens: 0,
  usedTokens: 0,
  unusedTokens: 0,
  totalCandidates: 0,
  turnoutPercentage: 0,
});

const statusBadgeClass = computed(() => {
  const st = election.value?.status;
  if (st === 'Berlangsung') return 'bg-success text-white';
  if (st === 'Belum Dimulai') return 'bg-warning text-dark';
  if (st === 'Selesai') return 'bg-secondary text-white';
  return 'bg-light text-dark border';
});

async function loadDashboardData() {
  loading.value = true;
  try {
    await electionStore.fetchElection();
    const electionId = election.value?.id;

    const [tokenList, candList, results] = await Promise.all([
      tokenService.getTokens(electionId),
      candidateService.getCandidates(electionId),
      votingService.getResults(electionId),
    ]);

    candidates.value = candList;

    const totalTokens = results?.total_tokens || tokenList.length;
    const usedTokens = Math.max(
      results?.used_tokens ?? 0,
      tokenList.filter((t) => t.status === 'used' || t.used_at).length
    );
    const unusedTokens = Math.max(0, totalTokens - usedTokens);
    const totalCandidates = candList.filter((c) => c.is_active).length;
    const turnoutPercentage = totalTokens > 0 ? parseFloat(((usedTokens / totalTokens) * 100).toFixed(1)) : 0;

    stats.value = {
      totalTokens,
      usedTokens,
      unusedTokens,
      totalCandidates,
      turnoutPercentage,
    };
  } catch (err) {
    console.error('Failed to load dashboard metrics:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
.shadow-xs {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
</style>
