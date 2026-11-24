"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [profileType, setProfileType] = useState("Personal");

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-logo">
          VOIN<span>NECT</span>
        </Link>

        <h1>Create Your Account</h1>
        <p>Join VOINNECT and connect beyond boundaries.</p>

        <form className="auth-form">
          <label className="auth-field">
            Full Name
            <input
              type="text"
              placeholder="Enter your full name"
              required
            />
          </label>

          <label className="auth-field">
            Email Address
            <input
              type="email"
              placeholder="Enter your email"
              required
            />
          </label>

          <label className="auth-field">
            Password
            <input
              type="password"
              placeholder="Create a password"
              required
              minLength={8}
            />
          </label>

          <label className="auth-field">
            Confirm Password
            <input
              type="password"
              placeholder="Confirm your password"
              required
              minLength={8}
            />
          </label>

          <div className="auth-field">
            <span>Choose Your Profile</span>

            <div className="profile-options">
              <button
                type="button"
                className={profileType === "Personal" ? "active" : ""}
                onClick={() => setProfileType("Personal")}
              >
                Personal
              </button>

              <button
                type="button"
                className={profileType === "Company" ? "active" : ""}
                onClick={() => setProfileType("Company")}
              >
                Company
              </button>
            </div>
          </div>

          <label className="terms-check">
            <input type="checkbox" required />
            <span>I agree to the Terms and Privacy Policy.</span>
          </label>

          <button type="submit" className="auth-submit">
            Create Account
          </button>
        </form>

        <div className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">Sign In</Link>
        </div>
      </div>
    </main>
  );
}
