"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    router.push("/dashboard");
  }

  return <main className="container"><section className="card form-card">
    <div className="eyebrow">Welcome back</div><h1 className="section-title">Sign in to SmartPark</h1>
    {message && <div className="notice error">{message}</div>}
    <form onSubmit={submit}>
      <div className="field"><label>Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
      <div className="field"><label>Password</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
    </form>
    <p className="muted">New to SmartPark? <Link href="/register">Create an account</Link></p>
  </section></main>;
}
