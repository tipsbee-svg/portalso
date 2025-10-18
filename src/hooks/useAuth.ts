
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { session, profile } = useAuthStore();
  const user = session?.user ?? null;
  const isSuperAdmin = profile?.role === 'super_admin';

  return { user, profile, isSuperAdmin, session, isAuthenticated: !!session };
}
