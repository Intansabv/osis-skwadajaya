import { defineStore } from 'pinia';
import { votingService } from '../services/votingService';

export const useVotingStore = defineStore('voting', {
  state: () => ({
    token: null,
    electionInfo: null,
    selectedCandidate: null,
    isSubmitting: false,
    voteResult: null,
    error: null,
    countdown: 4,
    countdownTimer: null,
  }),

  getters: {
    hasValidSession: (state) => !!state.token,
  },

  actions: {
    init() {
      const stored = sessionStorage.getItem('eosis_voter_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.token = parsed.token;
          this.electionInfo = parsed.electionInfo;
        } catch (e) {
          sessionStorage.removeItem('eosis_voter_session');
        }
      }
    },

    setVerifiedSession(token, electionInfo) {
      this.token = token;
      this.electionInfo = electionInfo;
      this.selectedCandidate = null;
      this.voteResult = null;
      this.error = null;
      sessionStorage.setItem(
        'eosis_voter_session',
        JSON.stringify({ token, electionInfo })
      );
    },

    selectCandidate(candidate) {
      this.selectedCandidate = candidate;
    },

    async submitVote() {
      if (!this.token || !this.selectedCandidate) {
        this.error = 'Sesi atau kandidat tidak valid.';
        return { success: false, message: this.error };
      }

      this.isSubmitting = true;
      this.error = null;

      try {
        const result = await votingService.castVote(
          this.token,
          this.selectedCandidate.id
        );

        if (result.success) {
          this.voteResult = result;
          return { success: true, result };
        } else {
          this.error = result.message || 'Gagal mengirim suara.';
          return { success: false, message: this.error };
        }
      } catch (err) {
        this.error = err.message || 'Terjadi kesalahan sistem.';
        return { success: false, message: this.error };
      } finally {
        this.isSubmitting = false;
      }
    },

    startSuccessCountdown(onFinish) {
      this.countdown = 4;
      if (this.countdownTimer) clearInterval(this.countdownTimer);

      this.countdownTimer = setInterval(() => {
        this.countdown -= 1;
        if (this.countdown <= 0) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
          this.clearSession();
          if (onFinish) onFinish();
        }
      }, 1000);
    },

    clearSession() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      this.token = null;
      this.selectedCandidate = null;
      this.voteResult = null;
      this.error = null;
      this.countdown = 4;
      sessionStorage.removeItem('eosis_voter_session');
    },
  },
});
