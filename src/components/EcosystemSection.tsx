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
                <span>{module.number}</span>
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
            rgba(13, 25, 66, 0.88) 0%,
            rgba(9, 17, 48, 0.95) 100%
          );
          border: 1px solid rgba(124, 156, 255, 0.24);
          border-radius: 20px;
          padding: 18px 20px 20px;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 18px 40px rgba(3, 8, 26, 0.45);
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
            rgba(24, 41, 96, 0.72) 0%,
            rgba(11, 21, 56, 0.92) 100%
          );
          border: 1px solid rgba(124, 156, 255, 0.18);
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
          border-color: rgba(138, 180, 255, 0.55);
          box-shadow: 0 10px 24px rgba(10, 22, 66, 0.45);
        }

        .eco-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 800;
          color: #ffffff;
          box-shadow: 0 8px 18px rgba(49, 108, 255, 0.35);
        }

        .eco-tone-0 .eco-icon-box,
        .eco-tone-3 .eco-icon-box,
        .eco-tone-5 .eco-icon-box {
          background: linear-gradient(135deg, #2484ff, #1652d8);
        }

        .eco-tone-1 .eco-icon-box,
        .eco-tone-4 .eco-icon-box {
          background: linear-gradient(135deg, #9b4dff, #5c32e6);
        }

        .eco-tone-2 .eco-icon-box {
          background: linear-gradient(135deg, #12b5e5, #1e62d0);
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
          border: 1px solid rgba(154, 180, 245, 0.38);
          color: #a9bce6;
          font-size: 10px;
          font-weight: 700;
          display: grid;
          place-items: center;
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
