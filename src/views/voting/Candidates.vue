<template>
  <div class="candidates-view py-2">
    <!-- Header Context -->
    <div class="text-center mb-4">
      <div class="d-inline-flex align-items-center gap-2 px-3 py-1 bg-white rounded-pill shadow-xs border mb-2">
        <i class="bi bi-ticket-perforated-fill text-primary"></i>
        <span class="small fw-semibold text-muted">Token Anda:</span>
        <span class="badge bg-primary font-monospace">{{ votingStore.token }}</span>
      </div>
      <h2 class="fw-extrabold text-dark mb-1">SURAT SUARA DIGITAL</h2>
      <h5 class="fw-bold text-primary mb-1">
        {{ votingStore.electionInfo?.title || 'Pemilihan Ketua dan Wakil Ketua OSIS' }}
      </h5>
      <p class="text-muted small mb-0">
        Pilihlah salah satu pasangan calon di bawah ini dengan menekan tombol <strong>Pilih</strong>.
      </p>
    </div>

    <!-- Error Alert if vote submission failed -->
    <div class="row justify-content-center" v-if="submissionError">
      <div class="col-lg-8">
        <AlertMessage
          :message="submissionError"
          type="danger"
          @close="submissionError = null"
        />
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading" text="Memuat daftar pasangan calon..." />

    <!-- Candidates Grid -->
    <div v-else-if="candidates.length > 0" class="row g-4 justify-content-center mb-5 pb-5">
      <div
        v-for="candidate in candidates"
        :key="candidate.id"
        class="col-md-6 col-lg-4"
      >
        <CandidateCard
          :candidate="candidate"
          :is-selected="selectedCandidate?.id === candidate.id"
          @select="handleSelectCandidate"
        />
      </div>
    </div>

    <!-- Empty State if no active candidates -->
    <EmptyState
      v-else
      icon="bi-people"
      title="Belum Ada Kandidat Aktif"
      description="Daftar pasangan calon belum ditambahkan oleh panitia OSIS. Silakan hubungi panitia."
    />

    <!-- Sticky Bottom Bar when Candidate Selected -->
    <div
      v-if="selectedCandidate"
      class="fixed-bottom bg-white border-top shadow-lg p-3 transition-all"
      style="z-index: 1040;"
    >
      <div class="container d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-3">
          <div class="candidate-badge-number fs-5" style="width: 42px; height: 42px;">
            0{{ selectedCandidate.number }}
          </div>
          <div>
            <span class="badge bg-success bg-opacity-10 text-success fw-bold">Kandidat Terpilih:</span>
            <h6 class="fw-bold text-dark mb-0">
              {{ selectedCandidate.chairman_name }} & {{ selectedCandidate.vice_chairman_name }}
            </h6>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm d-flex align-items-center gap-2"
          @click="showConfirmModal = true"
        >
          <span>KONFIRMASI PILIHAN</span>
          <i class="bi bi-arrow-right-circle-fill fs-5"></i>
        </button>
      </div>
    </div>

    <!-- Confirmation Modal Component -->
    <VoteConfirmation
      v-if="showConfirmModal"
      :candidate="selectedCandidate"
      :is-submitting="isSubmitting"
      @confirm="handleConfirmVote"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import CandidateCard from '../../components/voting/CandidateCard.vue';
import VoteConfirmation from '../../components/voting/VoteConfirmation.vue';
import LoadingSpinner from '../../components/common/LoadingSpinner.vue';
import EmptyState from '../../components/common/EmptyState.vue';
import AlertMessage from '../../components/common/AlertMessage.vue';
import { candidateService } from '../../services/candidateService';
import { useVotingStore } from '../../stores/voting';

const router = useRouter();
const votingStore = useVotingStore();

const loading = ref(true);
const candidates = ref([]);
const showConfirmModal = ref(false);
const isSubmitting = ref(false);
const submissionError = ref(null);

const selectedCandidate = computed(() => votingStore.selectedCandidate);

function handleSelectCandidate(candidate) {
  votingStore.selectCandidate(candidate);
}

async function handleConfirmVote() {
  if (!selectedCandidate.value || isSubmitting.value) return;

  isSubmitting.value = true;
  submissionError.value = null;

  try {
    const result = await votingStore.submitVote();

    if (result.success) {
      showConfirmModal.value = false;
      // Navigate to success page
      router.push('/vote/success');
    } else {
      submissionError.value = result.message || 'Suara belum berhasil dicatat. Silakan coba kembali.';
      showConfirmModal.value = false;
    }
  } catch (err) {
    submissionError.value = 'Terjadi gangguan koneksi ke server database. Silakan coba lagi.';
    showConfirmModal.value = false;
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  // Guard check: ensure valid token session
  if (!votingStore.token) {
    router.replace('/');
    return;
  }

  loading.value = true;
  try {
    const list = await candidateService.getCandidates(votingStore.electionInfo?.electionId);
    candidates.value = list.filter((c) => c.is_active);
  } catch (err) {
    console.error('Error fetching candidates:', err);
  } finally {
    loading.value = false;
  }
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
