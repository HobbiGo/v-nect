"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setErrorMessage("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMessage("Login failed: " + error.message);
        return;
      }
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setErrorMessage("Login failed. Please check your email and password.");
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo">VOIN<span>NECT</span></Link>
        <h1>Welcome Back</h1>
        <p>Sign in to your v-nect account.</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-field">
            Email Address
            <input type="email" placeholder="Enter your email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="auth-field">
            Password
            <input type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <label className="terms-check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>Show password</span>
          </label>
          {errorMessage && <p role="alert" style={{ color: "#ff6b6b", fontSize: "14px" }}>{errorMessage}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="auth-switch">Don&apos;t have an account? <Link href="/register">Create Account</Link></div>
        <div className="auth-back"><Link href="/">Back to Home</Link></div>
      </div>
    </main>
  );
}
