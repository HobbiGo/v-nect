"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setErrorMessage("");
    setSuccessMessage("");
    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMessage("Reset failed: " + error.message);
        return;
      }
      setSuccessMessage("Password updated! You can now login with your new password.");
      setTimeout(() => {
        router.replace("/login");
      }, 1500);
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
        <h1>Reset Password</h1>
        <p>Enter your new password.</p>
        <form className="auth-form" onSubmit={handleReset}>
          <label className="auth-field">
            New Password
            <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          <label className="auth-field">
            Confirm New Password
            <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
          </label>
          {errorMessage && <p role="alert" style={{ color: "#ff6b6b", fontSize: "14px" }}>{errorMessage}</p>}
          {successMessage && <p role="status" style={{ color: "#13c8b5", fontSize: "14px" }}>{successMessage}</p>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
        <div className="auth-back"><Link href="/login">Back to Login</Link></div>
      </div>
    </main>
  );
}
