"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type BusinessFeedNavbarProps = {
  activePath?: string;
};

export function BusinessFeedNavbar({
  activePath,
}: BusinessFeedNavbarProps) {
  const pathname = usePathname();
  const currentPath = activePath || pathname || "/business-feed";

  const [supabase] = useState(() => createClient());
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  async function refreshSessionAccount() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const displayName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Account";
      setAccountLabel(displayName);
    } else {
      setAccountLabel(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function initAccount() {
      if (!active) return;
      await refreshSessionAccount();
    }

    initAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user;
      if (!user) {
        setAccountLabel(null);
      } else {
        const displayName =
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Account";
        setAccountLabel(displayName);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAccountLabel(null);
  }

  return (
    <>
      <header className="bf-topbar">
        <div className="bf-topbar-inner">
          <div className="bf-topbar-left">
            <Link href="/" className="bf-brand-link">
              <img
                src="/images/V-NECT-logo.png"
                alt="v-nect logo"
                className="bf-brand-logo"
              />
              <span className="bf-brand-name">
                v<span>-nect</span>
              </span>
            </Link>

            <Link href="/" className="bf-home-btn">
              ← Home
            </Link>
          </div>

          <nav className="bf-topbar-nav" aria-label="Business Feed Navigation">
            <Link
              href="/explore"
              className={
                currentPath === "/explore" ? "bf-nav-item active" : "bf-nav-item"
              }
            >
              Explore
            </Link>
            <Link
              href="/business-feed"
              className={
                currentPath === "/business-feed"
                  ? "bf-nav-item active"
                  : "bf-nav-item"
              }
            >
              Business Feed
            </Link>
            <Link
              href="/v-hub"
              className={
                currentPath === "/v-hub" ? "bf-nav-item active" : "bf-nav-item"
              }
            >
              v-hub
            </Link>
            <Link
              href="/v-circle"
              className={
                currentPath === "/v-circle"
                  ? "bf-nav-item active"
                  : "bf-nav-item"
              }
            >
              v-circle
            </Link>
            <Link
              href="/v-market"
              className={
                currentPath === "/v-market"
                  ? "bf-nav-item active"
                  : "bf-nav-item"
              }
            >
              v-market
            </Link>
            <Link
              href="/v-meet"
              className={
                currentPath === "/v-meet" ? "bf-nav-item active" : "bf-nav-item"
              }
            >
              v-meet
            </Link>
            <Link
              href="/dashboard"
              className={
                currentPath === "/dashboard"
                  ? "bf-nav-item active"
                  : "bf-nav-item"
              }
            >
              Dashboard
            </Link>

            {accountLabel ? (
              <div className="bf-account-group">
                <span className="bf-account-pill">● {accountLabel}</span>
                <button
                  type="button"
                  className="bf-auth-btn outline"
                  onClick={handleSignOut}
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="bf-auth-btn"
                onClick={() => setAuthModalOpen(true)}
              >
                Masuk / Register
              </button>
            )}
          </nav>
        </div>

        <style jsx>{`
          .bf-topbar {
            position: sticky;
            top: 0;
            z-index: 40;
            width: 100%;
            background: rgba(6, 11, 36, 0.88);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(138, 165, 255, 0.14);
            padding: 12px 24px;
            font-family: var(--font-sans), Arial, sans-serif;
          }

          .bf-topbar-inner {
            max-width: 1240px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
          }

          .bf-topbar-left {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .bf-brand-link {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            text-decoration: none;
            color: #ffffff;
          }

          .bf-brand-logo {
            width: 32px;
            height: 32px;
            border-radius: 7px;
            object-fit: cover;
          }

          .bf-brand-name {
            font-size: 18px;
            font-weight: 850;
            letter-spacing: 0.6px;
            color: #ffffff;
          }

          .bf-brand-name span {
            color: #8ab4ff;
          }

          .bf-home-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 8px;
            background: linear-gradient(110deg, #4b6bff, #7854ff);
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
          }

          .bf-home-btn:hover {
            opacity: 0.94;
          }

          .bf-topbar-nav {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .bf-nav-item {
            padding: 7px 12px;
            border-radius: 8px;
            color: #c8d7f5;
            font-size: 12.5px;
            font-weight: 600;
            text-decoration: none;
            background: rgba(14, 24, 58, 0.72);
            border: 1px solid rgba(138, 165, 255, 0.18);
            white-space: nowrap;
            transition: all 0.2s ease;
          }

          .bf-nav-item:hover,
          .bf-nav-item.active {
            color: #ffffff;
            border-color: rgba(138, 180, 255, 0.5);
            background: rgba(92, 124, 255, 0.22);
          }

          .bf-account-group {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .bf-account-pill {
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(92, 124, 255, 0.18);
            border: 1px solid rgba(138, 180, 255, 0.38);
            color: #c7dcff;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          .bf-auth-btn {
            padding: 8px 14px;
            border-radius: 8px;
            border: none;
            background: linear-gradient(110deg, #4b6bff, #7854ff);
            color: #ffffff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
          }

          .bf-auth-btn.outline {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(138, 165, 255, 0.28);
            color: #eef3ff;
          }

          @media (max-width: 540px) {
            .bf-topbar {
              padding: 10px 14px;
            }

            .bf-nav-item,
            .bf-auth-btn,
            .bf-home-btn {
              padding: 7px 11px;
              font-size: 12px;
            }
          }
        `}</style>
      </header>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => refreshSessionAccount()}
      />
    </>
  );
}
