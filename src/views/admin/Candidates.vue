<template>
  <div class="admin-candidates">
    <!-- Header -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <div>
        <h3 class="fw-extrabold text-dark mb-1">Calon Kandidat OSIS</h3>
        <p class="text-muted mb-0">
          Kelola data pasangan calon Ketua dan Wakil Ketua OSIS, visi, misi, dan foto
        </p>
      </div>

      <button class="btn btn-primary rounded-pill px-4 shadow-sm" @click="openAddModal">
        <i class="bi bi-person-plus-fill me-2"></i> Tambah Pasangan Calon
      </button>
    </div>

    <!-- Alert Notification -->
    <AlertMessage
      v-if="alertMessage"
      :message="alertMessage"
      :type="alertType"
      dismissible
      @close="alertMessage = null"
    />

    <LoadingSpinner v-if="loading" text="Memuat daftar pasangan calon..." />

    <!-- Candidates Grid -->
    <div v-else-if="candidates.length > 0" class="row g-4 mb-4">
      <div
        v-for="cand in candidates"
        :key="cand.id"
        class="col-md-6 col-xl-4"
      >
        <div class="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden">
          <!-- Card Header / Number & Status -->
          <div class="p-3 pb-0 d-flex justify-content-between align-items-center">
            <div class="candidate-badge-number shadow-xs">
              0{{ cand.number }}
            </div>
            <div class="d-flex align-items-center gap-2">
              <span v-if="cand.is_active" class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">
                Aktif
              </span>
              <span v-else class="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2 rounded-pill">
                Nonaktif
              </span>
            </div>
          </div>

          <!-- Photo Container -->
          <div class="px-3 pt-3 text-center">
            <div class="rounded-4 overflow-hidden shadow-xs bg-light mx-auto" style="max-width: 320px; aspect-ratio: 4/3;">
              <img
                :src="cand.photo_url || defaultPhoto"
                :alt="`Paslon 0${cand.number}`"
                class="w-100 h-100 object-fit-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <!-- Names & Details -->
          <div class="card-body p-4 d-flex flex-column">
            <div class="text-center mb-3">
              <span class="text-muted text-uppercase small fw-bold">PASANGAN CALON NO. 0{{ cand.number }}</span>
              <h5 class="fw-bold text-dark mb-0 mt-1">{{ cand.chairman_name }}</h5>
              <p class="text-primary fw-semibold small mb-2">& {{ cand.vice_chairman_name }}</p>
              <p v-if="cand.slogan" class="fst-italic text-muted small mb-0">"{{ cand.slogan }}"</p>
            </div>

            <!-- Visi & Misi preview -->
            <div class="bg-light p-3 rounded-3 small text-secondary mb-4 flex-grow-1">
              <strong class="d-block text-dark mb-1"><i class="bi bi-eye text-primary me-1"></i> Visi:</strong>
              <p class="mb-2 text-truncate-2">{{ cand.vision || 'Belum diisi' }}</p>

              <strong class="d-block text-dark mb-1"><i class="bi bi-list-check text-success me-1"></i> Misi:</strong>
              <p class="mb-0 text-truncate-2" style="white-space: pre-line;">{{ cand.mission || 'Belum diisi' }}</p>
            </div>

            <!-- Actions Bar -->
            <div class="d-flex justify-content-between align-items-center pt-2 border-top gap-2">
              <button
                type="button"
                :class="['btn', 'btn-sm', cand.is_active ? 'btn-outline-warning' : 'btn-outline-success', 'rounded-pill', 'px-3']"
                @click="toggleCandidateStatus(cand)"
              >
                {{ cand.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
              </button>

              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary rounded-pill px-3"
                  @click="openEditModal(cand)"
                >
                  <i class="bi bi-pencil-square me-1"></i> Edit
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger rounded-circle p-2"
                  style="width: 32px; height: 32px;"
                  title="Hapus Kandidat"
                  @click="confirmDelete(cand)"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else
      icon="bi-person-badge"
      title="Belum Ada Kandidat Terdaftar"
      description="Silakan tambahkan data pasangan calon Ketua dan Wakil Ketua OSIS untuk memulai pemilihan."
    >
      <template #action>
        <button class="btn btn-primary rounded-pill px-4" @click="openAddModal">
          <i class="bi bi-plus-lg me-1"></i> Tambah Paslon Pertama
        </button>
      </template>
    </EmptyState>

    <!-- Modal Form (Add / Edit) -->
    <div v-if="showModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" @click.self="showModal = false">
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-0 pb-0">
            <h5 class="fw-bold text-dark mb-0">
              {{ isEditing ? 'Edit Pasangan Calon' : 'Tambah Pasangan Calon Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="showModal = false"></button>
          </div>

          <div class="modal-body p-4">
            <form @submit.prevent="saveCandidate">
              <div class="row g-3">
                <!-- Nomor Urut -->
                <div class="col-md-3">
                  <label class="form-label text-muted small fw-semibold">Nomor Urut:</label>
                  <input
                    v-model.number="form.number"
                    type="number"
                    min="1"
                    class="form-control fw-bold text-center"
                    required
                  />
                </div>

                <!-- Foto Upload & Preview -->
                <div class="col-md-9">
                  <label class="form-label text-muted small fw-semibold">Foto Pasangan Calon:</label>
                  <div class="d-flex gap-3 align-items-center">
                    <div class="rounded-3 overflow-hidden border bg-light flex-shrink-0" style="width: 60px; height: 60px;">
                      <img
                        :src="form.photo_url || defaultPhoto"
                        alt="Preview"
                        class="w-100 h-100 object-fit-cover"
                      />
                    </div>
                    <div class="flex-grow-1">
                      <input
                        type="file"
                        accept="image/*"
                        class="form-control form-control-sm mb-1"
                        @change="handlePhotoUpload"
                      />
                      <input
                        v-model="form.photo_url"
                        type="url"
                        class="form-control form-control-sm text-muted"
                        placeholder="Atau masukkan URL gambar..."
                      />
                    </div>
                  </div>
                </div>

                <!-- Nama Ketua -->
                <div class="col-md-6">
                  <label class="form-label text-muted small fw-semibold">Nama Lengkap Calon Ketua:</label>
                  <input
                    v-model="form.chairman_name"
                    type="text"
                    class="form-control"
                    placeholder="Contoh: Muhammad Fauzan"
                    required
                  />
                </div>

                <!-- Nama Wakil -->
                <div class="col-md-6">
                  <label class="form-label text-muted small fw-semibold">Nama Lengkap Calon Wakil Ketua:</label>
                  <input
                    v-model="form.vice_chairman_name"
                    type="text"
                    class="form-control"
                    placeholder="Contoh: Nadhira Putri"
                    required
                  />
                </div>

                <!-- Slogan -->
                <div class="col-12">
                  <label class="form-label text-muted small fw-semibold">Slogan / Tagline:</label>
                  <input
                    v-model="form.slogan"
                    type="text"
                    class="form-control"
                    placeholder="Contoh: Kreatif, Berkarakter, Menginspirasi"
                  />
                </div>

                <!-- Visi -->
                <div class="col-12">
                  <label class="form-label text-muted small fw-semibold">Visi Paslon:</label>
                  <textarea
                    v-model="form.vision"
                    rows="3"
                    class="form-control"
                    placeholder="Tuliskan visi pasangan calon..."
                  ></textarea>
                </div>

                <!-- Misi -->
                <div class="col-12">
                  <label class="form-label text-muted small fw-semibold">Misi Paslon (Per baris / bernomor):</label>
                  <textarea
                    v-model="form.mission"
                    rows="4"
                    class="form-control"
                    placeholder="1. Meningkatkan partisipasi aktif siswa...&#10;2. Mengoptimalkan program kerja digital..."
                  ></textarea>
                </div>

                <!-- Status Aktif -->
                <div class="col-12">
                  <div class="form-check form-switch">
                    <input
                      id="candActiveSwitch"
                      v-model="form.is_active"
                      class="form-check-input"
                      type="checkbox"
                    />
                    <label class="form-check-label fw-semibold" for="candActiveSwitch">
                      Kandidat Aktif (Tampil di bilik suara)
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-4" @click="showModal = false">Batal</button>
            <button
              type="button"
              class="btn btn-primary rounded-pill px-4 fw-bold"
              :disabled="isSaving"
              @click="saveCandidate"
            >
              <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
              {{ isEditing ? 'Simpan Perubahan' : 'Tambahkan Paslon' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Hapus Kandidat"
      :message="`Apakah Anda yakin ingin menghapus pasangan calon No. 0${candidateToDelete?.number} (${candidateToDelete?.chairman_name})?`"
      variant="danger"
      @confirm="handleDeleteCandidate"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import AlertMessage from '../../components/common/AlertMessage.vue';
import ConfirmModal from '../../components/admin/ConfirmModal.vue';
import { candidateService } from '../../services/candidateService';
import { useElectionStore } from '../../stores/election';

const electionStore = useElectionStore();

const loading = ref(true);
const isSaving = ref(false);
const candidates = ref([]);

const alertMessage = ref(null);
const alertType = ref('success');

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);

const showDeleteModal = ref(false);
const candidateToDelete = ref(null);

const defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';

const form = ref({
  number: 1,
  chairman_name: '',
  vice_chairman_name: '',
  photo_url: '',
  slogan: '',
  vision: '',
  mission: '',
  is_active: true,
});

async function loadCandidates() {
  loading.value = true;
  try {
    await electionStore.fetchElection();
    const list = await candidateService.getCandidates(electionStore.election?.id);
    candidates.value = list;
  } catch (err) {
    console.error('Failed to load candidates:', err);
  } finally {
    loading.value = false;
  }
}

function openAddModal() {
  isEditing.value = false;
  editingId.value = null;
  const nextNum = candidates.value.length > 0 ? Math.max(...candidates.value.map((c) => c.number)) + 1 : 1;
  form.value = {
    number: nextNum,
    chairman_name: '',
    vice_chairman_name: '',
    photo_url: '',
    slogan: '',
    vision: '',
    mission: '',
    is_active: true,
  };
  showModal.value = true;
}

function openEditModal(cand) {
  isEditing.value = true;
  editingId.value = cand.id;
  form.value = { ...cand };
  showModal.value = true;
}

async function handlePhotoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const url = await candidateService.uploadPhoto(file);
    form.value.photo_url = url;
  } catch (err) {
    console.error('Photo upload error:', err);
  }
}

async function saveCandidate() {
  if (!form.value.chairman_name || !form.value.vice_chairman_name) return;
  isSaving.value = true;

  try {
    const payload = {
      ...form.value,
      election_id: electionStore.election?.id,
    };

    if (isEditing.value) {
      await candidateService.updateCandidate(editingId.value, payload);
      alertMessage.value = 'Data pasangan calon berhasil diperbarui!';
    } else {
      await candidateService.addCandidate(payload);
      alertMessage.value = 'Pasangan calon baru berhasil ditambahkan!';
    }

    alertType.value = 'success';
    showModal.value = false;
    await loadCandidates();
  } catch (err) {
    alertMessage.value = 'Gagal menyimpan data kandidat: ' + err.message;
    alertType.value = 'danger';
  } finally {
    isSaving.value = false;
  }
}

async function toggleCandidateStatus(cand) {
  try {
    const updated = await candidateService.updateCandidate(cand.id, {
      is_active: !cand.is_active,
    });
    cand.is_active = updated.is_active;
  } catch (err) {
    console.error('Error toggling candidate status:', err);
  }
}

function confirmDelete(cand) {
  candidateToDelete.value = cand;
  showDeleteModal.value = true;
}

async function handleDeleteCandidate() {
  if (!candidateToDelete.value) return;
  try {
    await candidateService.deleteCandidate(candidateToDelete.value.id);
    candidates.value = candidates.value.filter((c) => c.id !== candidateToDelete.value.id);
    showDeleteModal.value = false;
    alertMessage.value = 'Kandidat berhasil dihapus.';
    alertType.value = 'success';
  } catch (err) {
    alertMessage.value = 'Gagal menghapus kandidat: ' + err.message;
    alertType.value = 'danger';
  }
}

onMounted(() => {
  loadCandidates();
});
</script>

<style scoped>
.fw-extrabold {
  font-weight: 800;
}
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.shadow-xs {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}
</style>
