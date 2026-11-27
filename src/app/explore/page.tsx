"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type ModuleCategory = "All" | "Communication" | "Workspace" | "Network & Feed";

type ExploreModule = {
  id: string;
  label: string;
  icon: string;
  accent: string;
  border: string;
  name: string;
  category: Exclude<ModuleCategory, "All">;
  tagline: string;
  description: string;
  keywords: string[];
  features: string[];
  href: string;
};

const BRAND_LOGO_SRC = "/images/V-NECT-logo.png";

const EXPLORE_MODULES: ExploreModule[] = [
  {
    id: "v-chat",
    label: "CHAT & MESSAGING",
    icon: "💬",
    accent: "#8ab4ff",
    border: "rgba(138, 180, 255, 0.34)",
    name: "v-chat",
    category: "Communication",
    tagline: "Connect and communicate.",
    description:
      "Real-time direct and group conversations for partners, teams, and business contacts.",
    keywords: ["chat", "message", "pesan", "grup", "real-time", "komunikasi"],
    features: [
      "Direct & group messaging",
      "Fast business coordination",
      "Partner & team threads",
    ],
    href: "/business-feed",
  },
  {
    id: "v-meet",
    label: "LIVE MEETINGS",
    icon: "🎥",
    accent: "#a78bfa",
    border: "rgba(167, 139, 250, 0.34)",
    name: "v-meet",
    category: "Communication",
    tagline: "Voice & video meetings.",
    description:
      "Host live discussions, pitches, and cross-border partner meetings directly inside v-nect.",
    keywords: ["meet", "video", "voice", "rapat", "pitch", "meeting", "live"],
    features: [
      "Live voice & video sessions",
      "Cross-border partner calls",
      "Direct pitch & sync rooms",
    ],
    href: "/v-meet",
  },
  {
    id: "v-hub",
    label: "IDENTITY HUB",
    icon: "✣",
    accent: "#79a6ff",
    border: "rgba(121, 166, 255, 0.34)",
    name: "v-hub",
    category: "Workspace",
    tagline: "Build your professional identity.",
    description:
      "Central workspace dashboard to manage profile completion, positioning, and ecosystem activity.",
    keywords: ["hub", "identity", "profil", "dashboard", "workspace", "identitas"],
    features: [
      "Profile & identity overview",
      "Ecosystem activity tracking",
      "Quick module launcher",
    ],
    href: "/v-hub",
  },
  {
    id: "v-business-feed",
    label: "BUSINESS FEED",
    icon: "▤",
    accent: "#8ab4ff",
    border: "rgba(138, 180, 255, 0.34)",
    name: "v-business feed",
    category: "Network & Feed",
    tagline: "Business updates & opportunities.",
    description:
      "Share announcements, product launches, and discussions with businesses and community members.",
    keywords: ["feed", "berita", "pengumuman", "update", "bisnis", "post", "diskusi"],
    features: [
      "Company updates & launches",
      "Threaded discussions & posts",
      "Video & media highlights",
    ],
    href: "/business-feed",
  },
  {
    id: "v-circle",
    label: "NETWORK CIRCLE",
    icon: "👥",
    accent: "#c4b5fd",
    border: "rgba(196, 181, 253, 0.34)",
    name: "v-circle",
    category: "Network & Feed",
    tagline: "Grow your network.",
    description:
      "Discover founders, professionals, and companies to expand trusted business connections.",
    keywords: [
      "circle",
      "network",
      "people",
      "partner",
      "koneksi",
      "jejaring",
      "community",
      "komunitas",
    ],
    features: [
      "Follow profiles & companies",
      "Join circles & discussions",
      "Connection notes & sync",
    ],
    href: "/v-circle",
  },
  {
    id: "v-market",
    label: "MARKETPLACE",
    icon: "🛒",
    accent: "#9ec0ff",
    border: "rgba(158, 192, 255, 0.34)",
    name: "v-market",
    category: "Workspace",
    tagline: "Products & suppliers.",
    description:
      "Explore company products, services, and suppliers, inspect feature photos, and request info.",
    keywords: ["market", "produk", "jasa", "supplier", "katalog", "toko", "commerce"],
    features: [
      "Products & supplier directory",
      "Feature gallery inspection",
      "Direct info requests",
    ],
    href: "/v-market",
  },
];

const CATEGORIES: ModuleCategory[] = [
  "All",
  "Communication",
  "Workspace",
  "Network & Feed",
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  const [query, setQuery] = useState<string>(() => searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] =
    useState<ModuleCategory>("All");
  const [userName, setUserName] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const paramQ = searchParams.get("q");
    if (paramQ !== null && paramQ !== query) {
      setQuery(paramQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserName(null);
      return;
    }

    const displayName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Member";
    setUserName(displayName);
  }

  useEffect(() => {
    let active = true;
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const user = session?.user;
      if (!user) {
        setUserName(null);
      } else {
        const displayName =
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Member";
        setUserName(displayName);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function handleQueryChange(nextValue: string) {
    setQuery(nextValue);
    const trimmed = nextValue.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set("q", nextValue);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  }

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();

    return EXPLORE_MODULES.filter((mod) => {
      if (selectedCategory !== "All" && mod.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;

      return (
        mod.name.toLowerCase().includes(q) ||
        mod.tagline.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q) ||
        mod.keywords.some((kw) => kw.toLowerCase().includes(q)) ||
        mod.features.some((ft) => ft.toLowerCase().includes(q))
      );
    });
  }, [query, selectedCategory]);

  return (
    <main className="explore-page">
      <header className="top-nav">
        <Link href="/" className="brand-logo">
          <span className="brand-logo-mark">
            <img src={BRAND_LOGO_SRC} alt="v-nect logo" />
          </span>
          <span className="brand-text-group">
            <span className="brand-wordmark">
              v<span>-nect</span>
            </span>
            <small className="brand-tagline">GLOBAL BUSINESS ECOSYSTEM</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Explore Navigation">
          <Link href="/">Home</Link>
          <Link href="/explore" className="is-active">
            Explore
          </Link>
          <Link href="/v-circle?tab=discussions">Community</Link>
          <Link href="/v-hub">Business</Link>
          <Link href="/business-feed" className="nav-cta">
            Business Feed →
          </Link>
        </nav>

        <div className="nav-actions">
          {userName ? (
            <span className="user-chip">● {userName}</span>
          ) : (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <section className="explore-hero">
        <div className="explore-hero-inner">
          <span className="eyebrow">ECOSYSTEM DIRECTORY</span>
          <h1>
            Explore the <span>v-nect</span> Platform.
          </h1>
          <p>
            Temukan seluruh modul ekosistem v-nect—mulai dari komunikasi, rapat
            video, ruang kerja bisnis, jejaring &amp; komunitas, hingga
            marketplace produk dan supplier.
          </p>

          <div className="search-box-wrap">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Cari modul atau fitur (misal: chat, meet, hub, market, circle, feed, community)..."
              className="search-input"
              aria-label="Cari modul v-nect"
            />
            {query && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => handleQueryChange("")}
              >
                Reset
              </button>
            )}
          </div>

          <div
            className="filter-pills"
            role="tablist"
            aria-label="Filter Kategori Modul"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selectedCategory === category}
                className={
                  selectedCategory === category
                    ? "filter-pill active"
                    : "filter-pill"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="modules-section">
        <div className="modules-meta">
          <span>
            Menampilkan <strong>{filteredModules.length}</strong> dari{" "}
            <strong>{EXPLORE_MODULES.length}</strong> modul ekosistem
            {query.trim() ? ` untuk "${query.trim()}"` : ""}
          </span>
          <Link href="/" className="back-home-link">
            ← Kembali ke Beranda
          </Link>
        </div>

        {filteredModules.length === 0 ? (
          <div className="empty-state">
            <h3>Modul tidak ditemukan</h3>
            <p>
              Coba kata kunci lain seperti <strong>v-chat</strong>,{" "}
              <strong>v-meet</strong>, <strong>v-hub</strong>,{" "}
              <strong>v-circle</strong>, atau <strong>v-market</strong>.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                handleQueryChange("");
                setSelectedCategory("All");
              }}
            >
              Tampilkan Semua Modul
            </button>
          </div>
        ) : (
          <div className="modules-grid">
            {filteredModules.map((mod) => (
              <article
                key={mod.id}
                className="module-card"
                style={{ borderColor: mod.border }}
              >
                <div className="module-top">
                  <div
                    className="module-icon"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(75, 107, 255, 0.28), rgba(120, 84, 255, 0.28))",
                      borderColor: mod.border,
                    }}
                  >
                    <span>{mod.icon}</span>
                  </div>
                  <span className="module-category">{mod.category}</span>
                </div>

                <span className="module-label" style={{ color: mod.accent }}>
                  {mod.label}
                </span>
                <h2>{mod.name}</h2>
                <p className="module-tagline">{mod.tagline}</p>
                <p className="module-desc">{mod.description}</p>

                <ul className="module-features">
                  {mod.features.map((feat) => (
                    <li key={feat}>✓ {feat}</li>
                  ))}
                </ul>

                <div className="module-actions">
                  <Link href={mod.href} className="module-open-btn">
                    Buka {mod.name} <span>→</span>
                  </Link>
                  {mod.id === "v-circle" && (
                    <Link
                      href="/v-circle?tab=discussions"
                      className="module-sub-link"
                    >
                      Discussions
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          v<span>-nect</span>
        </div>
        <p>Connect Beyond Boundaries.</p>
        <small>© 2026 v-nect. All rights reserved.</small>
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => loadUser()}
      />

      <style jsx>{`
        .explore-page {
          min-height: 100vh;
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
          background:
            radial-gradient(
              circle at 78% 12%,
              rgba(78, 108, 255, 0.32),
              transparent 36%
            ),
            radial-gradient(
              circle at 20% 30%,
              rgba(28, 63, 184, 0.24),
              transparent 42%
            ),
            linear-gradient(180deg, #060b24 0%, #091338 55%, #060b24 100%);
        }

        .top-nav {
          min-height: 72px;
          padding: 10px 6%;
          background: rgba(6, 11, 34, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(138, 165, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .brand-logo {
          color: #ffffff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .brand-logo-mark {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .brand-logo-mark img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .brand-text-group {
          display: inline-flex;
          flex-direction: column;
        }

        .brand-wordmark {
          font-size: 21px;
          font-weight: 850;
          letter-spacing: -0.4px;
          line-height: 1.05;
          color: #ffffff;
        }

        .brand-wordmark span,
        .explore-hero h1 span,
        .footer-brand span {
          color: #8ab4ff;
        }

        .brand-tagline {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #9cb0d9;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-links :global(a) {
          color: #d9e4ff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
        }

        .nav-links :global(a:hover),
        .nav-links :global(a.is-active) {
          color: #ffffff;
          background: rgba(138, 180, 255, 0.14);
        }

        .nav-links :global(a.nav-cta) {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 750;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-chip {
          background: rgba(138, 180, 255, 0.14);
          border: 1px solid rgba(138, 180, 255, 0.35);
          color: #c7dcff;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(154, 178, 255, 0.28);
          color: #eef3ff;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .explore-hero {
          padding: 56px 7% 28px;
        }

        .explore-hero-inner {
          max-width: 820px;
        }

        .eyebrow {
          display: inline-block;
          color: #79a6ff;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 2.6px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .explore-hero h1 {
          margin: 0 0 14px;
          font-size: clamp(34px, 5vw, 54px);
          font-weight: 850;
          line-height: 1.08;
          letter-spacing: -1.4px;
        }

        .explore-hero p {
          margin: 0 0 24px;
          color: #b8c7e6;
          font-size: 15px;
          line-height: 1.7;
          max-width: 660px;
        }

        .search-box-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 25, 58, 0.9);
          border: 1px solid rgba(148, 184, 255, 0.32);
          border-radius: 14px;
          padding: 6px 10px 6px 14px;
          margin-bottom: 16px;
        }

        .search-icon {
          font-size: 15px;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          color: #ffffff;
          font-size: 14px;
          padding: 8px 4px;
          outline: none;
        }

        .clear-btn {
          border: 1px solid rgba(148, 184, 255, 0.28);
          background: rgba(255, 255, 255, 0.06);
          color: #d9e4ff;
          padding: 6px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-pill {
          border: 1px solid rgba(148, 184, 255, 0.24);
          background: rgba(15, 25, 58, 0.8);
          color: #c8d7f5;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .filter-pill.active {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          border-color: transparent;
          color: #ffffff;
        }

        .modules-section {
          padding: 16px 7% 68px;
        }

        .modules-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          font-size: 13px;
          color: #a9b9da;
        }

        .back-home-link {
          color: #9ec0ff;
          text-decoration: none;
          font-weight: 700;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .module-card {
          background: linear-gradient(
            155deg,
            rgba(32, 54, 104, 0.92),
            rgba(14, 25, 56, 0.98)
          );
          border: 1px solid rgba(148, 184, 255, 0.25);
          border-radius: 18px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 12px 28px rgba(3, 8, 24, 0.28);
        }

        .module-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
        }

        .module-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          border: 1px solid;
          display: grid;
          place-items: center;
          font-size: 20px;
        }

        .module-category {
          font-size: 11px;
          font-weight: 700;
          color: #dce7ff;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(148, 184, 255, 0.22);
          padding: 4px 10px;
          border-radius: 999px;
        }

        .module-label {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.4px;
          margin-bottom: 6px;
        }

        .module-card h2 {
          margin: 0 0 4px;
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
        }

        .module-tagline {
          margin: 0 0 8px;
          font-size: 13px;
          font-weight: 650;
          color: #e2ecff;
        }

        .module-desc {
          margin: 0 0 14px;
          font-size: 12.5px;
          line-height: 1.6;
          color: #b4c6e7;
        }

        .module-features {
          list-style: none;
          padding: 0;
          margin: 0 0 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: #d2def7;
          flex: 1;
        }

        .module-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid rgba(160, 192, 240, 0.18);
        }

        .module-open-btn {
          flex: 1;
          text-decoration: none;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          border: 1px solid rgba(176, 200, 255, 0.4);
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          box-shadow: 0 6px 18px rgba(75, 107, 255, 0.35);
          transition: transform 0.18s ease, box-shadow 0.18s ease,
            filter 0.18s ease;
        }

        .module-open-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(120, 84, 255, 0.48);
          filter: brightness(1.06);
        }

        .module-sub-link {
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(92, 124, 255, 0.24);
          border: 1px solid rgba(138, 180, 255, 0.42);
          white-space: nowrap;
        }

        .empty-state {
          background: rgba(15, 25, 58, 0.82);
          border: 1px solid rgba(148, 184, 255, 0.2);
          border-radius: 16px;
          padding: 40px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-state h3 {
          margin: 0;
          font-size: 20px;
        }

        .empty-state p {
          margin: 0;
          color: #b4c6e7;
          font-size: 13.5px;
        }

        .btn-primary {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          border: none;
          padding: 11px 18px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
        }

        .site-footer {
          text-align: center;
          padding: 34px 20px;
          background: #050a20;
          color: #96a8d0;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
        }

        .footer-brand {
          color: #ffffff;
          font-size: 24px;
          font-weight: 850;
        }

        .site-footer p {
          margin: 8px 0 6px;
          font-size: 13.5px;
          color: #d9e4ff;
        }

        .site-footer small {
          font-size: 11.5px;
        }

        @media (max-width: 960px) {
          .modules-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .top-nav {
            flex-wrap: wrap;
            justify-content: center;
          }

          .nav-links {
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px 12px;
          }

          .modules-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "#060b24",
            color: "#f3f7ff",
            padding: "40px",
          }}
        >
          Loading v-nect Explore...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
