"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type ActiveUser = {
  id: string;
  label: string;
};

export default function HomePage() {
  const supabase = createClient();

  const [activeUser, setActiveUser] = useState<ActiveUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [signingOut, setSigningOut] = useState(false);

  async function syncSession() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActiveUser(null);
      return;
    }

    const displayName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Member";

    setActiveUser({
      id: user.id,
      label: displayName,
    });
  }

  useEffect(() => {
    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        setActiveUser(null);
      } else {
        const displayName =
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Member";
        setActiveUser({
          id: user.id,
          label: displayName,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      setActiveUser(null);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="vn-home">
      <header className="vn-nav">
        <div className="vn-nav-inner">
          <Link href="/" className="vn-brand">
            <span className="vn-brand-mark">◈</span>
            <div>
              <strong>v-nect</strong>
              <small>GLOBAL BUSINESS ECOSYSTEM</small>
            </div>
          </Link>

          <nav className="vn-nav-links" aria-label="Primary Navigation">
            <Link href="/business-feed" className="vn-nav-link accent">
              Business Feed ↗
            </Link>
            <Link href="/v-meet" className="vn-nav-link">
              v-meet
            </Link>
            <Link href="/company" className="vn-nav-link">
              Company
            </Link>
            <a href="#ecosystem" className="vn-nav-link">
              Ecosystem
            </a>
          </nav>

          <div className="vn-auth-cluster">
            {activeUser ? (
              <>
                <span className="vn-user-badge" title={activeUser.label}>
                  ● {activeUser.label}
                </span>
                <button
                  type="button"
                  className="vn-signout-btn"
                  disabled={signingOut}
                  onClick={handleSignOut}
                >
                  {signingOut ? "..." : "Keluar"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="vn-ghost-btn"
                  onClick={() => openAuth("login")}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  className="vn-primary-btn"
                  onClick={() => openAuth("register")}
                >
                  Daftar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="vn-hero">
        <div className="vn-hero-grid">
          <div className="vn-hero-copy">
            <span className="vn-eyebrow">
              GLOBAL BUSINESS COMMUNICATION PLATFORM
            </span>
            <h1>
              Connect Beyond <span>Boundaries.</span>
            </h1>
            <p>
              One connected ecosystem for communication, collaboration,
              business networking, live feeds, real-time chat, and virtual
              meetings.
            </p>

            <div className="vn-hero-actions">
              <Link href="/business-feed" className="vn-cta-primary">
                Open Business Feed ↗
              </Link>
              <Link href="/v-meet" className="vn-cta-secondary">
                Launch v-meet
              </Link>
            </div>

            <div className="vn-hero-foot">
              ONE ACCOUNT. ONE ECOSYSTEM. GLOBAL CONNECTIONS.
            </div>
          </div>

          <div className="vn-orbit-panel" aria-hidden="true">
            <div className="vn-node n-top">BUSINESS</div>
            <div className="vn-node n-right">CONNECT</div>
            <div className="vn-node n-bottom">GLOBAL</div>
            <div className="vn-node n-left">COMMUNITY</div>
            <div className="vn-core">
              <span>v-nect</span>
              <small>Live Hub</small>
            </div>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="vn-modules-section">
        <div className="vn-section-head">
          <span className="vn-eyebrow">THE v-nect ECOSYSTEM</span>
          <h2>Everything Connected</h2>
        </div>

        <div className="vn-modules-grid">
          <Link href="/business-feed" className="vn-module-card">
            <span className="vn-mod-tag">ACTIVE</span>
            <h3>Business Feed</h3>
            <p>
              Publikasi pengumuman perusahaan, peluncuran produk, diskusi
              komentar per gambar, serta unggahan video pendek &amp; stories.
            </p>
            <span className="vn-mod-link">Masuk ke Feed →</span>
          </Link>

          <Link href="/v-meet" className="vn-module-card">
            <span className="vn-mod-tag">LIVE</span>
            <h3>v-meet Room</h3>
            <p>
              Ruang rapat suara, kamera, berbagi layar, kode undangan room,
              catatan agenda, dan obrolan langsung antar peserta.
            </p>
            <span className="vn-mod-link">Buka v-meet →</span>
          </Link>

          <Link href="/company" className="vn-module-card">
            <span className="vn-mod-tag">WORKSPACE</span>
            <h3>Company Hub</h3>
            <p>
              Kelola profil perusahaan, identitas brand, dan akses publikasi
              resmi dari akun yang sedang aktif.
            </p>
            <span className="vn-mod-link">Kelola Perusahaan →</span>
          </Link>
        </div>
      </section>

      <footer className="vn-footer">
        © {new Date().getFullYear()} v-nect · Connecting Beyond Boundaries
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => syncSession()}
      />

      <style jsx>{`
        .vn-home {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #12395b 0%, #07111f 58%);
          color: #eef4fb;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .vn-nav {
          position: sticky;
          top: 0;
          z-index: 30;
          background: rgba(7, 17, 31, 0.88);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .vn-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .vn-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #ffffff;
        }

        .vn-brand-mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          background: linear-gradient(120deg, #347cf0, #13c8b5);
          color: #ffffff;
          font-size: 17px;
          font-weight: 800;
        }

        .vn-brand strong {
          display: block;
          font-size: 16px;
          font-weight: 800;
          line-height: 1.1;
        }

        .vn-brand small {
          display: block;
          font-size: 9px;
          letter-spacing: 1.4px;
          color: #8fa6c2;
          margin-top: 2px;
        }

        .vn-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vn-nav-link {
          text-decoration: none;
          color: #c8d7ea;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 8px;
        }

        .vn-nav-link:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .vn-nav-link.accent {
          background: rgba(19, 200, 181, 0.14);
          border: 1px solid rgba(19, 200, 181, 0.35);
          color: #8af3e6;
          font-weight: 700;
        }

        .vn-auth-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vn-user-badge {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(19, 200, 181, 0.15);
          border: 1px solid rgba(19, 200, 181, 0.35);
          color: #7ee8dc;
          font-size: 12px;
          font-weight: 700;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vn-signout-btn,
        .vn-ghost-btn {
          padding: 7px 13px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.05);
          color: #e6effa;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-primary-btn {
          padding: 7px 14px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px 36px;
        }

        .vn-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.9fr);
          gap: 32px;
          align-items: center;
        }

        .vn-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.8px;
          color: #13c8b5;
        }

        .vn-hero-copy h1 {
          margin: 14px 0;
          font-size: 48px;
          line-height: 1.1;
          font-weight: 800;
          color: #ffffff;
        }

        .vn-hero-copy h1 span {
          color: #13c8b5;
        }

        .vn-hero-copy p {
          margin: 0;
          max-width: 560px;
          font-size: 15px;
          line-height: 1.7;
          color: #c7d8ec;
        }

        .vn-hero-actions {
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .vn-cta-primary {
          display: inline-flex;
          align-items: center;
          padding: 12px 20px;
          border-radius: 10px;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .vn-cta-secondary {
          display: inline-flex;
          align-items: center;
          padding: 12px 18px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #eef4fb;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .vn-hero-foot {
          margin-top: 22px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.4px;
          color: #7d95b3;
        }

        .vn-orbit-panel {
          position: relative;
          min-height: 270px;
          border-radius: 20px;
          background: rgba(11, 27, 48, 0.72);
          border: 1px solid rgba(126, 232, 220, 0.18);
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .vn-core {
          width: 108px;
          height: 108px;
          border-radius: 999px;
          background: linear-gradient(135deg, #347cf0, #13c8b5);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 36px rgba(19, 200, 181, 0.35);
        }

        .vn-core span {
          font-size: 17px;
          font-weight: 800;
        }

        .vn-core small {
          font-size: 11px;
          opacity: 0.9;
        }

        .vn-node {
          position: absolute;
          padding: 6px 12px;
          border-radius: 999px;
          background: #102642;
          border: 1px solid rgba(126, 232, 220, 0.35);
          color: #9ff5eb;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .n-top {
          top: 16px;
        }
        .n-bottom {
          bottom: 16px;
        }
        .n-left {
          left: 16px;
        }
        .n-right {
          right: 16px;
        }

        .vn-modules-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 24px 68px;
        }

        .vn-section-head h2 {
          margin: 8px 0 20px;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
        }

        .vn-modules-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .vn-module-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-decoration: none;
          background: #0d1e34;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 20px;
          color: #eef4fb;
        }

        .vn-module-card:hover {
          border-color: #13c8b5;
        }

        .vn-mod-tag {
          align-self: flex-start;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(19, 200, 181, 0.16);
          color: #7ee8dc;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .vn-module-card h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
        }

        .vn-module-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.65;
          color: #b4c6dc;
          flex: 1;
        }

        .vn-mod-link {
          font-size: 13px;
          font-weight: 700;
          color: #7ee8dc;
        }

        .vn-footer {
          text-align: center;
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #8fa5c2;
          font-size: 12px;
        }

        @media (max-width: 860px) {
          .vn-hero-grid,
          .vn-modules-grid {
            grid-template-columns: 1fr;
          }

          .vn-hero-copy h1 {
            font-size: 36px;
          }
        }
      `}</style>
    </main>
  );
}
