"use client";

import Link from "next/link";

export type EcosystemModuleItem = {
  number: string;
  name: string;
  description: string;
  href: string;
};

type EcosystemSectionProps = {
  modules: EcosystemModuleItem[];
  exploreHref?: string;
};

function renderModuleIcon(name: string, index: number) {
  const key = name.toLowerCase();

  if (key.includes("chat") || index === 0) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 11.5C4 7.36 7.58 4 12 4C16.42 4 20 7.36 20 11.5C20 15.64 16.42 19 12 19C10.72 19 9.51 18.72 8.44 18.22L4.5 19.5L5.64 16.08C4.61 14.81 4 13.22 4 11.5Z"
          fill="currentColor"
        />
        <circle cx="9.2" cy="11.5" r="1.25" fill="#1860e6" />
        <circle cx="12" cy="11.5" r="1.25" fill="#1860e6" />
        <circle cx="14.8" cy="11.5" r="1.25" fill="#1860e6" />
      </svg>
    );
  }

  if (key.includes("meet") || index === 1) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="6.5" width="11.5" height="11" rx="2.5" fill="currentColor" />
        <path
          d="M16 10.1L20.2 7.5C20.87 7.09 21.75 7.57 21.75 8.35V15.65C21.75 16.43 20.87 16.91 20.2 16.5L16 13.9V10.1Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (key.includes("hub") || index === 2) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="2.7" fill="currentColor" />
        <circle cx="12" cy="4.8" r="1.8" fill="currentColor" />
        <circle cx="18.3" cy="8.4" r="1.8" fill="currentColor" />
        <circle cx="18.3" cy="15.6" r="1.8" fill="currentColor" />
        <circle cx="12" cy="19.2" r="1.8" fill="currentColor" />
        <circle cx="5.7" cy="15.6" r="1.8" fill="currentColor" />
        <circle cx="5.7" cy="8.4" r="1.8" fill="currentColor" />
        <path
          d="M12 6.6V9.3M16.7 9.3L14.3 10.7M16.7 14.7L14.3 13.3M12 17.4V14.7M7.3 14.7L9.7 13.3M7.3 9.3L9.7 10.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (key.includes("feed") || index === 3) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="3.5" width="14" height="17" rx="2.6" fill="currentColor" />
        <rect x="8" y="7.5" width="5" height="3.2" rx="0.8" fill="#1759df" />
        <path
          d="M8 13.2H16M8 16.2H13.5"
          stroke="#1759df"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (key.includes("circle") || index === 4) {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8.5" r="2.6" fill="currentColor" />
        <circle cx="6.8" cy="10" r="2" fill="currentColor" opacity="0.88" />
        <circle cx="17.2" cy="10" r="2" fill="currentColor" opacity="0.88" />
        <path
          d="M7.6 17.5C7.6 15.1 9.57 13.2 12 13.2C14.43 13.2 16.4 15.1 16.4 17.5"
          fill="currentColor"
        />
        <path
          d="M3.8 17.5C3.8 15.7 5.15 14.3 6.85 14.3C7.45 14.3 8.01 14.47 8.48 14.77"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M20.2 17.5C20.2 15.7 18.85 14.3 17.15 14.3C16.55 14.3 15.99 14.47 15.52 14.77"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.8 5.2H6.2L8.1 14.1C8.26 14.84 8.91 15.37 9.67 15.37H17.3C18.02 15.37 18.65 14.89 18.84 14.19L20.3 8.7H7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.8" cy="18.6" r="1.5" fill="currentColor" />
      <circle cx="17.1" cy="18.6" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function EcosystemSection({
  modules,
  exploreHref = "/business-feed",
}: EcosystemSectionProps) {
  return (
    <section className="platform-section" id="platform">
      <div className="ecosystem-shell">
        <div className="ecosystem-topbar">
          <div className="ecosystem-title">
            <span className="ecosystem-bar" aria-hidden="true" />
            <h2>v-nect Ecosystem</h2>
          </div>

          <Link href={exploreHref} className="ecosystem-link">
            Discover all powerful features in one platform <span>→</span>
          </Link>
        </div>

        <div className="ecosystem-grid">
          {modules.map((module, idx) => (
            <Link
              href={module.href}
              className={`eco-card eco-tone-${idx % 6}`}
              key={module.number}
            >
              <div className="eco-icon-box" aria-hidden="true">
                {renderModuleIcon(module.name, idx)}
              </div>

              <h3>{module.name}</h3>
              <p>{module.description}</p>

              <span className="eco-circle-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .platform-section {
          max-width: 1240px;
          margin: 0 auto;
          padding: 16px 24px 44px;
        }

        .ecosystem-shell {
          background: linear-gradient(
            180deg,
            rgba(12, 23, 64, 0.9) 0%,
            rgba(8, 16, 46, 0.96) 100%
          );
          border: 1px solid rgba(124, 156, 255, 0.28);
          border-radius: 20px;
          padding: 18px 20px 20px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 18px 40px rgba(3, 8, 26, 0.48);
        }

        .ecosystem-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding: 0 2px;
        }

        .ecosystem-title {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .ecosystem-bar {
          width: 3px;
          height: 16px;
          border-radius: 999px;
          background: #4ea8ff;
        }

        .ecosystem-title h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #f4f7ff;
          letter-spacing: -0.2px;
        }

        .ecosystem-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #b7c8f0;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .ecosystem-link:hover {
          color: #ffffff;
        }

        .ecosystem-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .eco-card {
          position: relative;
          background: linear-gradient(
            180deg,
            rgba(23, 40, 95, 0.78) 0%,
            rgba(10, 19, 52, 0.94) 100%
          );
          border: 1px solid rgba(124, 156, 255, 0.2);
          border-radius: 14px;
          padding: 20px 14px 38px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          text-decoration: none;
          color: inherit;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .eco-card:hover {
          transform: translateY(-3px);
          border-color: rgba(138, 180, 255, 0.58);
          box-shadow: 0 12px 26px rgba(10, 22, 66, 0.5);
        }

        .eco-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.26);
        }

        .eco-icon-box :global(svg) {
          width: 24px;
          height: 24px;
        }

        .eco-tone-0 .eco-icon-box {
          background: linear-gradient(145deg, #32a8ff, #1659e8);
          box-shadow: 0 8px 22px rgba(34, 134, 255, 0.45);
        }

        .eco-tone-1 .eco-icon-box {
          background: linear-gradient(145deg, #b05cff, #6834e8);
          box-shadow: 0 8px 22px rgba(145, 72, 255, 0.45);
        }

        .eco-tone-2 .eco-icon-box {
          background: linear-gradient(145deg, #1ed0e8, #1476b8);
          box-shadow: 0 8px 22px rgba(24, 188, 224, 0.42);
        }

        .eco-tone-3 .eco-icon-box {
          background: linear-gradient(145deg, #2d8cff, #1850cf);
          box-shadow: 0 8px 22px rgba(42, 122, 255, 0.42);
        }

        .eco-tone-4 .eco-icon-box {
          background: linear-gradient(145deg, #9f4dff, #5a32df);
          box-shadow: 0 8px 22px rgba(138, 66, 245, 0.45);
        }

        .eco-tone-5 .eco-icon-box {
          background: linear-gradient(145deg, #239be8, #1454b8);
          box-shadow: 0 8px 22px rgba(30, 132, 224, 0.42);
        }

        .eco-card h3 {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
        }

        .eco-card p {
          margin: 0;
          font-size: 11.5px;
          line-height: 1.42;
          color: #9fb2dc;
          max-width: 150px;
        }

        .eco-circle-arrow {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid rgba(154, 180, 245, 0.42);
          color: #b4c6ee;
          font-size: 10px;
          font-weight: 700;
          display: grid;
          place-items: center;
          transition: background 0.2s ease, color 0.2s ease;
        }

        .eco-card:hover .eco-circle-arrow {
          background: rgba(138, 180, 255, 0.2);
          color: #ffffff;
        }

        @media (max-width: 1024px) {
          .ecosystem-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 540px) {
          .platform-section {
            padding: 12px 14px 32px;
          }

          .ecosystem-shell {
            padding: 14px;
            border-radius: 16px;
          }

          .ecosystem-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
      `}</style>
    </section>
  );
}
