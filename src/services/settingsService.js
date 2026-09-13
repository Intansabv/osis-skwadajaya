import { supabase } from './supabase';

function throwSupabaseError(error, fallback = 'Operasi gagal. Silakan coba lagi.') {
  if (error) {
    console.error(error);
    throw new Error(error.message || fallback);
  }
}

export const settingsService = {
  async getElection() {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    throwSupabaseError(error, 'Gagal mengambil data pemilihan.');
    if (!data) throw new Error('Data pemilihan belum tersedia di database pusat.');
    return data;
  },

  async updateElection(id, updates) {
    if (!id) throw new Error('ID pemilihan tidak ditemukan.');

    const allowed = {
      school_name: updates.school_name,
      school_logo_url: updates.school_logo_url,
      election_title: updates.election_title,
      election_period: updates.election_period,
      status: updates.status,
      start_at: updates.start_at,
      end_at: updates.end_at,
      chairman_name: updates.chairman_name,
      chairman_nip: updates.chairman_nip,
      custom_print_date: updates.custom_print_date,
    };
    const payload = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));

    const { data, error } = await supabase
      .from('elections')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    throwSupabaseError(error, 'Gagal menyimpan pengaturan pemilihan. Pastikan akun admin sudah login ke Supabase.');
    return data;
  },

  async uploadSchoolLogo(file) {
    if (!file) throw new Error('File logo tidak ditemukan.');

    const extension = (file.name?.split('.').pop() || 'png').toLowerCase();
    const path = `school-logo/logo-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(path, file, { upsert: true, contentType: file.type || undefined });

    throwSupabaseError(uploadError, 'Gagal mengunggah logo ke penyimpanan pusat.');

    const { data } = supabase.storage.from('school-assets').getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('URL logo tidak berhasil dibuat.');
    return data.publicUrl;
  },
};
