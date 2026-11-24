
"use client";

import { useState } from "react";
import Link from "next/link";

const modules = [
  {
    number: "01",
    name: "VOIN Chat",
    description: "Connect and communicate with people and businesses.",
    icon: "✉",
  },
  {
    number: "02",
    name: "VOIN Connect",
    description: "Voice, video meetings and global collaboration.",
    icon: "◎",
  },
  {
    number: "03",
    name: "VOIN Business",
    description: "Build your professional and company identity.",
    icon: "▣",
  },
  {
    number: "04",
    name: "Business Feed",
    description: "Discover business news, updates and opportunities.",
    icon: "◫",
  },
  {
    number: "05",
    name: "VOIN Community",
    description: "Meet professionals and grow your network.",
    icon: "◉",
  },
  {
    number: "06",
    name: "VOIN Marketplace",
    description: "Explore products, services and suppliers.",
    icon: "◇",
  },
];

export default function DashboardPage() {
  const [activeProfile, setActiveProfile] = useState("Personal");

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link href="/" className="dashboard-logo">
          VOIN<span>NECT</span>
        </Link>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          <a className="nav-active" href="#overview">▦ Overview</a>
          <a href="#modules">◇ Applications</a>
          <a href="#profile">◎ My Profiles</a>
          <a href="#activity">◷ Activity</a>
        </nav>

        <div className="sidebar-label">ECOSYSTEM</div>

        <nav className="dashboard-nav">
          <a href="#modules">✉ VOIN Chat</a>
          <a href="#modules">◎ VOIN Connect</a>
          <a href="#modules">▣ VOIN Business</a>
          <a href="#modules">◫ Business Feed</a>
          <a href="#modules">◉ Community</a>
          <a href="#modules">◇ Marketplace</a>
        </nav>

        <div className="sidebar-bottom">
          <a href="#settings">⚙ Settings</a>
          <Link href="/login">↪ Sign Out</Link>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-eyebrow">VOINNECT ECOSYSTEM</span>
            <h1>Dashboard</h1>
          </div>

          <div className="dashboard-user">
            <div className="user-avatar">U</div>
            <div>
              <strong>Welcome User</strong>
              <span>{activeProfile} Profile</span>
            </div>
          </div>
        </header>

        <section className="dashboard-welcome" id="overview">
          <div>
            <span className="dashboard-eyebrow">YOUR DIGITAL ECOSYSTEM</span>
            <h2>Welcome to VOINNECT.</h2>
            <p>
              One account. Multiple profiles. One ecosystem.
              Everything you need to connect, communicate and grow.
            </p>
          </div>
          <div className="welcome-orbit">V</div>
        </section>

        <section className="profile-switcher" id="profile">
          <div>
            <span className="dashboard-eyebrow">ACTIVE PROFILE</span>
            <h3>Choose your workspace</h3>
          </div>

          <div className="profile-switch-buttons">
            <button
              className={activeProfile === "Personal" ? "selected" : ""}
              onClick={() => setActiveProfile("Personal")}
            >
              ◎ Personal
            </button>

            <button
              className={activeProfile === "Company" ? "selected" : ""}
              onClick={() => setActiveProfile("Company")}
            >
              ▣ Company
            </button>
          </div>
        </section>

        <section className="dashboard-section" id="modules">
          <div className="section-heading">
            <div>
              <span className="dashboard-eyebrow">YOUR APPLICATIONS</span>
              <h2>Explore VOINNECT</h2>
            </div>
            <span className="module-count">06 MODULES</span>
          </div>

          <div className="module-grid">
            {modules.map((module) => (
              <article className="module-card" key={module.number}>
                <div className="module-card-top">
                  <span className="module-icon">{module.icon}</span>
                  <span className="module-number">{module.number}</span>
                </div>

                <h3>{module.name}</h3>
                <p>{module.description}</p>

                <span className="module-coming-soon">
                  COMING SOON
                </span>
              </article>
            ))}
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>© 2026 VOINNECT</span>
          <span>Connect Beyond Boundaries.</span>
        </footer>
      </section>
    </main>
  );
}
