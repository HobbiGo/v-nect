"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase";

type AccountAuthModalProps = {
  open: boolean;
  initialMode?: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
};

export function AccountAuthModal({
  open,
  initialMode = "login",
  onClose,
  onSuccess,
}: AccountAuthModalProps) {
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email dan kata sandi wajib diisi.");
      return;
    }

    if (mode === "register" && password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setInfoMsg("Berhasil masuk ke akun v-nect.");
        onSuccess?.();
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.trim().split("@")[0],
            },
          },
        });
        if (error) throw error;
        setInfoMsg(
          "Pendaftaran akun berhasil! Silakan cek email jika verifikasi aktif, lalu masuk dengan akun Anda."
        );
        onSuccess?.();
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal memproses akun.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vn-auth-backdrop" role="dialog" aria-modal="true">
      <div className="vn-auth-card">
        <div className="vn-auth-head">
          <div>
            <span className="vn-auth-tag">v-nect ACCOUNT</span>
            <h3>{mode === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}</h3>
          </div>
          <button type="button" className="vn-auth-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="vn-auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "vn-auth-tab active" : "vn-auth-tab"}
            onClick={() => {
              setMode("login");
              setErrorMsg("");
              setInfoMsg("");
            }}
          >
            Masuk
          </button>
          <button
            type="button"
            className={mode === "register" ? "vn-auth-tab active" : "vn-auth-tab"}
            onClick={() => {
              setMode("register");
              setErrorMsg("");
              setInfoMsg("");
            }}
          >
            Register Akun
          </button>
        </div>

        {errorMsg && <div className="vn-auth-alert err">{errorMsg}</div>}
        {infoMsg && <div className="vn-auth-alert ok">{infoMsg}</div>}

        <form onSubmit={handleSubmit} className="vn-auth-form">
          {mode === "register" && (
            <label>
              Nama Lengkap / Bisnis
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Budi Santoso / PT Maju Jaya"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@perusahaan.com"
              required
            />
          </label>

          <label>
            Kata Sandi
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
            />
          </label>

          <button type="submit" className="vn-auth-submit" disabled={loading}>
            {loading
              ? "Memproses..."
              : mode === "login"
              ? "Masuk Sekarang →"
              : "Daftar Akun →"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .vn-auth-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
          background: rgba(4, 11, 22, 0.72);
          display: grid;
          place-items: center;
          padding: 16px;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .vn-auth-card {
          width: 100%;
          max-width: 420px;
          background: #0d1e34;
          border: 1px solid rgba(126, 232, 220, 0.25);
          border-radius: 16px;
          padding: 22px;
          color: #eef4fb;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.45);
        }

        .vn-auth-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .vn-auth-tag {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: #13c8b5;
        }

        .vn-auth-head h3 {
          margin: 4px 0 0;
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
        }

        .vn-auth-close {
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: #eef4fb;
          border-radius: 8px;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 13px;
        }

        .vn-auth-tabs {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          background: #081526;
          padding: 5px;
          border-radius: 10px;
        }

        .vn-auth-tab {
          border: none;
          background: transparent;
          color: #9cb2cc;
          padding: 9px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-auth-tab.active {
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
        }

        .vn-auth-alert {
          margin-top: 12px;
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.5;
        }

        .vn-auth-alert.err {
          background: rgba(229, 57, 85, 0.16);
          color: #ffc2cc;
          border: 1px solid rgba(255, 123, 144, 0.35);
        }

        .vn-auth-alert.ok {
          background: rgba(19, 200, 181, 0.16);
          color: #9ff5eb;
          border: 1px solid rgba(19, 200, 181, 0.35);
        }

        .vn-auth-form {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vn-auth-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #d2deed;
        }

        .vn-auth-form input {
          padding: 11px 13px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: #081526;
          color: #ffffff;
          font: inherit;
          font-size: 14px;
        }

        .vn-auth-submit {
          margin-top: 6px;
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-auth-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
