<template>
  <div
    :class="['card', 'candidate-card', 'h-100', 'border-2', isSelected ? 'selected' : 'bg-white']"
    @click="$emit('select', candidate)"
  >
    <!-- Card Header with Nomor Urut & Active Status -->
    <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center p-3 pb-0">
      <div class="candidate-badge-number shadow-sm">
        0{{ candidate.number }}
      </div>
      <div v-if="isSelected" class="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill fw-bold">
        <i class="bi bi-check-circle-fill me-1"></i> Pilihan Anda
      </div>
      <div v-else class="badge bg-light text-secondary border px-3 py-2 rounded-pill fw-medium">
        Kandidat No. 0{{ candidate.number }}
      </div>
    </div>

    <!-- Candidate Photo -->
    <div class="px-3 pt-3 text-center">
      <div class="position-relative mx-auto rounded-4 overflow-hidden shadow-sm" style="max-width: 320px; aspect-ratio: 4/3; background: #e2e8f0;">
        <img
          :src="candidate.photo_url || defaultPhoto"
          :alt="`Paslon 0${candidate.number}`"
          class="w-100 h-100 object-fit-cover transition-all"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>

    <!-- Candidate Names & Slogan -->
    <div class="card-body p-4 d-flex flex-column">
      <div class="mb-3 text-center">
        <span class="text-xs uppercase fw-bold text-muted d-block small">CALON KETUA & WAKIL KETUA</span>
        <h4 class="fw-bold text-dark mb-1 mt-1">{{ candidate.chairman_name }}</h4>
        <h6 class="fw-semibold text-primary mb-2">& {{ candidate.vice_chairman_name }}</h6>
        <p v-if="candidate.slogan" class="fst-italic text-muted small mb-0 px-2">
          "{{ candidate.slogan }}"
        </p>
      </div>

      <!-- Visi & Misi Toggle Button -->
      <div class="mt-auto pt-2">
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary w-100 rounded-pill mb-3"
          @click.stop="showDetailModal = true"
        >
          <i class="bi bi-card-text me-1"></i> Lihat Visi & Misi Paslon
        </button>

        <!-- Selection Button -->
        <button
          type="button"
          :class="[
            'btn', 'btn-lg', 'w-100', 'rounded-pill', 'py-2', 'fw-bold',
            isSelected ? 'btn-primary' : 'btn-outline-primary'
          ]"
          @click.stop="$emit('select', candidate)"
        >
          <i :class="['bi', isSelected ? 'bi-check-circle-fill' : 'bi-hand-index-thumb', 'me-2']"></i>
          {{ isSelected ? 'Kandidat Terpilih' : 'Pilih Paslon 0' + candidate.number }}
        </button>
      </div>
    </div>

    <!-- Visi Misi Modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal"
        class="modal fade show d-block"
        tabindex="-1"
        style="background-color: rgba(15, 23, 42, 0.6); z-index: 1055;"
        @click.self="showDetailModal = false"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content rounded-4 border-0 shadow">
            <div class="modal-header border-bottom-0 pb-0">
              <div>
                <span class="badge bg-primary px-3 py-1 rounded-pill mb-1">Paslon 0{{ candidate.number }}</span>
                <h5 class="modal-title fw-bold text-dark">
                  {{ candidate.chairman_name }} & {{ candidate.vice_chairman_name }}
                </h5>
              </div>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                @click="showDetailModal = false"
              ></button>
            </div>
            <div class="modal-body py-4">
              <div v-if="candidate.slogan" class="alert alert-light border border-info border-opacity-25 rounded-3 mb-4">
                <i class="bi bi-quote text-primary fs-5 me-1"></i>
                <span class="fst-italic text-dark">{{ candidate.slogan }}</span>
              </div>

              <div class="mb-4">
                <h6 class="fw-bold text-primary d-flex align-items-center gap-2">
                  <i class="bi bi-eye-fill"></i> Visi:
                </h6>
                <p class="text-secondary ps-3 border-start border-3 border-primary mb-0" style="white-space: pre-line;">
                  {{ candidate.vision || 'Belum diisi oleh kandidat.' }}
                </p>
              </div>

              <div>
                <h6 class="fw-bold text-success d-flex align-items-center gap-2">
                  <i class="bi bi-list-check"></i> Misi:
                </h6>
                <div class="text-secondary ps-3 border-start border-3 border-success" style="white-space: pre-line;">
                  {{ candidate.mission || 'Belum diisi oleh kandidat.' }}
                </div>
              </div>
            </div>
            <div class="modal-footer border-top-0 pt-0">
              <button
                type="button"
                class="btn btn-secondary rounded-pill px-4"
                @click="showDetailModal = false"
              >
                Tutup
              </button>
              <button
                type="button"
                class="btn btn-primary rounded-pill px-4 fw-bold"
                @click="showDetailModal = false; $emit('select', candidate)"
              >
                Pilih Paslon Ini
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  candidate: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['select']);

const showDetailModal = ref(false);
const defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
</script>
