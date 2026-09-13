import { defineStore } from 'pinia';
import { settingsService } from '../services/settingsService';

export const useElectionStore = defineStore('election', {
  state: () => ({
    election: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchElection() {
      this.loading = true;
      try {
        this.election = await settingsService.getElection();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateElection(updates) {
      this.loading = true;
      try {
        if (!this.election?.id) {
          await this.fetchElection();
        }
        const updated = await settingsService.updateElection(this.election.id, updates);
        this.election = updated;
        return { success: true, data: updated };
      } catch (err) {
        this.error = err.message;
        return { success: false, message: err.message };
      } finally {
        this.loading = false;
      }
    },
  },
});
