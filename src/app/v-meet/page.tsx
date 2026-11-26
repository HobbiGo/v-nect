"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { BusinessFeedNavbar } from "@/components/BusinessFeedNavbar";
import { VMeetPanel } from "@/components/VMeetPanel";
import { AccountAuthModal } from "@/components/AccountAuthModal";

export default function VMeetPage() {
  const supabase = createClient();

  const [userName, setUserName] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const displayName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Member";
      setUserName(displayName);
    } else {
      setUserName(null);
    }
  }

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="vmeet-page">
      <BusinessFeedNavbar activePath="/v-meet" />

      <div className="vmeet-container">
        <div className="vmeet-top-nav">
          <div className="vmeet-nav-group">
            <Link href="/" className="vmeet-nav-btn primary">
              ← Back to Home
            </Link>
            <Link href="/business-feed" className="vmeet-nav-btn">
              Business Feed
            </Link>
          </div>

          <span className="vmeet-session-pill">
            {userName ? `● Masuk sebagai ${userName}` : "○ Mode Tamu"}
          </span>
        </div>

        <VMeetPanel
          currentUserName={userName}
          onRequireAuth={() => setAuthModalOpen(true)}
        />
      </div>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => loadUser()}
      />

      <style jsx>{`
        .vmeet-page {
          min-height: 100vh;
          background: #07111f;
          color: #eef4fb;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .vmeet-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 20px 64px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .vmeet-top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .vmeet-nav-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .vmeet-nav-btn {
          display: inline-flex;
          align-items: center;
          padding: 9px 15px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.16);
          color: #e6effa;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        .vmeet-nav-btn.primary {
          background: linear-gradient(110deg, #13c8b5, #0fa382);
          border-color: transparent;
          color: #ffffff;
        }

        .vmeet-session-pill {
          padding: 7px 13px;
          border-radius: 999px;
          background: rgba(19, 200, 181, 0.14);
          border: 1px solid rgba(19, 200, 181, 0.35);
          color: #7ee8dc;
          font-size: 12px;
          font-weight: 700;
        }
      `}</style>
    </main>
  );
}
