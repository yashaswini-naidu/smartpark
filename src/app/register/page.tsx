"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName,setFullName] = useState("");
  const [email,setEmail] = useState("");
  const [phone,setPhone] = useState("");
  const [password,setPassword] = useState("");
  const [confirm,setConfirm] = useState("");
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage("");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setMessage("Password must be at least 8 characters and include an uppercase letter, a number and a special character."); return;
    }
    if (password !== confirm) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone } }
    });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    if (data.session) router.push("/dashboard");
    else setMessage("Registration successful. If email confirmation is enabled, confirm your email before signing in.");
  }

  return <main className="container"><section className="card form-card">
    <div className="eyebrow">Join SmartPark</div><h1 className="section-title">Create your account</h1>
    {message && <div className="notice error">{message}</div>}
    <form onSubmit={submit}>
      <div className="field"><label>Full name *</label><input required value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
      <div className="field"><label>Email *</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
      <div className="field"><label>Phone *</label><input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} /></div>
      <div className="field"><label>Password *</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
      <div className="field"><label>Retype password *</label><input type="password" required value={confirm} onChange={e=>setConfirm(e.target.value)} /></div>
      <button className="btn" disabled={busy}>{busy ? "Creating account..." : "Register"}</button>
    </form>
    <p className="muted">Already registered? <Link href="/login">Sign in</Link></p>
  </section></main>;
}
