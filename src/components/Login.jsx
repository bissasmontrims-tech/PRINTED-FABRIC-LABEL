import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { LogIn, AlertTriangle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!supabaseReady) {
      setError("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) setError(authError.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{background:"radial-gradient(circle at 15% 15%, rgba(37,99,235,.22), transparent 30%), radial-gradient(circle at 85% 20%, rgba(124,58,237,.18), transparent 30%), linear-gradient(135deg,#f8fbff,#eef2ff 55%,#f5f3ff)"}}>
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-2xl p-8 relative">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg" style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)"}}>P</div>
          <div className="text-2xl font-black tracking-tight text-slate-900">PFL Production</div>
          <div className="text-sm text-slate-500 mt-1">Production Intelligence Dashboard</div>
          <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Secure sign in
          </div>
        </div>

        {!supabaseReady && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Supabase environment variables are not set. Login is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-3 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="you@company.com" autoComplete="username" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-3 bg-slate-50/70 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading || !supabaseReady}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 mt-2 shadow-lg">
            <LogIn size={15} /> {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
