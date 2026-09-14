import { formatTokenInput, isValidTokenFormat } from '../utils/token';
import { settingsService } from './settingsService';
import { supabase } from './supabase';

const LOCAL_STORAGE_VOTES_KEY = 'e_osis_local_votes';

/**
 * Service voting E-OSIS SKWADA
 *
 * Semua proses voting menggunakan Supabase RPC:
 * - validate_voter_token(p_token)
 * - cast_vote(p_token, p_candidate_id)
 * - get_election_results(p_election_id)
 *
 * Tidak menggunakan:
 * - /api/vote/validate
 * - /api/vote/cast
 * - localStorage sebagai sumber kebenaran voting
 */

/**
 * Ambil hasil voting yang tersimpan lokal.
 *
 * Fungsi ini hanya dipertahankan untuk kompatibilitas
 * dengan kemungkinan kode lama.
 *
 * Voting production TIDAK menggunakan localStorage.
 */
function getLocalVotes() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_VOTES_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn('Gagal membaca local votes:', error);
    return [];
  }
}

/**
 * Hapus data voting lokal.
 *
 * Tidak digunakan sebagai sumber data voting production.
 */
function clearLocalVotes() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_VOTES_KEY);
  } catch (error) {
    console.warn('Gagal membersihkan local votes:', error);
  }
}

/**
 * Normalisasi error Supabase menjadi object sederhana.
 */
function normalizeSupabaseError(error, fallbackCode = 'SUPABASE_ERROR', fallbackMessage = 'Terjadi kesalahan pada server.') {
  return {
    success: false,
    valid: false,
    code: error?.code || fallbackCode,
    message: error?.message || fallbackMessage,
  };
}

export const votingService = {
  /**
   * ============================================================
   * VALIDATE TOKEN
   * ============================================================
   *
   * Menggunakan:
   * public.validate_voter_token(p_token TEXT)
   *
   * RPC akan:
   * - membersihkan token
   * - mengecek format
   * - mencari token
   * - mengecek status token
   * - mengecek status pemilihan
   * - mengembalikan informasi pemilihan
   */
  async validateToken(rawToken) {
    const cleanToken = formatTokenInput(rawToken);

    /**
     * Validasi format di frontend hanya untuk UX.
     * Keamanan sebenarnya tetap dilakukan oleh RPC.
     */
    if (!isValidTokenFormat(cleanToken)) {
      return {
        valid: false,
        code: 'INVALID_FORMAT',
        message:
          'Format token tidak valid. Token harus terdiri dari 6 karakter (A-Z, 0-9).',
      };
    }

    if (!supabase) {
      return {
        valid: false,
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Koneksi ke database belum tersedia.',
      };
    }

    try {
      const { data, error } = await supabase.rpc(
        'validate_voter_token',
        {
          p_token: cleanToken,
        }
      );

      if (error) {
        console.error('validate_voter_token RPC error:', error);

        return {
          valid: false,
          code: error.code || 'VALIDATION_FAILED',
          message:
            error.message ||
            'Gagal memvalidasi token. Silakan coba lagi.',
        };
      }

      /**
       * RPC mengembalikan JSON.
       * Supabase biasanya sudah mengubahnya menjadi object.
       */
      if (!data) {
        return {
          valid: false,
          code: 'EMPTY_RESPONSE',
          message: 'Server tidak memberikan respons valid.',
        };
      }

      return {
        ...data,
        valid: data.valid === true,
        token: data.valid === true ? cleanToken : undefined,
      };
    } catch (error) {
      console.error('validateToken error:', error);

      return {
        valid: false,
        code: 'VALIDATION_ERROR',
        message:
          error?.message ||
          'Terjadi kesalahan saat memvalidasi token.',
      };
    }
  },

  /**
   * ============================================================
   * CAST VOTE
   * ============================================================
   *
   * Menggunakan:
   * public.cast_vote(
   *   p_token TEXT,
   *   p_candidate_id UUID
   * )
   *
   * Atomic voting dilakukan di PostgreSQL.
   *
   * RPC:
   * 1. Lock token dengan FOR UPDATE
   * 2. Cek token
   * 3. Cek status pemilihan
   * 4. Cek kandidat
   * 5. Insert vote
   * 6. Tandai token sebagai used
   *
   * Dengan demikian frontend tidak melakukan:
   * - insert ke votes
   * - update voter_tokens
   * - penyimpanan vote ke localStorage
   */
  async castVote(rawToken, candidateId) {
    const cleanToken = formatTokenInput(rawToken);

    if (!isValidTokenFormat(cleanToken)) {
      return {
        success: false,
        code: 'INVALID_TOKEN_FORMAT',
        message: 'Format token tidak valid.',
      };
    }

    if (!candidateId) {
      return {
        success: false,
        code: 'INVALID_CANDIDATE',
        message: 'Silakan tentukan kandidat pilihan Anda.',
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Koneksi ke database belum tersedia.',
      };
    }

    try {
      const { data, error } = await supabase.rpc(
        'cast_vote',
        {
          p_token: cleanToken,
          p_candidate_id: candidateId,
        }
      );

      if (error) {
        console.error('cast_vote RPC error:', error);

        return {
          success: false,
          code: error.code || 'VOTE_FAILED',
          message:
            error.message ||
            'Gagal menyimpan suara. Silakan coba lagi.',
        };
      }

      if (!data) {
        return {
          success: false,
          code: 'EMPTY_RESPONSE',
          message: 'Server tidak memberikan respons valid.',
        };
      }

      /**
       * Jangan menyimpan token atau vote ke localStorage.
       *
       * Database RPC adalah sumber kebenaran.
       */
      return {
        ...data,
        success: data.success === true,
      };
    } catch (error) {
      console.error('castVote error:', error);

      return {
        success: false,
        code: 'VOTE_ERROR',
        message:
          error?.message ||
          'Terjadi kesalahan saat menyimpan suara.',
      };
    }
  },

  /**
   * ============================================================
   * GET RESULTS
   * ============================================================
   *
   * Menggunakan:
   * public.get_election_results(p_election_id UUID)
   *
   * RPC mengembalikan:
   * - total_tokens
   * - used_tokens
   * - unused_tokens
   * - total_votes
   * - turnout_percentage
   * - candidates
   */
  async getResults(electionId) {
    if (!electionId) {
      return {
        success: false,
        code: 'NO_ELECTION',
        message: 'ID pemilihan tidak ditemukan.',
        election_id: electionId,
        total_tokens: 0,
        used_tokens: 0,
        unused_tokens: 0,
        total_votes: 0,
        turnout_percentage: 0,
        candidates: [],
      };
    }

    if (!supabase) {
      return {
        success: false,
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'Koneksi ke database belum tersedia.',
        election_id: electionId,
        total_tokens: 0,
        used_tokens: 0,
        unused_tokens: 0,
        total_votes: 0,
        turnout_percentage: 0,
        candidates: [],
      };
    }

    try {
      const { data, error } = await supabase.rpc(
        'get_election_results',
        {
          p_election_id: electionId,
        }
      );

      if (error) {
        console.error('get_election_results RPC error:', error);

        return {
          success: false,
          code: error.code || 'RESULTS_FAILED',
          message:
            error.message ||
            'Gagal mengambil hasil pemilihan.',
          election_id: electionId,
          total_tokens: 0,
          used_tokens: 0,
          unused_tokens: 0,
          total_votes: 0,
          turnout_percentage: 0,
          candidates: [],
        };
      }

      if (!data) {
        return {
          success: false,
          code: 'EMPTY_RESPONSE',
          message: 'Hasil pemilihan tidak tersedia.',
          election_id: electionId,
          total_tokens: 0,
          used_tokens: 0,
          unused_tokens: 0,
          total_votes: 0,
          turnout_percentage: 0,
          candidates: [],
        };
      }

      /**
       * Normalisasi hasil supaya kompatibel
       * dengan halaman Results yang mungkin menggunakan
       * vote_count atau votes.
       */
      const candidates = Array.isArray(data.candidates)
        ? data.candidates.map((candidate) => ({
            ...candidate,
            votes:
              candidate.votes ??
              candidate.vote_count ??
              0,
            vote_count:
              candidate.vote_count ??
              candidate.votes ??
              0,
          }))
        : [];

      return {
        success: true,
        election_id: data.election_id || electionId,
        total_tokens: Number(data.total_tokens || 0),
        used_tokens: Number(data.used_tokens || 0),
        unused_tokens: Number(data.unused_tokens || 0),
        total_votes: Number(data.total_votes || 0),
        turnout_percentage: Number(
          data.turnout_percentage || 0
        ),
        candidates,
      };
    } catch (error) {
      console.error('getResults error:', error);

      return {
        success: false,
        code: 'RESULTS_ERROR',
        message:
          error?.message ||
          'Terjadi kesalahan saat mengambil hasil pemilihan.',
        election_id: electionId,
        total_tokens: 0,
        used_tokens: 0,
        unused_tokens: 0,
        total_votes: 0,
        turnout_percentage: 0,
        candidates: [],
      };
    }
  },

  /**
   * ============================================================
   * RESET VOTES
   * ============================================================
   *
   * Fungsi admin untuk mengosongkan hasil voting.
   *
   * Catatan:
   * RPC voting_function.sql yang kamu kirim BELUM memiliki
   * RPC khusus reset voting.
   *
   * Karena itu fungsi ini menggunakan operasi Supabase langsung.
   *
   * RLS database harus mengizinkan operasi admin yang sesuai.
   */
  async resetVotes(electionId, resetTokens = false) {
    const errors = [];

    if (!supabase) {
      return {
        success: false,
        message: 'Koneksi ke database belum tersedia.',
        errors: ['Supabase tidak tersedia.'],
      };
    }

    /**
     * ----------------------------------------------------------
     * 1. Hapus votes
     * ----------------------------------------------------------
     */
    try {
      let voteQuery = supabase
        .from('votes')
        .delete();

      if (electionId) {
        voteQuery = voteQuery.eq(
          'election_id',
          electionId
        );
      } else {
        /**
         * Supabase membutuhkan filter pada delete.
         * UUID dummy ini tidak seharusnya ada.
         */
        voteQuery = voteQuery.neq(
          'id',
          '00000000-0000-0000-0000-000000000000'
        );
      }

      const { error: voteError } = await voteQuery;

      if (voteError) {
        console.error(
          'Reset votes error:',
          voteError
        );

        errors.push(
          'Votes: ' +
            (voteError.message || 'Gagal menghapus suara.')
        );
      }
    } catch (error) {
      console.error('Reset votes exception:', error);

      errors.push(
        'Votes: ' +
          (error?.message || 'Gagal menghapus suara.')
      );
    }

    /**
     * ----------------------------------------------------------
     * 2. Reset token jika diminta
     * ----------------------------------------------------------
     */
    if (resetTokens) {
      try {
        let tokenQuery = supabase
          .from('voter_tokens')
          .update({
            status: 'active',
            used_at: null,
          })
          .eq('status', 'used');

        if (electionId) {
          tokenQuery = tokenQuery.eq(
            'election_id',
            electionId
          );
        }

        const { error: tokenError } =
          await tokenQuery;

        if (tokenError) {
          console.error(
            'Reset token error:',
            tokenError
          );

          errors.push(
            'Tokens: ' +
              (tokenError.message ||
                'Gagal mereset token.')
          );
        }
      } catch (error) {
        console.error(
          'Reset token exception:',
          error
        );

        errors.push(
          'Tokens: ' +
            (error?.message ||
              'Gagal mereset token.')
        );
      }
    }

    /**
     * ----------------------------------------------------------
     * 3. Bersihkan data lokal lama
     * ----------------------------------------------------------
     *
     * Ini bukan sumber data voting.
     * Hanya membersihkan data dari versi aplikasi lama.
     */
    clearLocalVotes();

    return {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? 'Perolehan suara berhasil direset menjadi 0.'
          : 'Reset selesai dengan beberapa kendala.',
      errors:
        errors.length > 0
          ? errors
          : undefined,
    };
  },

  /**
   * ============================================================
   * COMPATIBILITY HELPERS
   * ============================================================
   *
   * Beberapa komponen lama mungkin masih membutuhkan fungsi
   * berikut. Kita pertahankan agar tidak menyebabkan error
   * import jika ada yang menggunakannya.
   */

  async getElection() {
    try {
      if (settingsService?.getElection) {
        return await settingsService.getElection();
      }

      return null;
    } catch (error) {
      console.error(
        'votingService.getElection error:',
        error
      );

      return null;
    }
  },

  /**
   * Fungsi ini hanya untuk kompatibilitas kode lama.
   *
   * JANGAN digunakan sebagai sumber kebenaran apakah
   * seseorang sudah memilih.
   */
  getLocalVotes,

  /**
   * Hapus data voting lokal lama.
   */
  clearLocalVotes,
};