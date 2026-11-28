"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

// TopNav bareng - dipakai semua halaman: homepage, v-meet, v-market, v-circle, v-hub
// Sekali benerin di sini, semua halaman ikut rapi. Jangan copy-paste header lagi.

export default function TopNav({ active }: { active: string }) {
  const [lang, setLang] = useState<Lang>(getLang());

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  const pills = [
    { id: "home", label: lang === "id" ? "Beranda" : lang === "zh" ? "首页" : lang === "ja" ? "ホーム" : "Home", href: "/", icon: "⌂" },
    { id: "explore", label: t("explore", lang), href: "/#explore", icon: "▦" },
    { id: "feed", label: t("feed", lang), href: "/#feed", icon: "▶" },
    { id: "community", label: t("community", lang), href: "/v-circle", icon: "👥" },
    { id: "market", label: t("market", lang), href: "/v-market", icon: "🛒" },
    { id: "meet", label: t("meet", lang), href: "/v-meet", icon: "🎥" },
  ];

  return (
    <header className="topnav">
      {/* LOGO - pojok kiri atas, file di public/images/V-NECT-logo.png */}
      {/* LOGO GEDE - tulisan v-nect dihapus, logo gambar aja */}
      <Link href="/" className="brand-logo">
        <img src="/images/V-NECT-logo.png" alt="v-nect" className="logo-img" />
      </Link>

      {/* PILLS - semua ukuran sama, kolom rapi, tanpa garis */}
      <nav className="nav-pills">
        {pills.map((p) => (
          <Link key={p.id} href={p.href} className={active === p.id ? "pill active" : "pill"}>
            <span>{p.icon}</span> {p.label}
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LanguageSwitcher />
      </div>

      <style jsx>{`
        .topnav {
          position: sticky; top: 0; z-index: 30;
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          padding: 10px 4%; background: #060B24;
          border-bottom: 1px solid rgba(138,165,255,.15);
        }
        .brand-logo { display: flex; align-items: center; gap: 8px; text-decoration: none !important; flex-shrink: 0; }
        .logo-img { height: 68px; width: auto; object-fit: contain; display: block; }
        .logo-fallback { font-size: 20px; font-weight: 850; color: #fff; }
        .logo-fallback span { color: #8ab4ff; }
        .nav-pills { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; }
        .pill {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          min-width: 96px; padding: 8px 14px; border-radius: 999px;
          background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.28);
          color: #E2ECFF; font-size: 13px; font-weight: 700;
          text-decoration: none !important; white-space: nowrap; cursor: pointer;
        }
        .pill:hover { background: rgba(255,255,255,.14); }
        .pill.active { background: #fff; color: #060B24; border-color: #fff; }
        @media (max-width: 900px) {
          .nav-pills { display: none; }
        }
      `}</style>
    </header>
  );
}
