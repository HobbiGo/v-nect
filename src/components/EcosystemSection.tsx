
"use client";

import Link from "next/link";

export type EcosystemModuleItem = {
  number: string;
  icon: string;
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

        {/* HEADER */}
        <div className="ecosystem-topbar">
          <div className="ecosystem-heading">
            <span className="ecosystem-eyebrow">
              THE V-NECT PLATFORM
            </span>

            <div className="ecosystem-title">
              <span
                className="ecosystem-bar"
                aria-hidden="true"
              />
              <h2>One Ecosystem. Every Connection.</h2>
            </div>

            <p className="ecosystem-subtitle">
              Everything you need to communicate, collaborate,
              build communities, and grow your business — all
              connected in one platform.
            </p>
          </div>

          <Link
            href={exploreHref}
            className="ecosystem-link"
          >
            Explore the ecosystem
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {/* ECOSYSTEM MODULES */}
        <div className="ecosystem-grid">
          {modules.map((module, idx) => (
            <Link
              href={module.href}
              className={`eco-card eco-tone-${idx % 6}`}
              key={module.number}
            >
              <div className="eco-card-top">
                <div
                  className="eco-icon-box"
                  aria-hidden="true"
                >
                  {module.icon}
                </div>

                <span className="eco-number">
                  {module.number}
                </span>
              </div>

              <div className="eco-card-content">
                <h3>{module.name}</h3>
                <p>{module.description}</p>
              </div>

              <div className="eco-card-bottom">
                <span>Explore module</span>

                <span
                  className="eco-circle-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* FOOTER */}
        <div className="ecosystem-footer">
          <span className="ecosystem-footer-dot" />
          <span>
            ONE PLATFORM. CONNECTED POSSIBILITIES.
          </span>
        </div>

      </div>

      {/* COMPONENT STYLES */}
      <style jsx>{`
        .platform-section {
          max-width: 1320px;
          margin: 0 auto;
          padding: 32px 24px 64px;
          color: #f8fafc;
        }

        .ecosystem-shell {
          position: relative;
          overflow: hidden;
          padding: 38px;
          border-radius: 26px;
          border: 1px solid rgba(100, 160, 255, 0.2);
          background:
            radial-gradient(
              circle at 8% 0%,
              rgba(29, 100, 220, 0.2),
              transparent 38%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(14, 165, 233, 0.12),
              transparent 36%
            ),
            linear-gradient(
              145deg,
              #101c38 0%,
              #080f22 100%
            );
          box-shadow:
            0 24px 70px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.07);
        }

        /* HEADER */

        .ecosystem-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 30px;
        }

        .ecosystem-heading {
          max-width: 690px;
        }

        .ecosystem-eyebrow {
          display: inline-block;
          margin-bottom: 13px;
          color: #62c7ff;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.8px;
        }

        .ecosystem-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ecosystem-bar {
          flex-shrink: 0;
          width: 4px;
          height: 30px;
          border-radius: 99px;
          background: linear-gradient(
            180deg,
            #67e8f9,
            #318bff
          );
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
        }

        .ecosystem-title h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(23px, 3vw, 34px);
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .ecosystem-subtitle {
          max-width: 620px;
          margin: 13px 0 0 16px;
          color: #a6b6d3;
          font-size: 14px;
          line-height: 1.8;
        }

        .ecosystem-link {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 13px 18px;
          border: 1px solid rgba(111, 183, 255, 0.35);
          border-radius: 12px;
          color: #d9edff;
          background: rgba(41, 104, 190, 0.13);
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .ecosystem-link span {
          font-size: 17px;
          color: #67d5ff;
        }

        .ecosystem-link:hover {
          background: rgba(41, 133, 230, 0.25);
          border-color: rgba(103, 213, 255, 0.7);
          transform: translateY(-2px);
        }

        /* MODULE GRID */

        .ecosystem-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .eco-card {
          position: relative;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          padding: 23px;
          overflow: hidden;
          border: 1px solid rgba(132, 165, 220, 0.17);
          border-radius: 18px;
          background: linear-gradient(
            145deg,
            rgba(28, 48, 87, 0.83),
            rgba(13, 25, 51, 0.95)
          );
          color: inherit;
          text-decoration: none;
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }

        .eco-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 22px;
          right: 22px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(117, 196, 255, 0.55),
            transparent
          );
          opacity: 0.6;
        }

        .eco-card:hover {
          transform: translateY(-5px);
          border-color: rgba(92, 183, 255, 0.55);
          background: linear-gradient(
            145deg,
            rgba(35, 65, 117, 0.95),
            rgba(14, 30, 62, 0.98)
          );
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.24);
        }

        /* ICON */

        .eco-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .eco-icon-box {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: #ffffff;
          font-size: 25px;
          line-height: 1;
          border: 1px solid rgba(255, 255, 255, 0.22);
        }

        .eco-tone-0 .eco-icon-box {
          background: linear-gradient(145deg, #36b9ff, #1763e9);
          box-shadow: 0 8px 24px rgba(34, 134, 255, 0.28);
        }

        .eco-tone-1 .eco-icon-box {
          background: linear-gradient(145deg, #bd78ff, #7041e9);
          box-shadow: 0 8px 24px rgba(145, 72, 255, 0.28);
        }

        .eco-tone-2 .eco-icon-box {
          background: linear-gradient(145deg, #32dce9, #137dbd);
          box-shadow: 0 8px 24px rgba(24, 188, 224, 0.25);
        }

        .eco-tone-3 .eco-icon-box {
          background: linear-gradient(145deg, #559fff, #2458d8);
          box-shadow: 0 8px 24px rgba(42, 122, 255, 0.25);
        }

        .eco-tone-4 .eco-icon-box {
          background: linear-gradient(145deg, #b66dff, #6337dc);
          box-shadow: 0 8px 24px rgba(138, 66, 245, 0.25);
        }

        .eco-tone-5 .eco-icon-box {
          background: linear-gradient(145deg, #36b7ed, #155bbd);
          box-shadow: 0 8px 24px rgba(30, 132, 224, 0.25);
        }

        /* CARD CONTENT */

        .eco-number {
          color: rgba(165, 190, 230, 0.38);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .eco-card-content {
          flex: 1;
        }

        .eco-card h3 {
          margin: 0 0 9px;
          color: #ffffff;
          font-size: 19px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .eco-card p {
          max-width: 300px;
          margin: 0;
          color: #a9bad8;
          font-size: 13px;
          line-height: 1.7;
        }

        /* CARD FOOTER */

        .eco-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 22px;
          padding-top: 15px;
          border-top: 1px solid rgba(150, 180, 225, 0.13);
          color: #8faedb;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .eco-circle-arrow {
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(130, 180, 240, 0.3);
          border-radius: 50%;
          color: #80d8ff;
          font-size: 15px;
          transition: all 0.25s ease;
        }

        .eco-card:hover .eco-circle-arrow {
          color: #ffffff;
          background: #1879dc;
          border-color: #55baff;
          transform: rotate(45deg);
        }

        /* SECTION FOOTER */

        .ecosystem-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          margin-top: 27px;
          color: #7188ad;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.5px;
        }

        .ecosystem-footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #39c7ed;
          box-shadow: 0 0 10px rgba(57, 199, 237, 0.8);
        }

        /* TABLET */

        @media (max-width: 900px) {
          .ecosystem-shell {
            padding: 28px;
          }

          .ecosystem-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ecosystem-topbar {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        /* MOBILE */

        @media (max-width: 540px) {
          .platform-section {
            padding: 18px 14px 40px;
          }

          .ecosystem-shell {
            padding: 21px 15px;
            border-radius: 20px;
          }

          .ecosystem-title h2 {
            font-size: 23px;
          }

          .ecosystem-subtitle {
            margin-left: 16px;
            font-size: 12px;
          }

          .ecosystem-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .eco-card {
            min-height: 195px;
            padding: 20px;
          }

          .eco-card-top {
            margin-bottom: 19px;
          }

          .eco-card h3 {
            font-size: 18px;
          }

          .ecosystem-link {
            width: 100%;
            justify-content: center;
          }

          .ecosystem-footer {
            font-size: 8px;
            letter-spacing: 1.5px;
          }
        }

        /* ACCESSIBILITY */

        @media (prefers-reduced-motion: reduce) {
          .eco-card,
          .ecosystem-link,
          .eco-circle-arrow {
            transition: none;
          }

          .eco-card:hover,
          .ecosystem-link:hover {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
