
import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { Profile } from '../types/app.types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isInitialized: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearSession: () => set({ session: null, profile: null }),
}));
