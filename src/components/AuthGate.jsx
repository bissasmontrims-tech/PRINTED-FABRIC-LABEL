import React, { useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import Login from "./Login";

/**
 * Wraps the app. Unauthenticated users see the Login screen; authenticated
 * users get their profile (role, is_active) loaded and passed down to the
 * dashboard via render props. If a user is authenticated but disabled
 * (is_active = false), they're signed out and shown a message instead of
 * silently getting a broken dashboard.
 */
export default function AuthGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [disabledMsg, setDisabledMsg] = useState("");

  async function loadProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) {
      // Profile row may not exist yet (trigger race on very first signup) — retry once.
      await new Promise((r) => setTimeout(r, 600));
      const retry = await supabase.from("profiles").select("*").eq("id", userId).single();
      return retry.data || null;
    }
    return data;
  }

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const p = await loadProfile(data.session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        const p = await loadProfile(newSession.user.id);
        if (p && !p.is_active) {
          setDisabledMsg("Your account has been disabled. Contact an administrator.");
          await supabase.auth.signOut();
          setProfile(null);
          return;
        }
        setDisabledMsg("");
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  if (!supabaseReady) return <Login />;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Loading…
      </div>
    );
  }
  if (!session) {
    return (
      <div>
        {disabledMsg && (
          <div className="bg-rose-50 text-rose-700 text-sm text-center py-2 border-b border-rose-200">{disabledMsg}</div>
        )}
        <Login />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
        Setting up your account…
      </div>
    );
  }

  return children({ session, profile, logout });
}
