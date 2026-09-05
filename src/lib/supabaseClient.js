import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * `supabaseReady` is false when the env vars aren't configured yet (e.g.
 * fresh clone, no .env set up). The app falls back to local demo data in
 * that case instead of crashing — see pfl-dashboard.jsx's data loading.
 */
export const supabaseReady = Boolean(url && anonKey);

export const supabase = supabaseReady
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

if (!supabaseReady && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
    "Running in local demo mode — data will not persist. See .env.example."
  );
}
