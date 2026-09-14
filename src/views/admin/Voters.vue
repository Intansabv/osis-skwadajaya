<template>
  <div class="admin-voters">
    <!-- Header & Action Row -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h3 class="fw-extrabold text-dark mb-1">Data Pemilih</h3>
        <p class="text-muted mb-0">
          Kelola data administratif pemilih dan pantau status kehadiran pemilih secara anonim.
        </p>
      </div>

      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary rounded-pill px-3" @click="printVotersList">
          <i class="bi bi-printer me-1"></i> Cetak Laporan Pemilih
        </button>
        <router-link to="/admin/tokens" class="btn btn-primary rounded-pill px-3 shadow-sm">
          <i class="bi bi-plus-circle me-1"></i> Kelola Token Voting
        </router-link>
      </div>
    </div>

    <!-- Anonymity Notice -->
    <div class="alert alert-info border-0 rounded-4 shadow-sm p-3 mb-4 d-flex align-items-center gap-3">
      <i class="bi bi-shield-lock-fill fs-3 text-primary flex-shrink-0"></i>
      <div class="small">
        <strong>Jaminan Kerahasiaan Suara (Secret Ballot):</strong>
        Sistem hanya mencatat apakah pemilih <em>Sudah Memilih</em> atau <em>Belum Memilih</em>. Pilihan kandidat tidak pernah dihubungkan dengan identitas pemilih dalam database.
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="card border-0 shadow-sm rounded-4 bg-white mb-4">
      <div class="card-body p-3 p-md-4">
        <div class="row g-3">
          <!-- Search Input -->
          <div class="col-md-6 col-lg-5">
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0">
                <i class="bi bi-search text-muted"></i>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                class="form-control border-start-0"
                placeholder="Cari berdasarkan kode, token, atau nama pemilih..."
              />
              <button
                v-if="searchQuery"
                class="btn btn-outline-secondary border-start-0"
                type="button"
                @click="searchQuery = ''"
              >
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <!-- Status Filter Pills -->
          <div class="col-md-6 col-lg-7 d-flex align-items-center justify-content-md-end gap-2 flex-wrap">
            <button
              :class="['btn', 'btn-sm', 'rounded-pill', 'px-3', filterStatus === 'all' ? 'btn-primary' : 'btn-light border']"
              @click="filterStatus = 'all'"
            >
              Semua ({{ tokens.length }})
            </button>
            <button
              :class="['btn', 'btn-sm', 'rounded-pill', 'px-3', filterStatus === 'used' ? 'btn-success' : 'btn-light border']"
              @click="filterStatus = 'used'"
            >
              Sudah Memilih ({{ countByStatus.used }})
            </button>
            <button
              :class="['btn', 'btn-sm', 'rounded-pill', 'px-3', filterStatus === 'active' ? 'btn-warning text-dark' : 'btn-light border']"
              @click="filterStatus = 'active'"
            >
              Belum Memilih ({{ countByStatus.active }})
            </button>
            <button
              :class="['btn', 'btn-sm', 'rounded-pill', 'px-3', filterStatus === 'inactive' ? 'btn-secondary' : 'btn-light border']"
              @click="filterStatus = 'inactive'"
            >
              Nonaktif ({{ countByStatus.inactive }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading" text="Memuat daftar pemilih..." />

    <!-- Table Card -->
    <div v-else class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light table-light">
            <tr class="text-muted small text-uppercase">
              <th class="ps-4" style="width: 60px;">No</th>
              <th>Kode Pemilih</th>
              <th>Nama / Inisial (Opsional)</th>
              <th>Token Voting</th>
              <th>Status Suara</th>
              <th>Waktu Memilih</th>
              <th class="text-end pe-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTokens.length === 0">
              <td colspan="7" class="text-center py-5 text-muted">
                <i class="bi bi-inbox fs-2 d-block mb-2"></i>
                Tidak ditemukan data pemilih yang sesuai.
              </td>
            </tr>

            <tr v-for="(voter, index) in filteredTokens" :key="voter.id">
              <td class="ps-4 text-muted small fw-semibold">{{ index + 1 }}</td>
              <td>
                <span class="badge bg-light text-dark border font-monospace px-2 py-1">
                  {{ voter.voter_code || 'VOT-' + String(index + 1).padStart(3, '0') }}
                </span>
              </td>
              <td>
                <span class="fw-semibold text-dark">{{ voter.voter_name || 'Siswa Pemilih ' + (index + 1) }}</span>
              </td>
              <td>
                <span class="font-monospace fw-bold text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                  {{ voter.token }}
                </span>
              </td>
              <td>
                <span v-if="voter.status === 'used' || voter.used_at" class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">
                  <i class="bi bi-check-circle-fill me-1"></i> Sudah Memilih
                </span>
                <span v-else-if="voter.status === 'active'" class="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-2 py-1 rounded-pill">
                  <i class="bi bi-clock-history me-1"></i> Belum Memilih
                </span>
                <span v-else class="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill">
                  <i class="bi bi-slash-circle me-1"></i> Nonaktif
                </span>
              </td>
              <td class="text-muted small">
                {{ voter.used_at ? formatDateTime(voter.used_at) : '-' }}
              </td>
              <td class="text-end pe-4">
                <div class="btn-group btn-group-sm">
                  <!-- Toggle Active Status -->
                  <button
                    v-if="voter.status !== 'used'"
                    type="button"
                    :class="['btn', voter.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success', 'btn-sm']"
                    :title="voter.status === 'active' ? 'Nonaktifkan Token' : 'Aktifkan Token'"
                    @click="toggleStatus(voter)"
                  >
                    <i :class="['bi', voter.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle']"></i>
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    title="Hapus Data Pemilih"
                    @click="confirmDelete(voter)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Summary -->
      <div class="card-footer bg-white border-top p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <span class="text-muted small">
          Menampilkan {{ filteredTokens.length }} dari total {{ tokens.length }} data pemilih
        </span>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Hapus Data Pemilih"
      :message="`Apakah Anda yakin ingin menghapus token pemilih ${selectedVoter?.token}?`"
      variant="danger"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import ConfirmModal from '../../components/admin/ConfirmModal.vue';
import { tokenService } from '../../services/tokenService';
import { useElectionStore } from '../../stores/election';
import { formatDateTime } from '../../utils/validation';

const electionStore = useElectionStore();
const loading = ref(true);
const tokens = ref([]);
const searchQuery = ref('');
const filterStatus = ref('all');

const showDeleteModal = ref(false);
const selectedVoter = ref(null);

const countByStatus = computed(() => {
  const used = tokens.value.filter((t) => t.status === 'used' || t.used_at).length;
  const active = tokens.value.filter((t) => t.status === 'active' && !t.used_at).length;
  const inactive = tokens.value.filter((t) => t.status === 'inactive').length;
  return { used, active, inactive };
});

const filteredTokens = computed(() => {
  return tokens.value.filter((item) => {
    // Status filter
    if (filterStatus.value === 'used' && item.status !== 'used' && !item.used_at) return false;
    if (filterStatus.value === 'active' && (item.status !== 'active' || item.used_at)) return false;
    if (filterStatus.value === 'inactive' && item.status !== 'inactive') return false;

    // Search query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const codeMatch = item.voter_code?.toLowerCase().includes(q);
      const nameMatch = item.voter_name?.toLowerCase().includes(q);
      const tokenMatch = item.token?.toLowerCase().includes(q);
      return codeMatch || nameMatch || tokenMatch;
    }

    return true;
  });
});

async function loadVoters() {
  loading.value = true;
  try {
    await electionStore.fetchElection();
    const list = await tokenService.getTokens(electionStore.election?.id);
    tokens.value = list;
  } catch (err) {
    console.error('Error fetching voters:', err);
  } finally {
    loading.value = false;
  }
}

async function toggleStatus(voter) {
  const newStatus = voter.status === 'active' ? 'inactive' : 'active';
  try {
    await tokenService.updateTokenStatus(voter.id, newStatus);
    voter.status = newStatus;
  } catch (err) {
    console.error('Failed to toggle status:', err);
  }
}

function confirmDelete(voter) {
  selectedVoter.value = voter;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!selectedVoter.value) return;
  try {
    await tokenService.deleteToken(selectedVoter.value.id);
    tokens.value = tokens.value.filter((t) => t.id !== selectedVoter.value.id);
    showDeleteModal.value = false;
  } catch (err) {
    console.error('Failed to delete voter:', err);
  }
}

function printVotersList() {
  window.print();
}

onMounted(() => {
  loadVoters();
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
</style>
