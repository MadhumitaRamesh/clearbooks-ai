// lib/supabase.ts
// Auth: using Supabase anonymous sign-in — fastest to demo, no OTP/email flow
// needed on stage. Swap to signInWithOtp later if you want real accounts.

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, Session } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Add them to a .env file (see .env.example)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Ensures there's a signed-in session before any screen tries to hit the
 * backend. Call this once from the root layout on app start.
 * If a session already exists (returning user), it's reused.
 */
export async function ensureSession(): Promise<Session> {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) return existing.session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw new Error(`Anonymous sign-in failed: ${error?.message ?? "unknown error"}`);
  }
  return data.session;
}

/** Returns the current access token, or null if not signed in yet. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
