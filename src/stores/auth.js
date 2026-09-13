import { defineStore } from 'pinia';
import { supabase } from '../services/supabase';

const ADMIN_STORAGE_KEY_PRIMARY = 'e_osis_admin_session';
const ADMIN_STORAGE_KEY_LEGACY = 'eosis_admin_session';

function saveAdminSession(sessionObj) {
  const json = JSON.stringify(sessionObj);
  localStorage.setItem(ADMIN_STORAGE_KEY_PRIMARY, json);
  localStorage.setItem(ADMIN_STORAGE_KEY_LEGACY, json);
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_STORAGE_KEY_PRIMARY);
  localStorage.removeItem(ADMIN_STORAGE_KEY_LEGACY);
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    adminProfile: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  }),

  actions: {
    async init() {
      this.loading = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          this.user = session.user;
          this.isAuthenticated = true;
          const { data: profile } = await supabase
            .from('admin_profiles')
            .select('*')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();
          this.adminProfile = profile || {
            username: session.user.email?.split('@')[0] || 'admin',
            email: session.user.email,
          };
        } else {
          this.user = null;
          this.adminProfile = null;
          this.isAuthenticated = false;
        }
      } catch (err) {
        this.user = null;
        this.adminProfile = null;
        this.isAuthenticated = false;
        console.warn('Auth init check:', err);
      } finally {
        this.loading = false;
      }
    },

    async login(identifier, password) {
      this.loading = true;
      this.error = null;

      try {
        const cleanIdentifier = (identifier || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();
        const email = cleanIdentifier.includes('@')
          ? cleanIdentifier
          : `${cleanIdentifier}@smpn2kwadungan.sch.id`;

        // Production authentication MUST use Supabase Auth so every device
        // shares the same authentication system. No local/demo password is used.
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: cleanPassword,
        });

        if (error || !data?.user) {
          throw new Error(error?.message || 'Username atau password salah.');
        }

        this.user = data.user;
        this.isAuthenticated = true;

        // Create/update the admin profile tied to the authenticated Supabase user.
        const profilePayload = {
          auth_user_id: data.user.id,
          username: cleanIdentifier.split('@')[0] || 'admin',
          full_name: data.user.user_metadata?.full_name || 'Administrator E-OSIS SMPN 2 Kwadungan',
        };
        const { data: existingProfile } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        let profile = existingProfile;
        if (existingProfile) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('admin_profiles')
            .update({ username: profilePayload.username, full_name: profilePayload.full_name })
            .eq('id', existingProfile.id)
            .select()
            .single();
          if (!updateError) profile = updatedProfile;
        } else {
          const { data: createdProfile, error: createError } = await supabase
            .from('admin_profiles')
            .insert(profilePayload)
            .select()
            .single();
          if (!createError) profile = createdProfile;
        }

        this.adminProfile = profile || {
          username: profilePayload.username,
          full_name: profilePayload.full_name,
          email: data.user.email,
        };
        saveAdminSession({ user: this.user, profile: this.adminProfile });
        return { success: true };
      } catch (err) {
        this.error = err.message || 'Login gagal';
        return { success: false, message: this.error };
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
      this.user = null;
      this.adminProfile = null;
      this.isAuthenticated = false;
      clearAdminSession();
    },
  },
});
