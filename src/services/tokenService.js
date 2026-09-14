import { supabase } from './supabase';

function fail(error, fallback) {
  if (error) {
    console.error(error);
    throw new Error(error.message || fallback);
  }
}

/**
 * Setelah token dihapus, cek apakah election tersebut
 * masih memiliki token.
 *
 * Jika sudah TIDAK ADA token tersisa:
 * hapus seluruh votes untuk election tersebut.
 *
 * Ini menjaga anonimitas karena kita tidak pernah
 * menghubungkan token tertentu dengan candidate tertentu.
 */
async function cleanupVotesIfNoTokens(electionIds = []) {
  const uniqueElectionIds = [
    ...new Set(
      (electionIds || []).filter(Boolean).map(String)
    ),
  ];

  if (!uniqueElectionIds.length) return;

  for (const electionId of uniqueElectionIds) {
    try {
      const { count, error: countError } = await supabase
        .from('voter_tokens')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('election_id', electionId);

      if (countError) {
        console.error(
          `Gagal mengecek token election ${electionId}:`,
          countError
        );
        continue;
      }

      /**
       * Tidak ada token tersisa.
       * Artinya election sedang dibersihkan/reset.
       */
      if (Number(count || 0) === 0) {
        const { error: voteError } = await supabase
          .from('votes')
          .delete()
          .eq('election_id', electionId);

        if (voteError) {
          console.error(
            `Gagal membersihkan suara election ${electionId}:`,
            voteError
          );

          throw new Error(
            voteError.message ||
              'Gagal membersihkan suara pemilihan.'
          );
        }

        console.log(
          `Voting election ${electionId} berhasil dibersihkan karena semua token telah dihapus.`
        );
      }
    } catch (error) {
      console.error(
        `cleanupVotesIfNoTokens(${electionId}) error:`,
        error
      );

      throw error;
    }
  }
}

export const tokenService = {
  /**
   * ============================================================
   * GET TOKENS
   * ============================================================
   */
  async getTokens(electionId) {
    let query = supabase
      .from('voter_tokens')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (electionId) {
      query = query.eq('election_id', electionId);
    }

    const { data, error } = await query;

    fail(
      error,
      'Gagal mengambil data token.'
    );

    return data || [];
  },

  /**
   * ============================================================
   * CREATE TOKEN
   * ============================================================
   */
  async createToken(tokenData) {
    const token = (tokenData.token || '')
      .trim()
      .toUpperCase();

    if (!token) {
      throw new Error(
        'Kode token tidak boleh kosong.'
      );
    }

    const { data, error } = await supabase
      .from('voter_tokens')
      .insert({
        election_id: tokenData.election_id,
        token,
        status:
          tokenData.status || 'active',
        voter_code:
          tokenData.voter_code || null,
        voter_name:
          tokenData.voter_name || null,
      })
      .select()
      .single();

    fail(
      error,
      'Gagal membuat token.'
    );

    return data;
  },

  /**
   * ============================================================
   * CREATE MULTIPLE TOKENS
   * ============================================================
   */
  async createMultipleTokens(tokensArray) {
    const rows = (tokensArray || [])
      .map((t) => ({
        election_id: t.election_id,
        token: (t.token || '')
          .trim()
          .toUpperCase(),
        status:
          t.status || 'active',
        voter_code:
          t.voter_code || null,
        voter_name:
          t.voter_name || null,
      }))
      .filter((t) => t.token);

    if (!rows.length) {
      return [];
    }

    const { data, error } = await supabase
      .from('voter_tokens')
      .upsert(rows, {
        onConflict: 'token',
        ignoreDuplicates: true,
      })
      .select();

    fail(
      error,
      'Gagal membuat token secara massal.'
    );

    return data || [];
  },

  /**
   * ============================================================
   * UPDATE TOKEN STATUS
   * ============================================================
   */
  async updateTokenStatus(id, status) {
    const payload = {
      status,
      used_at:
        status === 'used'
          ? new Date().toISOString()
          : null,
    };

    const { data, error } = await supabase
      .from('voter_tokens')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    fail(
      error,
      'Gagal memperbarui status token.'
    );

    return data;
  },

  /**
   * ============================================================
   * DELETE SINGLE TOKEN
   * ============================================================
   *
   * Jika token yang dihapus adalah token terakhir
   * pada election tersebut, semua suara election
   * akan dibersihkan.
   */
  async deleteToken(id) {
    /**
     * Ambil election_id sebelum token dihapus.
     */
    const { data: token, error: findError } =
      await supabase
        .from('voter_tokens')
        .select('id, election_id')
        .eq('id', id)
        .single();

    fail(
      findError,
      'Token tidak ditemukan.'
    );

    const electionId =
      token?.election_id;

    /**
     * Hapus token.
     */
    const { error } = await supabase
      .from('voter_tokens')
      .delete()
      .eq('id', id);

    fail(
      error,
      'Gagal menghapus token.'
    );

    /**
     * Bersihkan votes jika sudah tidak ada
     * token yang tersisa.
     */
    await cleanupVotesIfNoTokens([
      electionId,
    ]);

    return true;
  },

  /**
   * ============================================================
   * DELETE SELECTED TOKENS
   * ============================================================
   */
  async deleteSelectedTokens(ids) {
    if (!ids?.length) {
      return true;
    }

    /**
     * Cari election_id dari token-token yang
     * akan dihapus sebelum melakukan delete.
     */
    const {
      data: tokens,
      error: findError,
    } = await supabase
      .from('voter_tokens')
      .select('id, election_id')
      .in('id', ids);

    fail(
      findError,
      'Gagal menemukan token yang akan dihapus.'
    );

    const electionIds = [
      ...new Set(
        (tokens || [])
          .map((token) => token.election_id)
          .filter(Boolean)
      ),
    ];

    /**
     * Hapus token-token.
     */
    const { error } = await supabase
      .from('voter_tokens')
      .delete()
      .in('id', ids);

    fail(
      error,
      'Gagal menghapus token terpilih.'
    );

    /**
     * Untuk setiap election yang terdampak,
     * cek apakah masih ada token.
     */
    await cleanupVotesIfNoTokens(
      electionIds
    );

    return true;
  },

  /**
   * ============================================================
   * DELETE USED TOKENS
   * ============================================================
   */
  async deleteUsedTokens(electionId) {
    /**
     * Ambil election IDs terlebih dahulu.
     */
    let findQuery = supabase
      .from('voter_tokens')
      .select('id, election_id')
      .eq('status', 'used');

    if (electionId) {
      findQuery = findQuery.eq(
        'election_id',
        electionId
      );
    }

    const {
      data: tokens,
      error: findError,
    } = await findQuery;

    fail(
      findError,
      'Gagal mengambil token yang sudah digunakan.'
    );

    const electionIds = [
      ...new Set(
        (tokens || [])
          .map((token) => token.election_id)
          .filter(Boolean)
      ),
    ];

    /**
     * Hapus token used.
     */
    let query = supabase
      .from('voter_tokens')
      .delete()
      .eq('status', 'used');

    if (electionId) {
      query = query.eq(
        'election_id',
        electionId
      );
    }

    const { error } = await query;

    fail(
      error,
      'Gagal menghapus token yang sudah digunakan.'
    );

    /**
     * Jika penghapusan membuat election
     * tidak memiliki token sama sekali,
     * bersihkan votes.
     */
    await cleanupVotesIfNoTokens(
      electionIds
    );

    return true;
  },

  /**
   * ============================================================
   * DELETE ALL TOKENS
   * ============================================================
   *
   * Ini yang paling relevan untuk reset ujicoba.
   *
   * Contoh:
   *
   * 10 token
   * 3 token sudah voting
   * hapus semua token
   * ↓
   * token = 0
   * votes = 0
   */
  async deleteAllTokens(electionId) {
    let electionIds = [];

    /**
     * Jika electionId diberikan, kita sudah tahu
     * election mana yang akan dibersihkan.
     */
    if (electionId) {
      electionIds = [electionId];
    } else {
      /**
       * Jika tidak ada electionId, cari semua
       * election yang mempunyai token.
       */
      const {
        data: tokens,
        error: findError,
      } = await supabase
        .from('voter_tokens')
        .select('election_id');

      fail(
        findError,
        'Gagal mengambil daftar token.'
      );

      electionIds = [
        ...new Set(
          (tokens || [])
            .map((token) => token.election_id)
            .filter(Boolean)
        ),
      ];
    }

    /**
     * Hapus semua token.
     */
    let query = supabase
      .from('voter_tokens')
      .delete()
      .neq('token', '');

    if (electionId) {
      query = query.eq(
        'election_id',
        electionId
      );
    }

    const { error } = await query;

    fail(
      error,
      'Gagal menghapus semua token.'
    );

    /**
     * Karena semua token election telah dihapus,
     * bersihkan seluruh votes election tersebut.
     */
    await cleanupVotesIfNoTokens(
      electionIds
    );

    return true;
  },
};