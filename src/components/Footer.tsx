"use client";
import { useEffect, useState } from "react";
import { getLang, type Lang } from "@/lib/i18n";

// Footer - FULL FIX sisa bahasa di bawah
// File: src/components/Footer.tsx
// Pakai di SEMUA halaman: homepage, dashboard, v-circle, v-market, v-meet, v-hub
// Cara pakai: import Footer from "@/components/Footer"; lalu <Footer /> sebelum </main>

const TR: Record<string, Record<string, string>> = {
  id: {
    onePlatform: "One Platform. Every Business Connection.",
    oneDesc: "Chat, meet, feed & market dalam 1 akun. Dibuat untuk bisnis lintas negara.",
    watchFeed: "Lihat Feed",
    tagline: "Connect Beyond Boundaries.",
    rights: "© 2026 v-nect",
    home: "Beranda",
    community: "Komunitas",
    market: "Market",
    meet: "Meet",
    dashboard: "Dashboard",
    company: "Company",
  },
  en: {
    onePlatform: "One Platform. Every Business Connection.",
    oneDesc: "Chat, meet, feed & market in 1 account. Built for cross-border business.",
    watchFeed: "Watch Feed",
    tagline: "Connect Beyond Boundaries.",
    rights: "© 2026 v-nect",
    home: "Home",
    community: "Community",
    market: "Market",
    meet: "Meet",
    dashboard: "Dashboard",
    company: "Company",
  },
  zh: {
    onePlatform: "一个平台。连接所有商业。",
    oneDesc: "聊天、会议、动态与市场，一个账号全搞定。为跨境生意而生。",
    watchFeed: "查看动态",
    tagline: "连接无界。",
    rights: "© 2026 v-nect",
    home: "首页",
    community: "社区",
    market: "市场",
    meet: "会议",
    dashboard: "仪表盘",
    company: "公司",
  },
  ja: {
    onePlatform: "1つのプラットフォーム。すべてのビジネス接続。",
    oneDesc: "チャット、ミート、フィード、マーケットを1アカウントに。国境を越えたビジネスのために。",
    watchFeed: "フィードを見る",
    tagline: "境界を越えてつながる。",
    rights: "© 2026 v-nect",
    home: "ホーム",
    community: "コミュニティ",
    market: "マーケット",
    meet: "ミート",
    dashboard: "ダッシュボード",
    company: "会社",
  },
};

export default function Footer() {
  const [lang, setLang] = useState<Lang>(getLang());
  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);
  const tr = (k: string) => TR[lang]?.[k] || TR.en[k] || k;
  return (
    <footer className="vfooter">
      <div className="vfooter-inner">
        <div className="vfooter-one">
          <h3>{tr("onePlatform")}</h3>
          <p>{tr("oneDesc")}</p>
          <a href="/#feed" className="vfooter-btn">▶ {tr("watchFeed")} →</a>
        </div>
        <div className="vfooter-links">
          <a href="/">⌂ {tr("home")}</a>
          <a href="/v-circle">👥 {tr("community")}</a>
          <a href="/v-market">🛒 {tr("market")}</a>
          <a href="/v-meet">🎥 {tr("meet")}</a>
          <a href="/dashboard">📊 {tr("dashboard")}</a>
          <a href="/company">🏢 {tr("company")}</a>
        </div>
        <div className="vfooter-brand">
          <img src="/images/V-NECT-logo.png" alt="v-nect" className="vfooter-logo" />
          <p>{tr("tagline")}</p>
          <span>{tr("rights")}</span>
        </div>
      </div>
      <style jsx>{`
        .vfooter { background: #060B24; border-top: 1px solid rgba(138,165,255,.15); padding: 32px 4% 24px; color: #F3F7FF; }
        .vfooter-inner { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 24px; }
        .vfooter-one h3 { font-size: 22px; margin: 0 0 8px; line-height: 1.3; }
        .vfooter-one p { color: #B4C6E7; margin: 0 0 14px; line-height: 1.6; font-size: 14px; }
        .vfooter-btn { display: inline-block; background: #4B6BFF; color: #fff; padding: 10px 16px; border-radius: 999px; font-weight: 800; font-size: 13px; text-decoration: none; }
        .vfooter-links { display: flex; flex-direction: column; gap: 8px; }
        .vfooter-links a { color: #E2ECFF; font-size: 13px; font-weight: 700; text-decoration: none; }
        .vfooter-brand { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
        .vfooter-logo { height: 52px; width: auto; object-fit: contain; }
        .vfooter-brand p { color: #B4C6E7; font-size: 13px; margin: 0; }
        .vfooter-brand span { color: #8A9CC4; font-size: 12px; }
        @media (max-width: 700px) { .vfooter-inner { grid-template-columns: 1fr; } }
      `}</style>
    </footer>
  );
}
