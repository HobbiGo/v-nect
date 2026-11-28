"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 8) {
      setErrorMessage(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        console.error("v-nect SIGNUP ERROR:", error);
        setErrorMessage("Registration failed.");
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Registration successful! Please check your email and click the confirmation link to activate your account."
      );

    } catch (error) {
      console.error("v-nect REGISTER ERROR:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">

        <Link href="/" className="auth-logo">
          VOIN<span>NECT</span>
        </Link>

        <h1>Create Your Account</h1>

        <p>
          Join v-nect and connect beyond boundaries.
        </p>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >

          <label className="auth-field">
            Full Name

            <input
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            Email Address

            <input
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            Password

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>

          <label className="auth-field">
            Confirm Password

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              minLength={8}
              required
            />
          </label>

          <label className="terms-check">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) =>
                setShowPassword(e.target.checked)
              }
            />

            <span>Show password</span>
          </label>

          {errorMessage && (
            <p
              role="alert"
              style={{
                color: "#ff6b6b",
                fontSize: "14px",
              }}
            >
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p
              role="status"
              style={{
                color: "#13c8b5",
                fontSize: "14px",
              }}
            >
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">
            Sign In
          </Link>
        </div>

        <div className="auth-back">
          <Link href="/">
            ← Back to Home
          </Link>
        </div>

      </div>
    </main>
  );
}
