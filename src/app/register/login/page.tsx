
"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo">
          VOIN<span>NECT</span>
        </Link>

        <h1>Welcome Back</h1>
        <p>Sign in to continue your VOINNECT journey.</p>

        <form className="auth-form">
          <label className="auth-field">
            Email Address
            <input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            Password
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <label className="terms-check">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            <span>Show password</span>
          </label>

          <button type="submit" className="auth-submit">
            Sign In
          </button>
        </form>

        <div className="auth-switch">
          Don't have an account?{" "}
          <Link href="/register">Create Account</Link>
        </div>

        <div className="auth-back">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>
    </main>
  );
}
