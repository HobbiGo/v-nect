"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type ModuleCategory = "Communication" | "Workspace" | "Network & Feed" | "Commerce";

interface EcosystemModule {
  id: string;
  code: string;
  icon: string;
  tag: string;
  accent: string;
  border: string;
  name: string;
  category: ModuleCategory;
  tagline: string;
  description: string;
  keywords: string[];
  highlights: string[];
  href: string;
}

const BRAND_LOGO_SRC = "/images/V-NECT-logo.png";

const modules: EcosystemModule[] = [
  {
    id: "v-chat",
    code: "01 · CHAT & MESSAGING",
    icon: "💬",
    tag: "CHAT & MESSAGING",
    accent: "#36b9ff",
    border: "rgba(54, 185, 255, 0.34)",
    name: "v-chat",
    category: "Communication",
    tagline: "Connect and communicate.",
    description:
      "Direct and group messaging panel for partners, teams, and suppliers across time zones.",
    keywords: ["chat", "message", "dm", "inbox", "komunikasi", "pesan"],
    highlights: [
      "Real-time direct threads",
      "Share product & deal links",
      "Instant notifications",
    ],
    href: "/business-feed",
  },
  {
    id: "v-meet",
    code: "02 · LIVE MEETINGS",
    icon: "🎥",
    tag: "LIVE MEETINGS",
    accent: "#bd78ff",
    border: "rgba(189, 120, 255, 0.34)",
    name: "v-meet",
    category: "Communication",
    tagline: "Voice & video meetings.",
    description:
      "Host pitches, partner alignment calls, and cross-border discussions without leaving the ecosystem.",
    keywords: ["meet", "video", "call", "voice", "rapat", "pitching", "conference"],
    highlights: [
      "HD voice & video rooms",
      "Quick workspace invites",
      "Meeting notes ready",
    ],
    href: "/v-meet",
  },
  {
    id: "v-hub",
    code: "03 · IDENTITY HUB",
    icon: "✣",
    tag: "IDENTITY HUB",
    accent: "#32dce9",
    border: "rgba(50, 220, 233, 0.34)",
    name: "v-hub",
    category: "Workspace",
    tagline: "Build your professional identity.",
    description:
      "Central workspace dashboard to manage profile completion, hub positioning, and recent activity.",
    keywords: ["hub", "profile", "workspace", "dashboard", "identity", "profil"],
    highlights: [
      "Personal & company identity",
      "Profile progress tracking",
      "Quick module shortcuts",
    ],
    href: "/v-hub",
  },
  {
    id: "v-business-feed",
    code: "04 · BUSINESS FEED",
    icon: "▤",
    tag: "BUSINESS FEED",
    accent: "#559fff",
    border: "rgba(85, 159, 255, 0.34)",
    name: "v-business feed",
    category: "Network & Feed",
    tagline: "Business updates & opportunities.",
    description:
      "Publish company announcements, product launches, and partnership opportunities to the network.",
    keywords: ["feed", "post", "news", "updates", "launch", "announcement", "peluang"],
    highlights: [
      "Launch & promo updates",
      "Community discussions",
      "Direct lead engagement",
    ],
    href: "/business-feed",
  },
  {
    id: "v-circle",
    code: "05 · NETWORK CIRCLE",
    icon: "👥",
    tag: "NETWORK CIRCLE",
    accent: "#f472b6",
    border: "rgba(244, 114, 182, 0.34)",
    name: "v-circle",
    category: "Network & Feed",
    tagline: "Grow your network.",
    description:
      "Discover founders, decision-makers, and regional collaborators to build trusted business circles.",
    keywords: ["circle", "network", "people", "founder", "partner", "koneksi", "jejaring"],
    highlights: [
      "Follow profiles & companies",
      "Partner discovery",
      "Direct circle connections",
    ],
    href: "/v-circle",
  },
  {
    id: "v-market",
    code: "06 · MARKETPLACE",
    icon: "🛒",
    tag: "MARKETPLACE",
    accent: "#fbbf24",
    border: "rgba(251, 191, 36, 0.34)",
    name: "v-market",
    category: "Commerce",
    tagline: "Products & suppliers.",
    description:
      "Browse company products, services, and verified suppliers, inspect feature photos, and request info.",
    keywords: ["market", "marketplace", "product", "service", "supplier", "produk", "quote"],
    highlights: [
      "Products, services & suppliers",
      "Feature photo preview",
      "Request Info & chat",
    ],
    href: "/v-market",
  },
];

const categories = [
  "All",
  "Workspace",
  "Communication",
  "Network & Feed",
  "Commerce",
] as const;

function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedModule, setSelectedModule] = useState<EcosystemModule | null>(null);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore", { scroll: false });
  };

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return modules.filter((mod) => {
      const matchesCategory =
        selectedCategory === "All" || mod.category === selectedCategory;

      if (!query) return matchesCategory;

      const matchesText =
        mod.name.toLowerCase().includes(query) ||
        mod.tagline.toLowerCase().includes(query) ||
        mod.description.toLowerCase().includes(query) ||
        mod.tag.toLowerCase().includes(query) ||
        mod.keywords.some((kw) => kw.includes(query));

      return matchesCategory && matchesText;
    });
  }, [searchQuery, selectedCategory]);

  const handleReset = () => {
    handleSearchChange("");
    setSelectedCategory("All");
  };

  return (
    <main className="explore-page">
      {/* Top Navbar */}
      <header className="navbar">
        <Link className="logo" href="/">
          <span className="logo-mark-wrap">
            <img src={BRAND_LOGO_SRC} alt="v-nect logo" className="logo-mark" />
          </span>
          <span className="logo-text-wrap">
            <span className="logo-main">
              v<span>-nect</span>
            </span>
            <small>GLOBAL BUSINESS ECOSYSTEM</small>
          </span>
        </Link>

        <nav>
          <Link href="/">Home</Link>
          <Link href="/explore" className="active-link">
            Explore
          </Link>
          <Link href="/v-circle">Community</Link>
          <Link href="/v-hub">Business</Link>
          <Link className="nav-button" href="/business-feed">
            Business Feed →
          </Link>
        </nav>

        <div className="nav-right-actions">
          <Link href="/v-hub" className="nav-ghost-btn">
            Open v-hub
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <section className="explore-container">
        {/* Hero Search Card */}
        <div className="explore-hero-box">
          <span className="explore-eyebrow">THE V-NECT PLATFORM · EXPLORE</span>
          <h1>Discover Every Module in One Ecosystem.</h1>
          <p>
            Search and jump directly into any v-nect tool — from live meetings and
            workspace identity to B2B marketplace and business feeds.
          </p>

          <div className="search-bar-wrap">
            <span className="search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search modules (e.g. v-market, supplier, video meeting, feed, circle)..."
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="filter-bar">
          <div className="category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "pill active" : "pill"}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="result-count">
            Showing <strong>{filteredModules.length}</strong> of {modules.length} modules
          </span>
        </div>

        {/* Module Cards Grid */}
        {filteredModules.length > 0 ? (
          <div className="ecosystem-grid">
            {filteredModules.map((mod, idx) => (
              <article
                key={mod.id}
                className={`eco-card eco-tone-${idx % 6}`}
                style={{ borderColor: mod.border }}
              >
                <div className="eco-card-top">
                  <div className="eco-icon-box" aria-hidden="true">
                    {mod.icon}
                  </div>
                  <button
                    type="button"
                    className="quick-info-btn"
                    onClick={() => setSelectedModule(mod)}
                  >
                    Quick info
                  </button>
                </div>

                <div className="eco-card-content">
                  <span className="eco-module-tag" style={{ color: mod.accent }}>
                    {mod.tag}
                  </span>
                  <h3>{mod.name}</h3>
                  <p className="eco-tagline">{mod.tagline}</p>
                  <p className="eco-desc">{mod.description}</p>
                </div>

                <div className="eco-card-bottom">
                  <Link href={mod.href} className="explore-module-link">
                    Explore module <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No modules found for &ldquo;{searchQuery}&rdquo;</h3>
            <p>
              Try searching with another keyword such as <strong>market</strong>,{" "}
              <strong>meet</strong>, <strong>hub</strong>, or <strong>circle</strong>.
            </p>
            <button type="button" className="reset-btn" onClick={handleReset}>
              Reset Search &amp; Filters
            </button>
          </div>
        )}
      </section>

      {/* Quick Preview Modal */}
      {selectedModule && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedModule(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <span
                className="eco-module-tag"
                style={{ color: selectedModule.accent }}
              >
                {selectedModule.code}
              </span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedModule(null)}
              >
                ✕
              </button>
            </div>

            <h2>{selectedModule.name}</h2>
            <p className="modal-desc">{selectedModule.description}</p>

            <div className="modal-highlights">
              <h4>KEY CAPABILITIES</h4>
              <ul>
                {selectedModule.highlights.map((item) => (
                  <li key={item}>✦ {item}</li>
                ))}
              </ul>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="nav-ghost-btn"
                onClick={() => setSelectedModule(null)}
              >
                Close
              </button>
              <Link href={selectedModule.href} className="nav-button">
                Open {selectedModule.name} →
              </Link>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-logo">
          v<span>-nect</span>
        </div>
        <p>Connect Beyond Boundaries.</p>
        <small>© 2026 v-nect. All rights reserved.</small>
      </footer>

      <style jsx>{`
        .explore-page {
          min-height: 100vh;
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
          background:
            radial-gradient(circle at 78% 12%, rgba(78, 108, 255, 0.28), transparent 36%),
            radial-gradient(circle at 18% 30%, rgba(28, 63, 184, 0.22), transparent 42%),
            linear-gradient(180deg, #060b24 0%, #091338 55%, #060b24 100%);
        }

        .navbar {
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

        .logo {
          color: #fff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .logo-mark-wrap {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .logo-mark {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .logo-text-wrap {
          display: inline-flex;
          flex-direction: column;
        }

        .logo-main {
          font-size: 21px;
          font-weight: 850;
          line-height: 1.05;
        }

        .logo-main span,
        .footer-logo span {
          color: #8ab4ff;
        }

        .logo small {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #9cb0d9;
          margin-top: 4px;
        }

        .navbar nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .navbar nav :global(a) {
          color: #d9e4ff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .navbar nav :global(a:hover),
        .navbar nav :global(a.active-link) {
          color: #7dd3fc;
        }

        :global(.nav-button) {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #fff !important;
          padding: 10px 16px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 7px 20px rgba(75, 107, 255, 0.25);
        }

        :global(.nav-ghost-btn) {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(154, 178, 255, 0.28);
          color: #eef3ff;
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        :global(.nav-ghost-btn:hover) {
          border-color: #8ab4ff;
          background: rgba(138, 180, 255, 0.14);
        }

        .explore-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 36px 24px 70px;
        }

        .explore-hero-box {
          padding: 36px;
          border-radius: 24px;
          border: 1px solid rgba(130, 184, 255, 0.24);
          background:
            radial-gradient(circle at 10% 0%, rgba(56, 189, 248, 0.2), transparent 45%),
            linear-gradient(150deg, #1a2f63 0%, #12224a 55%, #0e1a3a 100%);
          box-shadow: 0 20px 50px rgba(2, 8, 26, 0.42);
          margin-bottom: 28px;
        }

        .explore-eyebrow {
          display: inline-block;
          color: #7dd3fc;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.4px;
          margin-bottom: 10px;
        }

        .explore-hero-box h1 {
          margin: 0 0 10px;
          font-size: clamp(26px, 3.6vw, 40px);
          font-weight: 850;
          letter-spacing: -0.8px;
          background: linear-gradient(105deg, #ffffff 0%, #93c5fd 55%, #67e8f9 100%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .explore-hero-box p {
          margin: 0 0 24px;
          max-width: 640px;
          color: #c2d3f0;
          font-size: 14px;
          line-height: 1.7;
        }

        .search-bar-wrap {
          position: relative;
          max-width: 680px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          font-size: 15px;
          pointer-events: none;
        }

        .search-bar-wrap input {
          width: 100%;
          padding: 14px 44px;
          border-radius: 13px;
          border: 1px solid rgba(138, 165, 255, 0.34);
          background: rgba(6, 11, 34, 0.85);
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-bar-wrap input::placeholder {
          color: #8fa4cf;
        }

        .search-bar-wrap input:focus {
          border-color: #67e8f9;
          box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.16);
        }

        .clear-search-btn {
          position: absolute;
          right: 14px;
          background: transparent;
          border: none;
          color: #9cb0d9;
          font-size: 14px;
          cursor: pointer;
          padding: 4px 6px;
        }

        .clear-search-btn:hover {
          color: #fff;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .category-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pill {
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid rgba(148, 184, 255, 0.24);
          background: rgba(18, 33, 68, 0.75);
          color: #c7d6f4;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pill:hover {
          border-color: rgba(125, 211, 252, 0.6);
          color: #fff;
        }

        .pill.active {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 6px 18px rgba(75, 107, 255, 0.32);
        }

        .result-count {
          font-size: 12px;
          color: #9cb0d9;
        }

        .result-count strong {
          color: #fff;
        }

        .ecosystem-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .eco-card {
          min-height: 235px;
          display: flex;
          flex-direction: column;
          padding: 22px;
          border: 1px solid rgba(148, 184, 255, 0.26);
          border-radius: 18px;
          background: linear-gradient(
            155deg,
            rgba(38, 66, 122, 0.92),
            rgba(18, 33, 68, 0.98)
          );
          box-shadow: 0 12px 26px rgba(2, 8, 24, 0.3);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .eco-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 36px rgba(2, 8, 24, 0.45);
        }

        .eco-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .eco-icon-box {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #ffffff;
          font-size: 22px;
          border: 1px solid rgba(255, 255, 255, 0.28);
        }

        .eco-tone-0 .eco-icon-box {
          background: linear-gradient(145deg, #36b9ff, #1763e9);
        }
        .eco-tone-1 .eco-icon-box {
          background: linear-gradient(145deg, #bd78ff, #7041e9);
        }
        .eco-tone-2 .eco-icon-box {
          background: linear-gradient(145deg, #32dce9, #137dbd);
        }
        .eco-tone-3 .eco-icon-box {
          background: linear-gradient(145deg, #559fff, #2458d8);
        }
        .eco-tone-4 .eco-icon-box {
          background: linear-gradient(145deg, #f472b6, #9d174d);
        }
        .eco-tone-5 .eco-icon-box {
          background: linear-gradient(145deg, #fbbf24, #b45309);
        }

        .quick-info-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(148, 184, 255, 0.25);
          color: #c2d2ec;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .quick-info-btn:hover {
          color: #fff;
          border-color: #7dd3fc;
        }

        .eco-card-content {
          flex: 1;
        }

        .eco-module-tag {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.4px;
          margin-bottom: 6px;
        }

        .eco-card h3 {
          margin: 0 0 4px;
          color: #ffffff;
          font-size: 20px;
          font-weight: 800;
        }

        .eco-tagline {
          margin: 0 0 8px;
          color: #e2ecff;
          font-size: 13px;
          font-weight: 650;
        }

        .eco-desc {
          margin: 0;
          color: #b4c6e7;
          font-size: 12.5px;
          line-height: 1.6;
        }

        .eco-card-bottom {
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px solid rgba(160, 192, 240, 0.16);
        }

        :global(.explore-module-link) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
        }

        :global(.explore-module-link:hover) {
          text-decoration: underline;
        }

        .empty-state {
          padding: 48px 24px;
          text-align: center;
          border-radius: 20px;
          border: 1px solid rgba(148, 184, 255, 0.2);
          background: rgba(18, 33, 68, 0.7);
        }

        .empty-state h3 {
          margin: 0 0 8px;
          font-size: 19px;
          color: #fff;
        }

        .empty-state p {
          margin: 0 0 20px;
          font-size: 13px;
          color: #b4c6e7;
        }

        .reset-btn {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(3, 7, 22, 0.78);
          backdrop-filter: blur(6px);
          display: grid;
          place-items: center;
          padding: 20px;
        }

        .modal-card {
          width: 100%;
          max-width: 480px;
          background: linear-gradient(160deg, #162854, #0d1836);
          border: 1px solid rgba(125, 211, 252, 0.35);
          border-radius: 20px;
          padding: 26px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
        }

        .modal-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: #9cb0d9;
          font-size: 16px;
          cursor: pointer;
        }

        .modal-card h2 {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 850;
          color: #fff;
        }

        .modal-desc {
          margin: 0 0 18px;
          font-size: 13px;
          line-height: 1.65;
          color: #c5d5f2;
        }

        .modal-highlights {
          background: rgba(6, 11, 34, 0.75);
          border: 1px solid rgba(148, 184, 255, 0.18);
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }

        .modal-highlights h4 {
          margin: 0 0 10px;
          font-size: 10px;
          letter-spacing: 1.6px;
          color: #7dd3fc;
        }

        .modal-highlights ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 13px;
          color: #e6eeff;
        }

        .modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .footer {
          text-align: center;
          padding: 30px 20px;
          background: #050a20;
          color: #96a8d0;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
        }

        .footer-logo {
          color: #fff;
          font-size: 23px;
          font-weight: 850;
        }

        .footer p {
          margin: 7px 0 5px;
          font-size: 13px;
          color: #d9e4ff;
        }

        .footer small {
          font-size: 11px;
        }

        @media (max-width: 900px) {
          .navbar {
            flex-wrap: wrap;
            justify-content: center;
          }

          .ecosystem-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 540px) {
          .explore-hero-box {
            padding: 24px 18px;
          }

          .ecosystem-grid {
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
          Loading Explore...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
