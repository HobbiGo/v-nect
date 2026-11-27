"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";
import { PostThreadComments } from "@/components/PostThreadComments";

// ... (semua interface, helper, state, fetch Supabase, like/comment, video modal SAMA PERSIS seperti file lama kamu - jangan diubah)

export default function HomePage() {
  // ... (semua logic di atas return() SAMA PERSIS seperti file lama kamu)
  return (
    <main className="vnect-home">
      {/* HEADER - SAMA PERSIS */}
      {/* ... */}

      {/* ===== HERO - INI YANG DIGANTI (TANPA SCALE) ===== */}
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="eyebrow">THE V-NECT PLATFORM</span>
            <h1>
              Connect Beyond <span>Boundaries.</span>
            </h1>
            <p className="hero-sub">
              v-nect is the next-generation business ecosystem for
              communication, video meetings, community engagement, and
              commercial growth.
            </p>
            <div className="hero-buttons">
              <Link href="/explore" className="btn-primary hero-explore-btn">
                Explore Platform →
              </Link>
              <Link href="/business-feed" className="btn-secondary">
                Open Business Feed
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-globe-wrap">
              <img
                src="/images/logonew-v-nect.png"
                alt="v-nect global network globe"
                className="hero-globe-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / ECOSYSTEM / POSTS / VIDEO / ABOUT / FOOTER / MODAL - SAMA PERSIS */}

      <style jsx>{`
        /* ... semua CSS lain SAMA PERSIS ... */

        /* ===== HERO - GANTI TOTAL BLOK INI (TANPA SCALE) ===== */
        .hero-section {
          padding: 28px 7% 36px;
          display: flex;
          align-items: center;
          background:
            radial-gradient(circle at 76% 42%, rgba(92,124,255,0.32), transparent 36%),
            radial-gradient(circle at 82% 24%, rgba(145,92,255,0.22), transparent 34%);
        }
        .hero-grid {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: 24px 40px;
        }
        .hero-content { max-width: 580px; }

        .hero-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 420px;
          overflow: visible;
        }

        /* Pembungkus yang motong pinggiran transparan logo */
        .hero-globe-wrap {
          width: 100%;
          max-width: 620px;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          display: grid;
          place-items: center;
          position: relative;
        }

        /* TANPA transform: scale() - pakai width + object-fit: cover */
        .hero-globe-img {
          width: 135%;
          height: 135%;
          max-width: none;
          object-fit: cover;
          object-position: center;
          display: block;
          mix-blend-mode: screen;
          filter: contrast(1.08) saturate(1.14);
          /* Mask dilonggarin biar globe tidak kepotong */
          -webkit-mask-image: radial-gradient(
            ellipse 98% 96% at 50% 50%,
            #000 78%,
            rgba(0,0,0,0.85) 92%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 98% 96% at 50% 50%,
            #000 78%,
            rgba(0,0,0,0.85) 92%,
            transparent 100%
          );
        }

        @media (max-width: 960px) {
          .hero-grid { grid-template-columns: 1fr; gap: 8px; }
          .hero-visual { min-height: 320px; }
          .hero-globe-wrap { max-width: 520px; }
          .hero-globe-img { width: 128%; height: 128%; }
        }
        @media (max-width: 640px
