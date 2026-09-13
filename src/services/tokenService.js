import { supabase } from './supabase';

function fail(error, fallback) {
  if (error) {
    console.error(error);
    throw new Error(error.message || fallback);
  }
}

export const tokenService = {
  async getTokens(electionId) {
    let query = supabase
      .from('voter_tokens')
      .select('*')
      .order('created_at', { ascending: false });
    if (electionId) query = query.eq('election_id', electionId);

    const { data, error } = await query;
    fail(error, 'Gagal mengambil data token.');
    return data || [];
  },

  async createToken(tokenData) {
    const token = (tokenData.token || '').trim().toUpperCase();
    if (!token) throw new Error('Kode token tidak boleh kosong.');

    const { data, error } = await supabase
      .from('voter_tokens')
      .insert({
        election_id: tokenData.election_id,
        token,
        status: tokenData.status || 'active',
        voter_code: tokenData.voter_code || null,
        voter_name: tokenData.voter_name || null,
      })
      .select()
      .single();
    fail(error, 'Gagal membuat token.');
    return data;
  },

  async createMultipleTokens(tokensArray) {
    const rows = (tokensArray || []).map((t) => ({
      election_id: t.election_id,
      token: (t.token || '').trim().toUpperCase(),
      status: t.status || 'active',
      voter_code: t.voter_code || null,
      voter_name: t.voter_name || null,
    })).filter((t) => t.token);

    const { data, error } = await supabase
      .from('voter_tokens')
      .upsert(rows, { onConflict: 'token', ignoreDuplicates: true })
      .select();
    fail(error, 'Gagal membuat token secara massal.');
    return data || [];
  },

  async updateTokenStatus(id, status) {
    const payload = { status, used_at: status === 'used' ? new Date().toISOString() : null };
    const { data, error } = await supabase
      .from('voter_tokens')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    fail(error, 'Gagal memperbarui status token.');
    return data;
  },

  async deleteToken(id) {
    const { error } = await supabase.from('voter_tokens').delete().eq('id', id);
    fail(error, 'Gagal menghapus token.');
    return true;
  },

  async deleteSelectedTokens(ids) {
    if (!ids?.length) return true;
    const { error } = await supabase.from('voter_tokens').delete().in('id', ids);
    fail(error, 'Gagal menghapus token terpilih.');
    return true;
  },

  async deleteUsedTokens(electionId) {
    let query = supabase.from('voter_tokens').delete().eq('status', 'used');
    if (electionId) query = query.eq('election_id', electionId);
    const { error } = await query;
    fail(error, 'Gagal menghapus token yang sudah digunakan.');
    return true;
  },

  async deleteAllTokens(electionId) {
    let query = supabase.from('voter_tokens').delete().neq('token', '');
    if (electionId) query = query.eq('election_id', electionId);
    const { error } = await query;
    fail(error, 'Gagal menghapus semua token.');
    return true;
  },
};
