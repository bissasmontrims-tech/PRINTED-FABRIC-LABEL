import React, { useState } from "react";
import { supabase, supabaseReady } from "../lib/supabaseClient";
import { LogIn, AlertTriangle, Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="real-tree-login">
      <div className="tree-backdrop" aria-hidden="true" />
      <div className="tree-atmosphere" aria-hidden="true" />

      <section className="real-login-card card-visible" aria-label="PFL Production login">
        <div className="real-brand-mark"><Leaf size={22} /></div>
        <div className="real-login-title"><b>PFL</b> <span>Production</span></div>
        <div className="real-login-subtitle">Welcome back · Secure production management</div>

        {!supabaseReady && (
          <div className="login-warning"><AlertTriangle size={14} /><span>Supabase environment variables are not set.</span></div>
        )}

        <form onSubmit={handleSubmit} className="real-form">
          <label className="real-field"><span>Email</span><div className="field-wrap"><Mail size={16}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoComplete="username" /></div></label>
          <label className="real-field"><span>Password</span><div className="field-wrap"><Lock size={16}/><input type={showPassword ? "text" : "password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" /><button type="button" className="eye-btn" onClick={()=>setShowPassword(v=>!v)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          {error && <div className="real-error">{error}</div>}
          <button type="submit" disabled={loading || !supabaseReady} className="real-login-button"><LogIn size={17}/>{loading ? "Signing in..." : "Login"}</button>
        </form>
        <div className="real-login-footer"><span>🛡</span> Your data is safe & secure</div>
      </section>
    </main>
  );
}
