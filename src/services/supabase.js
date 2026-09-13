import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Konfigurasi Supabase belum tersedia. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY pada environment Vercel/local.');
}

export const supabase = createClient(supabaseUrl || 'https://invalid.supabase.co', supabaseAnonKey || 'invalid-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function checkSupabaseStatus() {
  try {
    const { data, error } = await supabase
      .from('elections')
      .select('id, school_name, status')
      .limit(1);

    if (error) {
      return { connected: true, tablesReady: false, error: error.message };
    }

    return { connected: true, tablesReady: true, electionCount: data?.length || 0 };
  } catch (err) {
    return { connected: false, tablesReady: false, error: err.message || 'Koneksi gagal' };
  }
}
