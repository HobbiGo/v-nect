
"use client";

import { useState } from "react";
import Link from "next/link";

const modules = [
  {
    number: "01",
    icon: "✉",
    name: "VOIN Chat",
    description: "Connect and communicate with people and businesses.",
    category: "COMMUNICATION",
  },
  {
    number: "02",
    icon: "◎",
    name: "VOIN Connect",
    description: "Voice, video meetings and global collaboration.",
    category: "COLLABORATION",
  },
  {
    number: "03",
    icon: "▣",
    name: "VOIN Business",
    description: "Build your professional and company identity.",
    category: "BUSINESS",
  },
  {
    number: "04",
    icon: "◫",
    name: "Business Feed",
    description: "Discover business news, updates and opportunities.",
    category: "DISCOVERY",
  },
  {
    number: "05",
    icon: "◉",
    name: "VOIN Community",
    description: "Meet professionals and grow your network.",
    category: "NETWORKING",
  },
  {
    number: "06",
    icon: "◇",
    name: "VOIN Marketplace",
    description: "Explore products, services and global suppliers.",
    category: "MARKETPLACE",
  },
];

export default function DashboardPage() {
  const [profile, setProfile] = useState("Personal");
  const [active, setActive] = useState("Overview");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigation = [
    { name: "Overview", icon: "▦", id: "overview" },
    { name: "Applications", icon: "◇", id: "applications" },
    { name: "My Profiles", icon: "◎", id: "profiles" },
    { name: "Activity", icon: "◷", id: "activity" },
  ];

  return (
    <main className="vn-dashboard">
      <style>{`
        * { box-sizing: border-box; }

        .vn-dashboard {
          min-height: 100vh;
          background: #f4f7fc;
          color: #17243c;
          font-family: Arial, Helvetica, sans-serif;
        }

        .vn-layout {
          display: flex;
          min-height: 100vh;
        }

        .vn-sidebar {
          width: 255px;
          flex-shrink: 0;
          background: #101d35;
          color: white;
          padding: 28px 18px;
          display: flex;
          flex-direction: column;
        }

        .vn-brand {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: 2px;
          padding: 5px 12px 35px;
        }

        .vn-brand span { color: #55a4ff; }

        .vn-side-label {
          color: #8291aa;
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: 700;
          margin: 20px 12px 12px;
        }

        .vn-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          margin: 3px 0;
          color: #aab7ca;
          text-decoration: none;
          border-radius: 9px;
          font-size: 13px;
          cursor: pointer;
          border: 0;
          background: transparent;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .vn-nav:hover, .vn-nav.active {
          background: #20395e;
          color: white;
        }

        .vn-nav.active {
          border-left: 3px solid #55a4ff;
        }

        .vn-nav-icon {
          font-size: 17px;
          width: 22px;
          text-align: center;
        }

        .vn-sidebar-bottom {
          margin-top: auto;
          padding-top: 25px;
          border-top: 1px solid #293750;
        }

        .vn-main {
          min-width: 0;
          flex: 1;
          padding: 28px 38px 45px;
        }

        .vn-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 35px;
        }

        .vn-mobile-brand {
          display: none;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .vn-top-right {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-left: auto;
        }

        .vn-search {
          border: 1px solid #e0e6f0;
          background: white;
          padding: 11px 15px;
          border-radius: 9px;
          color: #7c899f;
          font-size: 12px;
          width: 210px;
        }

        .vn-user {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .vn-avatar {
          width: 38px;
          height: 38px;
          background: #dceaff;
          color: #2465b5;
          display: grid;
          place-items: center;
          border-radius: 50%;
          font-weight: 800;
          font-size: 15px;
        }

        .vn-eyebrow {
          color: #4988d8;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }

        .vn-heading {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -1px;
          margin: 0 0 8px;
          color: #15233d;
        }

        .vn-subtitle {
          color: #7b879a;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .vn-hero {
          background: linear-gradient(115deg, #142849, #245a9d);
          border-radius: 17px;
          padding: 34px;
          color: white;
          margin: 27px 0 25px;
          position: relative;
          overflow: hidden;
        }

        .vn-hero::after {
          content: "V";
          position: absolute;
          right: 35px;
          top: -45px;
          font-size: 220px;
          line-height: 1;
          font-weight: 900;
          color: rgba(255,255,255,.055);
        }

        .vn-hero-label {
          font-size: 10px;
          letter-spacing: 2px;
          color: #b7d6ff;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .vn-hero h2 {
          font-size: 27px;
          margin: 0 0 12px;
          position: relative;
          z-index: 1;
        }

        .vn-hero p {
          color: #d0def0;
          font-size: 13px;
          line-height: 1.8;
          max-width: 570px;
          margin: 0;
          position: relative;
          z-index: 1;
        }

        .vn-profile-panel {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 13px;
          padding: 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          margin-bottom: 35px;
        }

        .vn-profile-title {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .vn-profile-description {
          font-size: 11px;
          color: #8490a3;
        }

        .vn-switcher {
          display: flex;
          padding: 4px;
          border-radius: 9px;
          background: #f0f3f8;
          gap: 4px;
        }

        .vn-switcher button {
          border: 0;
          border-radius: 7px;
          padding: 10px 17px;
          font-size: 12px;
          font-weight: 700;
          color: #77849a;
          background: transparent;
          cursor: pointer;
        }

        .vn-switcher button.selected {
          background: #2469b9;
          color: white;
          box-shadow: 0 3px 8px #2469b933;
        }

        .vn-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .vn-section-head h2 {
          font-size: 21px;
          margin: 0;
          font-weight: 800;
        }

        .vn-count {
          font-size: 10px;
          letter-spacing: 1px;
          color: #71819a;
          font-weight: 700;
        }

        .vn-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .vn-module {
          background: white;
          border: 1px solid #e8edf5;
          border-radius: 13px;
          padding: 22px;
          min-height: 205px;
          transition: .2s ease;
        }

        .vn-module:hover {
          transform: translateY(-3px);
          border-color: #b6d4f6;
          box-shadow: 0 10px 25px #243d5b0d;
        }

        .vn-module-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .vn-module-icon {
          width: 43px;
          height: 43px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: #eaf3ff;
          color: #286fbe;
          font-size: 21px;
        }

        .vn-module-number {
          color: #a3aec0;
          font-size: 11px;
          font-weight: 700;
        }

        .vn-module h3 {
          font-size: 15px;
          margin: 0 0 9px;
          font-weight: 800;
        }

        .vn-module p {
          font-size: 11px;
          color: #8490a2;
          line-height: 1.7;
          min-height: 38px;
          margin: 0 0 17px;
        }

        .vn-coming {
          display: inline-block;
          background: #f0f4fa;
          color: #6380a4;
          border-radius: 5px;
          padding: 6px 9px;
          font-size: 9px;
          letter-spacing: 1px;
          font-weight: 800;
        }

        .vn-footer {
          text-align: center;
          color: #98a3b3;
          font-size: 10px;
          margin-top: 45px;
          padding-top: 22px;
          border-top: 1px solid #e6ebf2;
        }

        .vn-mobile-menu {
          display: none;
          border: 1px solid #e0e6f0;
          background: white;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 18px;
          cursor: pointer;
        }

        @media (max-width: 1050px) {
          .vn-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .vn-main { padding: 25px; }
        }

        @media (max-width: 700px) {
          .vn-layout { display: block; }
          .vn-sidebar {
            display: ${menuOpen ? "flex" : "none"};
            width: 100%;
            min-height: auto;
            padding: 20px;
          }
          .vn-sidebar-bottom { margin-top: 20px; }
          .vn-mobile-brand { display: block; }
          .vn-mobile-menu { display: block; }
          .vn-main { padding: 20px 16px 35px; }
          .vn-topbar { margin-bottom: 27px; }
          .vn-search { display: none; }
          .vn-user-name { display: none; }
          .vn-heading { font-size: 27px; }
          .vn-hero { padding: 25px 22px; }
          .vn-hero h2 { font-size: 23px; }
          .vn-hero::after { right: 5px; font-size: 150px; }
          .vn-profile-panel {
            align-items: flex-start;
            flex-direction: column;
          }
          .vn-switcher { width: 100%; }
          .vn-switcher button { flex: 1; }
          .vn-grid { grid-template-columns: 1fr; }
          .vn-module { min-height: 185px; }
        }
      `}</style>

      <div className="vn-layout">
        <aside className="vn-sidebar">
          <div className="vn-brand">
            VOIN<span>NECT</span>
          </div>

          <div className="vn-side-label">WORKSPACE</div>

          {navigation.map((item) => (
            <button
              key={item.name}
              className={`vn-nav ${active === item.name ? "active" : ""}`}
              onClick={() => {
                setActive(item.name);
                setMenuOpen(false);
              }}
            >
              <span className="vn-nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}

          <div className="vn-side-label">ECOSYSTEM</div>

          {modules.map((item) => (
            <button
              key={item.name}
              className="vn-nav"
              onClick={() => {
                setActive(item.name);
                setMenuOpen(false);
                document.getElementById("applications")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <span className="vn-nav-icon">{item.icon}</span>
              {item.name}
            </button>
          ))}

          <div className="vn-sidebar-bottom">
            <button className="vn-nav" onClick={() => setActive("Settings")}>
              <span className="vn-nav-icon">⚙</span>
              Settings
            </button>

            <Link href="/login" className="vn-nav">
              <span className="vn-nav-icon">↪</span>
              Sign Out
            </Link>
          </div>
        </aside>

        <section className="vn-main">
          <header className="vn-topbar">
            <button
              className="vn-mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div className="vn-mobile-brand">
              VOIN<span style={{ color: "#438ce0" }}>NECT</span>
            </div>

            <div className="vn-top-right">
              <div className="vn-search">⌕ Search workspace...</div>
              <div className="vn-user">
                <div className="vn-avatar">U</div>
                <div className="vn-user-name">
                  Welcome User
                  <div style={{ color: "#8a96a9", fontWeight: 400, marginTop: 4 }}>
                    {profile} Profile
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div id="overview">
            <div className="vn-eyebrow">VOINNECT ECOSYSTEM</div>
            <h1 className="vn-heading">Dashboard</h1>
            <p className="vn-subtitle">
              Your connected workspace. Everything starts here.
            </p>
          </div>

          <div className="vn-hero">
            <div className="vn-hero-label">YOUR DIGITAL ECOSYSTEM</div>
            <h2>Welcome to VOINNECT.</h2>
            <p>
              One account. Multiple profiles. One ecosystem.
              Everything you need to connect, communicate and grow
              in a connected business world.
            </p>
          </div>

          <div className="vn-profile-panel" id="profiles">
            <div>
              <div className="vn-eyebrow">ACTIVE PROFILE</div>
              <div className="vn-profile-title">Choose your workspace</div>
              <div className="vn-profile-description">
                Switch between your personal and company identity.
              </div>
            </div>

            <div className="vn-switcher">
              <button
                className={profile === "Personal" ? "selected" : ""}
                onClick={() => setProfile("Personal")}
              >
                ◎ Personal
              </button>
              <button
                className={profile === "Company" ? "selected" : ""}
                onClick={() => setProfile("Company")}
              >
                ▣ Company
              </button>
            </div>
          </div>

          <div id="applications">
            <div className="vn-section-head">
              <div>
                <div className="vn-eyebrow">YOUR APPLICATIONS</div>
                <h2>Explore VOINNECT</h2>
              </div>
              <div className="vn-count">06 MODULES</div>
            </div>

            <div className="vn-grid">
              {modules.map((item) => (
                <article className="vn-module" key={item.number}>
                  <div className="vn-module-top">
                    <div className="vn-module-icon">{item.icon}</div>
                    <div className="vn-module-number">{item.number}</div>
                  </div>

                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <span className="vn-coming">COMING SOON</span>
                </article>
              ))}
            </div>
          </div>

          <div id="activity" className="vn-footer">
            © 2026 VOINNECT. All rights reserved.
            <br />
            Connect Beyond Boundaries.
          </div>
        </section>
      </div>
    </main>
  );
}
