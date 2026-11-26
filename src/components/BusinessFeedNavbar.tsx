"use client";

import Link from "next/link";

type BusinessFeedNavbarProps = {
  activePath?: string;
};

export function BusinessFeedNavbar({ activePath = "/business-feed" }: BusinessFeedNavbarProps) {
  return (
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
            href="/business-feed"
            className={activePath === "/business-feed" ? "bf-nav-item active" : "bf-nav-item"}
          >
            Business Feed
          </Link>
          <Link href="/personal" className="bf-nav-item">
            Personal
          </Link>
          <Link href="/company-dashboard" className="bf-nav-item">
            Company Dashboard
          </Link>
        </nav>
      </div>

      <style jsx>{`
        .bf-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          width: 100%;
          background: #07111f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #ffffff;
        }

        .bf-brand-name span {
          color: #13c8b5;
        }

        .bf-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
        }

        .bf-home-btn:hover {
          opacity: 0.92;
        }

        .bf-topbar-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .bf-nav-item {
          padding: 8px 13px;
          border-radius: 8px;
          color: #d6e2f0;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
        }

        .bf-nav-item:hover,
        .bf-nav-item.active {
          color: #ffffff;
          border-color: #13c8b5;
          background: rgba(19, 200, 181, 0.16);
        }
      `}</style>
    </header>
  );
}
