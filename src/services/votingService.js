import { formatTokenInput, isValidTokenFormat } from '../utils/token';
import { supabase } from './supabase';

function normalizeRpcResult(data) {
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

export const votingService = {
  async validateToken(rawToken) {
    const cleanToken = formatTokenInput(rawToken);
    if (!isValidTokenFormat(cleanToken)) {
      return { valid: false, code: 'INVALID_FORMAT', message: 'Format token tidak valid. Token harus terdiri dari 6 karakter (A-Z, 0-9).' };
    }

    const { data, error } = await supabase.rpc('validate_voter_token', { p_token: cleanToken });
    if (error) {
      console.error(error);
      return { valid: false, code: 'SERVER_ERROR', message: 'Koneksi ke database pemilihan gagal. Silakan coba lagi.' };
    }
    return normalizeRpcResult(data) || { valid: false, code: 'SERVER_ERROR', message: 'Respons server tidak valid.' };
  },

  async castVote(rawToken, candidateId) {
    const cleanToken = formatTokenInput(rawToken);
    if (!isValidTokenFormat(cleanToken)) return { success: false, code: 'INVALID_FORMAT', message: 'Format token tidak valid.' };
    if (!candidateId) return { success: false, code: 'NO_CANDIDATE', message: 'Silakan tentukan kandidat pilihan Anda.' };

    const { data, error } = await supabase.rpc('cast_vote', {
      p_token: cleanToken,
      p_candidate_id: candidateId,
    });
    if (error) {
      console.error(error);
      return { success: false, code: 'SERVER_ERROR', message: 'Suara gagal dikirim ke database pusat. Silakan coba lagi.' };
    }
    return normalizeRpcResult(data) || { success: false, code: 'SERVER_ERROR', message: 'Respons server tidak valid.' };
  },

  async getResults(electionId) {
    if (!electionId) throw new Error('ID pemilihan tidak ditemukan.');
    const { data, error } = await supabase.rpc('get_election_results', { p_election_id: electionId });
    if (error) {
      console.error(error);
      throw new Error(error.message || 'Gagal mengambil hasil voting.');
    }
    return normalizeRpcResult(data) || { election_id: electionId, total_tokens: 0, used_tokens: 0, unused_tokens: 0, total_votes: 0, turnout_percentage: 0, candidates: [] };
  },
};
