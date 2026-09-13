import { supabase } from './supabase';

function fail(error, fallback) {
  if (error) {
    console.error(error);
    throw new Error(error.message || fallback);
  }
}

export const candidateService = {
  async getCandidates(electionId) {
    let query = supabase
      .from('candidates')
      .select('*')
      .order('number', { ascending: true });

    if (electionId) query = query.eq('election_id', electionId);

    const { data, error } = await query;
    fail(error, 'Gagal mengambil data kandidat.');
    return data || [];
  },

  async addCandidate(candidateData) {
    const { data, error } = await supabase
      .from('candidates')
      .insert({
        election_id: candidateData.election_id,
        number: Number(candidateData.number),
        chairman_name: candidateData.chairman_name,
        vice_chairman_name: candidateData.vice_chairman_name,
        photo_url: candidateData.photo_url || null,
        slogan: candidateData.slogan || null,
        vision: candidateData.vision || null,
        mission: candidateData.mission || null,
        is_active: candidateData.is_active !== false,
      })
      .select()
      .single();
    fail(error, 'Gagal menambahkan kandidat.');
    return data;
  },

  async updateCandidate(id, updates) {
    const payload = { ...updates };
    if (payload.number !== undefined) payload.number = Number(payload.number);
    delete payload.id;
    delete payload.election_id;
    delete payload.created_at;
    delete payload.updated_at;

    const { data, error } = await supabase
      .from('candidates')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    fail(error, 'Gagal memperbarui kandidat.');
    return data;
  },

  async deleteCandidate(id) {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    fail(error, 'Gagal menghapus kandidat.');
    return true;
  },

  async uploadPhoto(file) {
    if (!file) throw new Error('File foto kandidat tidak ditemukan.');
    const extension = (file.name?.split('.').pop() || 'jpg').toLowerCase();
    const path = `candidate-images/candidate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await supabase.storage
      .from('candidate-images')
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    fail(error, 'Gagal mengunggah foto kandidat.');

    const { data } = supabase.storage.from('candidate-images').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('URL foto kandidat tidak berhasil dibuat.');
    return data.publicUrl;
  },
};
