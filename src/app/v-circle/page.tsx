"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

type Person = { id: string; name: string; role: string; location: string; avatar: string; tags: string[] };
type Circle = { id: string; name: string; members: number; desc: string; icon: string; joined: boolean };

const DEMO_PEOPLE: Person[] = [
  { id: "1", name: "Ayu Prameswari", role: "Founder • Fashion Export", location: "Jakarta, Indonesia", avatar: "A", tags: ["Fashion", "Export", "UMKM"] },
  { id: "2", name: "David Chen", role: "Supplier • Electronics", location: "Shenzhen, China", avatar: "D", tags: ["Electronics", "OEM", "B2B"] },
  { id: "3", name: "Sato Yuki", role: "Buyer • Retail Japan", location: "Osaka, Japan", avatar: "S", tags: ["Retail", "Import", "Japan"] },
  { id: "4", name: "Maria Gonzalez", role: "Distributor • Food", location: "Madrid, Spain", avatar: "M", tags: ["Food", "Distribution"] },
];

const DEMO_CIRCLES: Circle[] = [
  { id: "c1", name: "Export Indonesia → Global", members: 1240, desc: "Diskusi export, bea cukai, buyer luar negeri.", icon: "🌏", joined: true },
  { id: "c2", name: "Supplier & Pabrik Asia", members: 860, desc: "Cari supplier, MOQ, harga pabrik.", icon: "🏭", joined: false },
  { id: "c3", name: "Founder & UMKM Naik Kelas", members: 2100, desc: "Branding, marketplace, pendanaan.", icon: "🚀", joined: false },
];

export default function VCirclePage() {
  const [supabase] = useState(() => createClient());
  const [lang, setLang] = useState<Lang>(getLang());
  const [tab, setTab] = useState<"people"|"circles"|"messages">("people");
  const [connected, setConnected] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>(["c1"]);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Member");
    });
  }, [supabase]);

  function toggleConnect(id: string) {
    setConnected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleJoin(id: string) {
    setJoined(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  const filteredPeople = DEMO_PEOPLE.filter(p => (p.name + p.role + p.location + p.tags.join(" ")).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="vc">
      {/* TOPNAV - SAMA KAYAK HOMEPAGE + BUSINESS FEED */}
      <header className="topnav">
        <div className="top-left">
          <Link href="/" className="brand">v<span>-nect</span></Link>
          <Link href="/" className="home-pill">
            <span className="home-icon">⌂</span>
            <span>{lang==="id" ? "Beranda" : lang==="en" ? "Home" : lang==="zh" ? "首页" : lang==="ja" ? "ホーム" : "Home"}</span>
            <span className="home-dot">●</span>
          </Link>
        </div>
        <nav className="nav-desktop">
          <Link href="/" className="nav-tab">▦ {t("explore", lang)}</Link>
          <Link href="/#feed" className="nav-tab">▶ {t("feed", lang)}</Link>
          <Link href="/v-circle" className="nav-tab active">👥 {t("community", lang)}</Link>
          <Link href="/v-market" className="nav-link">🛒 {t("market", lang)}</Link>
          <Link href="/v-meet" className="nav-link">🎥 {t("meet", lang)}</Link>
        </nav>
        <div className="top-right">
          <LanguageSwitcher />
          {userName ? <span className="chip">● {userName}</span> : <Link href="/dashboard" className="btn-ghost">Sign In</Link>}
        </div>
      </header>

      <main className="vc-main">
        {/* HEADER - JELAS, NGGAK GRADASI */}
        <div className="vc-head">
          <span className="eyebrow">COMMUNITY • V-CIRCLE</span>
          <h1>v-circle {t("community", lang)}</h1>
          <p>Founder, profesional & perusahaan. Cari partner, diskusi, tanya produk — di satu circle.</p>
        </div>

        {/* SEARCH - 1 BARIS, JELAS */}
        <input className="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari orang, circle, produk, negara..." />

        {/* TABS - CUMA 3 */}
        <div className="tabs">
          <button onClick={()=>setTab("people")} className={tab==="people"?"tab active":"tab"}>👥 Orang</button>
          <button onClick={()=>setTab("circles")} className={tab==="circles"?"tab active":"tab"}>⭕ Circle</button>
          <button onClick={()=>setTab("messages")} className={tab==="messages"?"tab active":"tab"}>✉️ Kotak Masuk</button>
        </div>

        {tab==="people" && (
          <div className="list">
            {filteredPeople.length===0 && <div className="empty">Nggak ketemu. Coba kata lain.</div>}
            {filteredPeople.map(p=>(
              <div key={p.id} className="person-card">
                <span className="avatar">{p.avatar}</span>
                <div className="person-info">
                  <b>{p.name}</b>
                  <span>{p.role}</span>
                  <span className="loc">📍 {p.location}</span>
                  <div className="tags">{p.tags.map(tag=><span key={tag} className="tag">{tag}</span>)}</div>
                </div>
                <button onClick={()=>toggleConnect(p.id)} className={connected.includes(p.id) ? "btn-connected" : "btn-connect"}>
                  {connected.includes(p.id) ? "✓ Terhubung" : "+ Connect"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab==="circles" && (
          <div className="list">
            {DEMO_CIRCLES.map(c=>(
              <div key={c.id} className="circle-card">
                <span className="circle-icon">{c.icon}</span>
                <div className="person-info">
                  <b>{c.name}</b>
                  <span>{c.members.toLocaleString()} anggota</span>
                  <span className="loc">{c.desc}</span>
                </div>
                <button onClick={()=>toggleJoin(c.id)} className={joined.includes(c.id) ? "btn-connected" : "btn-connect"}>
                  {joined.includes(c.id) ? "✓ Gabung" : "Gabung"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab==="messages" && (
          <div className="empty">
            <div className="empty-logo">✉️</div>
            <h3>Kotak Masuk</h3>
            <p>Chat sama orang yang udah kamu Connect akan muncul di sini.</p>
            <button onClick={()=>setTab("people")} className="btn-primary">Cari Orang →</button>
          </div>
        )}
      </main>

      <footer className="footer"><b>v<span>-nect</span></b><p>Connect Beyond Boundaries.</p><small>© 2026 v-nect</small></footer>

      <nav className="bottom-nav">
        <Link href="/" className="bnav bnav-home">⌂<small>{lang==="id"?"Beranda":"Home"}</small></Link>
        <Link href="/v-market" className="bnav">🛒<small>{t("market", lang)}</small></Link>
        <Link href="/#feed" className="bnav plus">+<small></small></Link>
        <Link href="/v-circle?tab=messages" className="bnav">✉️<small>Kotak Masuk</small></Link>
        <Link href="/v-hub" className="bnav">●<small>Profil</small></Link>
      </nav>

      <style jsx>{`
        .vc{background:#060B24;color:#f3f7ff;min-height:100vh;font-family:var(--font-sans),Arial,sans-serif;padding-bottom:70px;overflow-x:hidden}
        .topnav{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 6%;background:#060B24;border-bottom:1px solid rgba(138,165,255,.15)}
        .top-left{display:flex;align-items:center;gap:12px}
        .brand{font-size:21px;font-weight:850;color:#fff;text-decoration:none;white-space:nowrap}.brand span,.footer span{color:#8ab4ff}
        .home-pill{display:flex;align-items:center;gap:7px;background:#fff;color:#060B24;border:2px solid #fff;padding:8px 16px;border-radius:999px;font-size:13.5px;font-weight:800;text-decoration:none;box-shadow:0 6px 18px rgba(255,255,255,.18);white-space:nowrap}
        .home-icon{font-size:17px;line-height:1}.home-dot{color:#0CAA91;font-size:9px}
        .nav-desktop{display:flex;gap:8px;align-items:center}
        .nav-tab{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.25);color:#d9e4ff;padding:8px 16px;border-radius:999px;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap}.nav-tab.active{background:#fff;color:#060b24;border-color:#fff}
        .nav-link{color:#d9e4ff;text-decoration:none;font-size:13px;font-weight:600;padding:8px 12px;border-radius:999px;white-space:nowrap}
        .top-right{display:flex;align-items:center;gap:10px}
        .chip{background:rgba(138,180,255,.14);border:1px solid rgba(138,180,255,.35);padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
        .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.28);color:#eef3ff;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none}
        .vc-main{max-width:680px;margin:0 auto;padding:24px 16px}
        .eyebrow{color:#79a6ff;font-size:10.5px;font-weight:800;letter-spacing:2.6px}
        .vc-head h1{margin:8px 0 6px;font-size:30px}.vc-head p{color:#a9b9da;font-size:13.5px;margin:0;line-height:1.6}
        .search{width:100%;box-sizing:border-box;background:#0E183A;border:1px solid rgba(138,165,255,.25);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;margin:18px 0 14px;outline:none}.search::placeholder{color:#8A9DC2}
        .tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
        .tab{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.25);color:#d9e4ff;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer}.tab.active{background:#fff;color:#060b24;border-color:#fff}
        .list{display:flex;flex-direction:column;gap:12px}
        .person-card,.circle-card{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;padding:16px;display:flex;gap:12px;align-items:flex-start}
        .avatar{width:48px;height:48px;flex-shrink:0;border-radius:50%;background:#4B6BFF;display:grid;place-items:center;font-weight:800;font-size:18px}
        .circle-icon{width:48px;height:48px;flex-shrink:0;border-radius:14px;background:#1A2A5A;display:grid;place-items:center;font-size:22px}
        .person-info{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.person-info b{font-size:15px}.person-info span{font-size:12.5px;color:#B4C6E7;line-height:1.4}.person-info .loc{color:#9CB0D9}
        .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.tag{background:rgba(138,180,255,.14);border:1px solid rgba(138,180,255,.25);padding:3px 9px;border-radius:999px;font-size:11px;color:#C8D7F5}
        .btn-connect{background:#4B6BFF;color:#fff;border:none;padding:9px 16px;border-radius:999px;font-size:12.5px;font-weight:750;cursor:pointer;white-space:nowrap;flex-shrink:0}.btn-connected{background:#0CAA91;color:#fff;border:none;padding:9px 16px;border-radius:999px;font-size:12.5px;font-weight:750;cursor:pointer;white-space:nowrap;flex-shrink:0}
        .empty{padding:40px 20px;text-align:center;background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;color:#a9b9da}.empty-logo{font-size:26px;font-weight:850;color:#8ab4ff}.empty h3{color:#fff;margin:10px 0 4px}.empty p{margin:0 0 16px;font-size:13.5px}
        .btn-primary{background:#4B6BFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:11px;font-size:13px;font-weight:750;display:inline-block;border:none;cursor:pointer}
        .footer{text-align:center;padding:28px;color:#96a8d0}.footer b{color:#fff;font-size:22px}
        .bottom-nav{display:none}
        @media(max-width:640px){
          .nav-desktop{display:none}.topnav{padding:10px 4%}.home-pill{padding:7px 12px;font-size:12.5px}.vc-main{padding:18px 12px}
          .person-card,.circle-card{padding:14px}.btn-connect,.btn-connected{padding:8px 12px;font-size:12px}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#060B24;border-top:1px solid rgba(138,165,255,.2);justify-content:space-around;padding:8px 4px 12px}
          .bottom-nav a{color:#c8d7f5;text-decoration:none;display:flex;flex-direction:column;align-items:center;font-size:18px}.bottom-nav small{font-size:9px;margin-top:2px}.bottom-nav .plus{background:#4B6BFF;width:44px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-top:-18px}
          .bnav-home{color:#fff}.bnav-home small{color:#fff;font-weight:800}
        }
      `}</style>
    </div>
  );
}
