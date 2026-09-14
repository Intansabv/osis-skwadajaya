import { formatTokenInput, isValidTokenFormat } from '../utils/token';
import { settingsService } from './settingsService';
import { candidateService } from './candidateService';
import { tokenService } from './tokenService';
import { supabase } from './supabase';

const LOCAL_STORAGE_VOTES_KEY = 'e_osis_local_votes';

function getLocalVotes() {
  const saved = localStorage.getItem(LOCAL_STORAGE_VOTES_KEY);
  return saved ? JSON.parse(saved) : [];
}

function addLocalVote(vote) {
  const list = getLocalVotes();
  list.push(vote);
  localStorage.setItem(LOCAL_STORAGE_VOTES_KEY, JSON.stringify(list));
}

export const votingService = {
  /**
   * Validate voter token with Server API (falls back to local verification)
   */
  async validateToken(rawToken) {
    const cleanToken = formatTokenInput(rawToken);

    if (!isValidTokenFormat(cleanToken)) {
      return {
        valid: false,
        code: 'INVALID_FORMAT',
        message: 'Format token tidak valid. Token harus terdiri dari 6 karakter (A-Z, 0-9).',
      };
    }

    // 1. Try Server API
    try {
      const res = await fetch('/api/vote/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('Server API validateToken error, falling back to local:', err);
    }

    // 2. Local Fallback verification
    const election = await settingsService.getElection();
    if (election?.status && election.status !== 'Berlangsung') {
      if (election.status === 'Draft' || election.status === 'Belum Dimulai') {
        return {
          valid: false,
          code: 'ELECTION_NOT_STARTED',
          message: 'Pemilihan belum dimulai. Silakan tunggu jadwal dari panitia.',
        };
      }
      if (election.status === 'Selesai') {
        return {
          valid: false,
          code: 'ELECTION_ENDED',
          message: 'Pemilihan telah berakhir. Terima kasih atas partisipasi Anda.',
        };
      }
      return {
        valid: false,
        code: 'ELECTION_INACTIVE',
        message: 'Pemilihan sedang tidak aktif.',
      };
    }

    const tokens = await tokenService.getTokens(election?.id);
    const found = tokens.find((t) => t.token.toUpperCase() === cleanToken);

    if (!found) {
      return {
        valid: false,
        code: 'NOT_FOUND',
        message: 'Token tidak ditemukan atau tidak valid.',
      };
    }

    if (found.status === 'used' || found.used_at) {
      return {
        valid: false,
        code: 'ALREADY_USED',
        message: 'Anda sudah menggunakan hak suara dengan token ini.',
      };
    }

    if (found.status === 'inactive') {
      return {
        valid: false,
        code: 'INACTIVE_TOKEN',
        message: 'Token ini berstatus nonaktif. Silakan hubungi panitia OSIS.',
      };
    }

    return {
      valid: true,
      token: cleanToken,
      election_id: election?.id,
      election_title: election?.election_title || 'Pemilihan Ketua dan Wakil Ketua OSIS',
      election_period: election?.election_period || '2026/2027',
      school_name: election?.school_name || 'SMP NEGERI 2 KWADUNGAN',
      school_logo_url: election?.school_logo_url,
      message: 'Token valid. Silakan pilih kandidat Anda.',
    };
  },

  /**
   * Cast Vote atomically to Server API
   */
  async castVote(rawToken, candidateId) {
    const cleanToken = formatTokenInput(rawToken);

    if (!isValidTokenFormat(cleanToken)) {
      return {
        success: false,
        code: 'INVALID_FORMAT',
        message: 'Format token tidak valid.',
      };
    }

    if (!candidateId) {
      return {
        success: false,
        code: 'NO_CANDIDATE',
        message: 'Silakan tentukan kandidat pilihan Anda.',
      };
    }

    // 1. Submit to Server API
    try {
      const res = await fetch('/api/vote/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken, candidateId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        code: errData.code || 'VOTE_FAILED',
        message: errData.message || 'Gagal menyimpan suara ke server.',
      };
    } catch (err) {
      console.warn('Server API castVote failed, attempting local fallback:', err);
    }

    // 2. Local Fallback
    const election = await settingsService.getElection();
    const electionId = election?.id;
    const tokens = await tokenService.getTokens(electionId);
    const targetToken = tokens.find((t) => t.token.toUpperCase() === cleanToken);

    if (targetToken) {
      if (targetToken.status === 'used' || targetToken.used_at) {
        return {
          success: false,
          code: 'ALREADY_VOTED',
          message: 'Anda sudah menggunakan hak suara dengan token ini.',
        };
      }
      if (targetToken.status === 'inactive') {
        return {
          success: false,
          code: 'TOKEN_INACTIVE',
          message: 'Token ini berstatus nonaktif oleh panitia.',
        };
      }
    }

    const candidates = await candidateService.getCandidates(electionId);
    const candidate = candidates.find((c) => c.id === candidateId || String(c.number) === String(candidateId));
    if (!candidate || !candidate.is_active) {
      return {
        success: false,
        code: 'CANDIDATE_NOT_AVAILABLE',
        message: 'Kandidat pilihan tidak tersedia atau sedang nonaktif.',
      };
    }

    if (targetToken) {
      targetToken.status = 'used';
      targetToken.used_at = new Date().toISOString();
      await tokenService.updateTokenStatus(targetToken.id, 'used');

      const newVote = {
        id: 'v-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        election_id: electionId,
        candidate_id: candidate.id,
        candidate_number: candidate.number,
        voted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      addLocalVote(newVote);

      return {
        success: true,
        code: 'VOTE_RECORDED',
        message: 'Suara Anda berhasil dicatat, terima kasih telah berpartisipasi.',
        candidate_number: candidate.number,
      };
    }

    return {
      success: false,
      code: 'TOKEN_NOT_FOUND',
      message: 'Token tidak valid atau tidak terdaftar dalam sistem.',
    };
  },

  /**
   * Get aggregated election results from Server API
   */
  async getResults(electionId) {
    try {
      const res = await fetch('/api/results');
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('Error fetching /api/results, falling back to local calculation:', err);
    }

    // Fallback aggregation
    const tokens = await tokenService.getTokens(electionId);
    const candidates = await candidateService.getCandidates(electionId);
    const allVotes = getLocalVotes().filter((v) => !electionId || v.election_id === electionId);

    const totalTokens = tokens.length;
    const usedTokens = tokens.filter((t) => t.status === 'used' || t.used_at).length;
    const unusedTokens = tokens.filter((t) => t.status === 'active' && !t.used_at).length;
    const totalVotes = Math.max(allVotes.length, usedTokens);

    const candidateResults = candidates
      .filter((c) => c.is_active)
      .map((c) => {
        const count = allVotes.filter(
          (v) => v.candidate_id === c.id || String(v.candidate_number) === String(c.number)
        ).length;
        const percentage = totalVotes > 0 ? parseFloat(((count / totalVotes) * 100).toFixed(1)) : 0;
        return {
          id: c.id,
          number: c.number,
          chairman_name: c.chairman_name,
          vice_chairman_name: c.vice_chairman_name,
          photo_url: c.photo_url,
          slogan: c.slogan,
          votes: count,
          vote_count: count,
          percentage,
        };
      })
      .sort((a, b) => a.number - b.number);

    const turnout = totalTokens > 0 ? parseFloat(((usedTokens / totalTokens) * 100).toFixed(1)) : 0;

    return {
      election_id: electionId,
      total_tokens: totalTokens,
      used_tokens: usedTokens,
      unused_tokens: unusedTokens,
      total_votes: totalVotes,
      turnout_percentage: turnout,
      candidates: candidateResults,
    };
  },

  /**
   * Reset seluruh suara (kosongkan votes di Supabase, Server API, dan Local Storage)
   */
  async resetVotes(electionId, resetTokens = false) {
    let errors = [];

    // 1. Reset di Supabase (jika terhubung)
    try {
      if (supabase) {
        // Hapus seluruh baris dari tabel votes
        let query = supabase.from('votes').delete();
        if (electionId) {
          query = query.or(`election_id.eq.${electionId},election_id.is.null`);
        } else {
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        const { error: voteErr } = await query;
        if (voteErr) {
          console.warn('Supabase reset votes error:', voteErr);
          // Fallback tanpa filter jika error RLS/format
          await supabase.from('votes').delete().neq('id', 'non-existent-id');
        }

        // Jika reset status token juga dipilih
        if (resetTokens) {
          let tokenQuery = supabase
            .from('voter_tokens')
            .update({ status: 'active', used_at: null })
            .eq('status', 'used');
          if (electionId) {
            tokenQuery = tokenQuery.eq('election_id', electionId);
          }
          await tokenQuery;
        }
      }
    } catch (err) {
      console.warn('Supabase reset error:', err);
      errors.push('Supabase: ' + (err.message || 'Gagal'));
    }

    // 2. Reset di Server API (/api/votes/reset)
    try {
      await fetch('/api/votes/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId, resetTokens }),
      });
    } catch (err) {
      console.warn('Server reset votes error:', err);
    }

    // 3. Reset Local Storage
    localStorage.removeItem(LOCAL_STORAGE_VOTES_KEY);
    if (resetTokens) {
      const localTokens = tokenService.getLocalTokens ? tokenService.getLocalTokens() : [];
      if (Array.isArray(localTokens)) {
        const updated = localTokens.map((t) => ({
          ...t,
          status: t.status === 'used' ? 'active' : t.status,
          used_at: null,
        }));
        if (tokenService.setLocalTokens) {
          tokenService.setLocalTokens(updated);
        }
      }
    }

    return {
      success: true,
      message: 'Perolehan suara berhasil direset menjadi 0.',
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};
