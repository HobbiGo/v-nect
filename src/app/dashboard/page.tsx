"use client";
import SignOutButton from "@/components/SignOutButton";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { getLang, type Lang } from "@/lib/i18n";

// Dashboard - FULL FIX VISUAL + GAMBAR + TRANSLATE FULL
// File: src/app/dashboard/page.tsx - timpa file lama

const TR: Record<string, Record<string, string>> = {
  id: {
    title: "Dashboard",
    hello: "Halo, Member v-nect 👋",
    email: "Email",
    meet: "V-Meet",
    meetDesc: "Live Translate",
    market: "V-Market",
    marketDesc: "Marketplace B2B",
    circle: "V-Circle",
    circleDesc: "Komunitas",
    company: "Company",
    companyDesc: "Profil Perusahaan",
    profile: "Profil Saya",
    <SignOutButton />
    displayName: "Nama Tampilan",
    bio: "Bio",
    bioPh: "Ceritain bisnis kamu...",
    location: "Lokasi",
    website: "Website",
    save: "Simpan Profil",
    saved: "Tersimpan ✓",
    statsConnections: "Koneksi",
    statsMeetings: "Meeting",
    statsOrders: "Pesanan",
    statsViews: "Dilihat",
    quick: "Aksi Cepat",
    openMeet: "Buka V-Meet",
    openMarket: "Buka V-Market",
    openCircle: "Buka V-Circle",
    openCompany: "Buka Company",
    tip: "Lengkapi profil biar supplier & buyer lebih percaya. Profil lengkap = Verified lebih cepat.",
  },
  en: {
    title: "Dashboard",
    hello: "Hello, v-nect Member 👋",
    email: "Email",
    meet: "V-Meet",
    meetDesc: "Live Translate",
    market: "V-Market",
    marketDesc: "B2B Marketplace",
    circle: "V-Circle",
    circleDesc: "Community",
    company: "Company",
    companyDesc: "Company Profile",
    profile: "My Profile",
    displayName: "Display Name",
    bio: "Bio",
    bioPh: "Tell us about your business...",
    location: "Location",
    website: "Website",
    save: "Save Profile",
    saved: "Saved ✓",
    statsConnections: "Connections",
    statsMeetings: "Meetings",
    statsOrders: "Orders",
    statsViews: "Views",
    quick: "Quick Actions",
    openMeet: "Open V-Meet",
    openMarket: "Open V-Market",
    openCircle: "Open V-Circle",
    openCompany: "Open Company",
    tip: "Complete your profile so suppliers & buyers trust you more. Complete profile = faster Verified.",
  },
  zh: {
    title: "仪表盘",
    hello: "你好，v-nect 会员 👋",
    email: "邮箱",
    meet: "V-Meet",
    meetDesc: "实时翻译",
    market: "V-Market",
    marketDesc: "B2B 市场",
    circle: "V-Circle",
    circleDesc: "社区",
    company: "公司",
    companyDesc: "公司资料",
    profile: "我的资料",
    displayName: "显示名称",
    bio: "简介",
    bioPh: "介绍一下你的生意...",
    location: "位置",
    website: "网站",
    save: "保存资料",
    saved: "已保存 ✓",
    statsConnections: "连接",
    statsMeetings: "会议",
    statsOrders: "订单",
    statsViews: "浏览",
    quick: "快捷操作",
    openMeet: "打开 V-Meet",
    openMarket: "打开 V-Market",
    openCircle: "打开 V-Circle",
    openCompany: "打开公司",
    tip: "完善资料，让供应商和买家更信任你。资料完整 = 更快通过认证。",
  },
  ja: {
    title: "ダッシュボード",
    hello: "こんにちは、v-nect メンバー 👋",
    email: "メール",
    meet: "V-Meet",
    meetDesc: "ライブ翻訳",
    market: "V-Market",
    marketDesc: "B2B マーケット",
    circle: "V-Circle",
    circleDesc: "コミュニティ",
    company: "会社",
    companyDesc: "会社プロフィール",
    profile: "マイプロフィール",
    displayName: "表示名",
    bio: "自己紹介",
    bioPh: "あなたのビジネスについて教えてください...",
    location: "場所",
    website: "ウェブサイト",
    save: "プロフィールを保存",
    saved: "保存済み ✓",
    statsConnections: "つながり",
    statsMeetings: "ミーティング",
    statsOrders: "注文",
    statsViews: "閲覧",
    quick: "クイックアクション",
    openMeet: "V-Meet を開く",
    openMarket: "V-Market を開く",
    openCircle: "V-Circle を開く",
    openCompany: "会社を開く",
    tip: "プロフィールを完成させると、サプライヤーとバイヤーからの信頼が高まります。完成 = 認証が早い。",
  },
};

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>(getLang());
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("Jakarta, Indonesia");
  const [website, setWebsite] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  const tr = (k: string) => TR[lang]?.[k] || TR.en[k] || k;

  const cards = [
    { href: "/v-meet", emoji: "🎥", bg: "linear-gradient(135deg,#4B6BFF,#8AB4FF)", title: tr("meet"), desc: tr("meetDesc"), btn: tr("openMeet") },
    { href: "/v-market", emoji: "🛒", bg: "linear-gradient(135deg,#FF6B35,#FFB199)", title: tr("market"), desc: tr("marketDesc"), btn: tr("openMarket") },
    { href: "/v-circle", emoji: "👥", bg: "linear-gradient(135deg,#22C55E,#86EFAC)", title: tr("circle"), desc: tr("circleDesc"), btn: tr("openCircle") },
    { href: "/company", emoji: "🏢", bg: "linear-gradient(135deg,#A855F7,#C084FC)", title: tr("company"), desc: tr("companyDesc"), btn: tr("openCompany") },
  ];

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <main className="dash">
      {/* DASHBOARD SEMPURNA - hero + stats + gambar + form rapi */}
      <TopNav active="home" />
      <SignOutButton />
      <section className="wrap">
        <div className="hero">
          <div>
            <h1>{tr("title")}</h1>
            <p className="hello">{tr("hello")}</p>
            <p className="tip">💡 {tr("tip")}</p>
          </div>
          <div className="hero-img">🌐</div>
        </div>

        <div className="stats">
          <div className="stat"><b>12</b><span>{tr("statsConnections")}</span></div>
          <div className="stat"><b>8</b><span>{tr("statsMeetings")}</span></div>
          <div className="stat"><b>3</b><span>{tr("statsOrders")}</span></div>
          <div className="stat"><b>1.2k</b><span>{tr("statsViews")}</span></div>
        </div>

        <h2 className="sec">{tr("quick")}</h2>
        <div className="grid">
          {cards.map((c) => (
            <a key={c.title} href={c.href} className="card">
              <div className="card-img" style={{ background: c.bg }}><span>{c.emoji}</span></div>
              <div className="card-body">
                <b>{c.title}</b>
                <p>{c.desc}</p>
                <span className="card-link">{c.btn} →</span>
              </div>
            </a>
          ))}
        </div>

        <div className="profile">
          <h2>{tr("profile")}</h2>
          <div className="form">
            <div className="field full">
              <label>{tr("displayName")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("displayName")} />
            </div>
            <div className="field full">
              <label>{tr("bio")}</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={tr("bioPh")} rows={3} />
            </div>
            <div className="field">
              <label>{tr("location")}</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Jakarta, Indonesia" />
            </div>
            <div className="field">
              <label>{tr("website")}</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
            <button onClick={save} className="save">{saved ? tr("saved") : `💾 ${tr("save")}`}</button>
          </div>
        </div>
      </section>
      <Footer />
      <style jsx>{`
        .dash { background: #060B24; color: #F3F7FF; min-height: 100vh; }
        .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 4% 30px; }
        .hero { display: flex; justify-content: space-between; align-items: center; gap: 16px; background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 20px; padding: 24px; }
        .hero h1 { font-size: 32px; margin: 0 0 6px; }
        .hello { color: #E2ECFF; margin: 0 0 10px; font-weight: 700; }
        .tip { color: #B4C6E7; font-size: 13px; line-height: 1.6; margin: 0; max-width: 600px; }
        .hero-img { font-size: 64px; flex-shrink: 0; }
        .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-top: 16px; }
        .stat { background: #0E183A; border: 1px solid rgba(138,165,255,.18); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 4px; text-align: center; }
        .stat b { font-size: 24px; }
        .stat span { color: #B4C6E7; font-size: 12px; }
        .sec { font-size: 18px; margin: 26px 0 12px; }
        .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
        .card { background: #0E183A; border: 1px solid rgba(138,165,255,.18); border-radius: 18px; overflow: hidden; text-decoration: none; color: inherit; display: flex; flex-direction: column; }
        .card-img { height: 110px; display: grid; place-items: center; font-size: 44px; }
        .card-body { padding: 14px; display: flex; flex-direction: column; gap: 4px; }
        .card-body b { font-size: 15px; }
        .card-body p { color: #B4C6E7; font-size: 12px; margin: 0; }
        .card-link { color: #8AB4FF; font-size: 12px; font-weight: 800; margin-top: 8px; }
        .profile { background: #0E183A; border: 1px solid rgba(138,165,255,.18); border-radius: 20px; padding: 22px; margin-top: 22px; }
        .profile h2 { margin: 0 0 16px; font-size: 20px; }
        .form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field.full { grid-column: 1 / -1; }
        .field label { font-size: 13px; font-weight: 700; color: #E2ECFF; }
        .field input, .field textarea { background: #060B24; border: 1px solid rgba(138,165,255,.3); border-radius: 11px; padding: 12px; color: #fff; font-size: 14px; outline: none; width: 100%; font-family: inherit; }
        .field input::placeholder, .field textarea::placeholder { color: #8A9CC4; }
        .save { grid-column: 1 / -1; background: #fff; color: #060B24; border: none; padding: 13px; border-radius: 12px; font-weight: 850; cursor: pointer; font-size: 14px; }
        @media (max-width: 700px) { .grid, .stats { grid-template-columns: 1fr 1fr; } .form { grid-template-columns: 1fr; } .hero-img { display: none; } }
      `}</style>
    </main>
  );
}
