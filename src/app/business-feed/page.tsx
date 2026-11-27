"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

type Post = {
  id: string; title: string; content: string; post_type: string; created_at: string;
  companies: { company_name: string; logo_url: string | null } | null;
};

export default function BusinessFeedPage() {
  const [supabase] = useState(() => createClient());
  const [lang, setLang] = useState<Lang>(getLang());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"foryou"|"following">("foryou");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Member");
      const { data } = await supabase.from("business_posts").select(`*,companies(company_name,logo_url)`).eq("status", "published").order("created_at", { ascending: false }).limit(30);
      setPosts((data || []) as unknown as Post[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <div className="bf">
      {/* ===== TOPNAV RAPI - SAMA KAYAK HOMEPAGE ===== */}
      <header className="topnav">
        <div className="top-left">
          <Link href="/" className="brand">v<span>-nect</span></Link>
          <Link href="/" className="home-pill" title="Kembali ke Beranda">
            <span className="home-icon">⌂</span>
            <span>{lang==="id" ? "Beranda" : lang==="en" ? "Home" : lang==="zh" ? "首页" : lang==="ja" ? "ホーム" : "Home"}</span>
            <span className="home-dot">●</span>
          </Link>
        </div>
        <nav className="nav-desktop">
          <Link href="/" className="nav-tab">▦ {t("explore", lang)}</Link>
          <Link href="/#feed" className="nav-tab active">▶ {t("feed", lang)}</Link>
          <Link href="/v-circle" className="nav-link">👥 {t("community", lang)}</Link>
          <Link href="/v-market" className="nav-link">🛒 {t("market", lang)}</Link>
          <Link href="/v-meet" className="nav-link">🎥 {t("meet", lang)}</Link>
        </nav>
        <div className="top-right">
          <LanguageSwitcher />
          {userName ? <span className="chip">● {userName}</span> : <Link href="/dashboard" className="btn-ghost">Sign In</Link>}
        </div>
      </header>

      {/* ===== JUDUL - JELAS & SIMPLE ===== */}
      <main className="bf-main">
        <div className="bf-head">
          <span className="eyebrow">BUSINESS FEED</span>
          <h1>{tab==="following" ? t("following", lang) : t("forYou", lang)}</h1>
          <p>Update bisnis, produk & peluang — dari seluruh ekosistem v-nect.</p>
        </div>

        {/* TABS - CUMA 2, NGGAK NUMPUK */}
        <div className="tabs">
          <button onClick={()=>setTab("following")} className={tab==="following"?"tab active":"tab"}>{t("following", lang)}</button>
          <button onClick={()=>setTab("foryou")} className={tab==="foryou"?"tab active":"tab"}>{t("forYou", lang)}</button>
          <Link href="/v-circle" className="tab-link">👥 {t("community", lang)} →</Link>
        </div>

        {/* FEED */}
        {loading ? <div className="loading">Loading...</div> : posts.length===0 ? (
          <div className="empty">
            <div className="empty-logo">v-nect</div>
            <h3>Belum ada post published.</h3>
            <p>Jadi yang pertama posting update bisnis kamu.</p>
            <Link href="/dashboard" className="btn-primary">+ Buat Post →</Link>
          </div>
        ) : (
          <div className="feed-list">
            {posts.map(p=>(
              <article key={p.id} className="post-card">
                <div className="post-top">
                  <span className="avatar">{p.companies?.company_name?.charAt(0)?.toUpperCase() || "V"}</span>
                  <div className="post-meta">
                    <b>@{p.companies?.company_name || "v-nect Official"}</b>
                    <span>{new Date(p.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • {p.post_type}</span>
                  </div>
                  <span className="post-badge">{p.post_type}</span>
                </div>
                <h3>{p.title}</h3>
                <p className="post-content">{p.content?.slice(0, 280)}{(p.content?.length||0)>280 ? "..." : ""}</p>
                <div className="post-actions">
                  <button>♥ Like</button>
                  <button>💬 Komentar</button>
                  <button>↗ Share</button>
                  <button>☆ Save</button>
                </div>
              </article>
            ))}
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
        .bf{background:#060B24;color:#f3f7ff;min-height:100vh;font-family:var(--font-sans),Arial,sans-serif;padding-bottom:70px;overflow-x:hidden}
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
        .bf-main{max-width:620px;margin:0 auto;padding:24px 16px}
        .eyebrow{color:#79a6ff;font-size:10.5px;font-weight:800;letter-spacing:2.6px}
        .bf-head h1{margin:8px 0 6px;font-size:30px}.bf-head p{color:#a9b9da;font-size:13.5px;margin:0;line-height:1.6}
        .tabs{display:flex;gap:8px;align-items:center;margin:20px 0 16px;flex-wrap:wrap}
        .tab{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.25);color:#d9e4ff;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer}.tab.active{background:#fff;color:#060b24;border-color:#fff}
        .tab-link{margin-left:auto;color:#9ec0ff;text-decoration:none;font-size:13px;font-weight:700}
        .feed-list{display:flex;flex-direction:column;gap:14px}
        .post-card{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;padding:18px}
        .post-top{display:flex;gap:10px;align-items:center;margin-bottom:10px}
        .avatar{width:38px;height:38px;border-radius:50%;background:#4B6BFF;display:grid;place-items:center;font-weight:800;flex-shrink:0}
        .post-meta{display:flex;flex-direction:column;min-width:0}.post-meta b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.post-meta span{font-size:11.5px;color:#9CB0D9}
        .post-badge{margin-left:auto;background:rgba(138,180,255,.14);border:1px solid rgba(138,180,255,.3);padding:4px 10px;border-radius:999px;font-size:11px;white-space:nowrap}
        .post-card h3{margin:0 0 6px;font-size:16px;line-height:1.4}.post-content{color:#C3D0EC;font-size:13.5px;line-height:1.6;margin:0}
        .post-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.post-actions button{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.2);color:#d9e4ff;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer}
        .loading,.empty{padding:40px 20px;text-align:center;background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;color:#a9b9da}.empty-logo{font-size:26px;font-weight:850;color:#8ab4ff}.empty h3{color:#fff;margin:10px 0 4px}.empty p{margin:0 0 16px;font-size:13.5px}
        .btn-primary{background:#4B6BFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:11px;font-size:13px;font-weight:750;display:inline-block}
        .footer{text-align:center;padding:28px;color:#96a8d0}.footer b{color:#fff;font-size:22px}
        .bottom-nav{display:none}
        @media(max-width:640px){
          .nav-desktop{display:none}.topnav{padding:10px 4%}.home-pill{padding:7px 12px;font-size:12.5px}.bf-main{padding:18px 12px}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#060B24;border-top:1px solid rgba(138,165,255,.2);justify-content:space-around;padding:8px 4px 12px}
          .bottom-nav a{color:#c8d7f5;text-decoration:none;display:flex;flex-direction:column;align-items:center;font-size:18px}.bottom-nav small{font-size:9px;margin-top:2px}.bottom-nav .plus{background:#4B6BFF;width:44px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-top:-18px}
          .bnav-home{color:#fff}.bnav-home small{color:#fff;font-weight:800}
        }
      `}</style>
    </div>
  );
}
