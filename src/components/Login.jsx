import React, { useEffect, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { LogIn, AlertTriangle, Leaf } from "lucide-react";

function GrowingTree() {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGrown(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`login-tree-scene ${grown ? "is-grown" : ""}`} aria-hidden="true">
      <div className="tree-glow" />
      <div className="tree-ground" />
      <svg className="tree-svg" viewBox="0 0 420 330" role="presentation">
        <defs>
          <linearGradient id="treeTrunk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5a2b" />
            <stop offset="1" stopColor="#4b2e18" />
          </linearGradient>
          <linearGradient id="treeLeaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9be15d" />
            <stop offset="0.55" stopColor="#36b37e" />
            <stop offset="1" stopColor="#13795b" />
          </linearGradient>
          <filter id="treeShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <ellipse className="tree-shadow" cx="210" cy="300" rx="92" ry="15" />
        <g className="tree-trunk" fill="url(#treeTrunk)">
          <path d="M198 292 C194 250 195 212 202 176 C207 151 214 128 224 108 L245 117 C234 144 228 166 227 190 C226 225 234 258 239 292 Z" />
          <path d="M215 185 C187 160 164 144 135 132 L143 115 C174 124 201 138 224 158 Z" />
          <path d="M224 165 C249 142 272 129 300 119 L306 136 C277 146 253 162 231 186 Z" />
        </g>
        <g className="tree-crown" fill="url(#treeLeaf)">
          <circle cx="145" cy="104" r="48" />
          <circle cx="205" cy="73" r="60" />
          <circle cx="273" cy="94" r="52" />
          <circle cx="174" cy="125" r="55" />
          <circle cx="244" cy="132" r="58" />
          <circle cx="213" cy="118" r="64" />
          <circle cx="118" cy="131" r="30" />
          <circle cx="306" cy="132" r="34" />
        </g>
        <g className="tree-highlights" fill="#c8f7a2" opacity="0.55">
          <circle cx="159" cy="76" r="9" /><circle cx="211" cy="43" r="11" />
          <circle cx="267" cy="72" r="8" /><circle cx="185" cy="108" r="7" />
        </g>
      </svg>
      <div className="tree-caption"><Leaf size={14} /> PFL Production Portal</div>
    </div>
  );
}

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
    <main className="login-page">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-stars" />

      <GrowingTree />

      <section className="login-card" aria-label="PFL Production login">
        <div className="login-brand-mark"><Leaf size={20} /></div>
        <div className="text-center mb-6">
          <div className="login-title">PFL Production</div>
          <div className="login-subtitle">Welcome back · Secure production workspace</div>
        </div>

        {!supabaseReady && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Supabase environment variables are not set. Login is disabled until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="login-label">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="login-input" placeholder="you@company.com" autoComplete="username" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="login-label">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="login-input" placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading || !supabaseReady} className="login-button">
            <LogIn size={16} /> {loading ? "Signing in..." : "Enter Production Portal"}
          </button>
        </form>
        <div className="login-footer">Production Dashboard · Secure access</div>
      </section>
    </main>
  );
}
