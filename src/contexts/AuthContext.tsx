import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getErrorMessage } from '../lib/errors';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const client = requireSupabase();

    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession((prev) => {
        if (
          prev?.access_token === nextSession?.access_token &&
          prev?.user?.id === nextSession?.user?.id
        ) {
          return prev;
        }
        return nextSession;
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const client = requireSupabase();
    const { error } = await client.auth.signOut();
    if (error) throw new Error(getErrorMessage(error));
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const client = requireSupabase();
      const email = session?.user?.email;
      if (!email) throw new Error('You must be signed in to change your password.');

      const { error: verifyError } = await client.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Current password is incorrect.');

      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) throw new Error(getErrorMessage(error));
    },
    [session?.user?.email],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      changePassword,
    }),
    [session, loading, signIn, signUp, signOut, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
