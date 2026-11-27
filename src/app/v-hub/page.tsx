"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

type HubProfile = {
  display_name: string; bio: string; location: string; website: string; avatar_url: string;
  company: string; industry: string; verified: boolean;
};

export default function VHubPage() {
  const [supabase] = useState(() => createClient());
  const [lang, setLang] = useState<Lang>(getLang());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<"profil"|"bisnis"|"pengaturan">("profil");
  const [form, setForm] = useState<HubProfile>({
    display_name: "", bio: "", location: "", website: "", avatar_url: "",
    company: "", industry: "", verified: false,
  });

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email || "");
      const { data } = await supabase.from("account_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({
          display_name: data.display_name || "",
          bio: data.bio || "",
          location: data.location || "",
          website: data.website || "",
          avatar_url: data.avatar_url || "",
          company: data.company || "",
          industry: data.industry || "",
          verified: !!data.verified,
        });
      } else {
        setForm(p => ({ ...p, display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "" }));
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  function set(k: keyof HubProfile, v: string | boolean) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!userId) { setMsg("Silakan login dulu."); return; }
    setSaving(true); setMsg("");
    const payload = {
      user_id: userId,
      display_name: form.display_name,
      bio: form.bio,
      location: form.location,
      website: form.website,
      avatar_url: form.avatar_url,
      company: form.company,
      industry: form.industry,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("account_settings").upsert(payload, { onConflict: "user_id" });
    if (error) setMsg("Gagal save: " + error.message);
    else setMsg("✅ " + t("saved", lang));
    setSaving(false);
  }

  if (loading) return <div style={{ padding: 20, background: "#060B24", color: "#fff", minHeight: "100vh" }}>Loading...</div>;

  return (
    <div className="hub">
      {/* TOPNAV - SAMA PERSIS KAYAK SEMUA HALAMAN LAIN */}
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
          <Link href="/v-circle" className="nav-link">👥 {t("community", lang)}</Link>
          <Link href="/v-market" className="nav-link">🛒 {t("market", lang)}</Link>
          <Link href="/v-meet" className="nav-link">🎥 {t("meet", lang)}</Link>
        </nav>
        <div className="top-right">
          <LanguageSwitcher />
          {form.display_name ? <span className="chip">● {form.display_name}</span> : <Link href="/dashboard" className="btn-ghost">Sign In</Link>}
        </div>
      </header>

      <main className="hub-main">
        {/* KARTU PROFIL - SOLID NAVY, NGGAK GRADASI, NGGAK KEPOTONG */}
        <div className="profile-card">
          <span className="big-avatar">{form.display_name?.charAt(0)?.toUpperCase() || "V"}</span>
          <div className="profile-info">
            <div className="name-row">
              <b>{form.display_name || "Member v-nect"}</b>
              {form.verified && <span className="verified">✓ Verified</span>}
            </div>
            <span>{form.company ? form.company + " • " : ""}{form.industry || "Business Member"}</span>
            <span className="loc">📍 {form.location || "Lokasi belum diisi"} • {email}</span>
            <p>{form.bio || "Bio belum diisi. Ceritain bisnis kamu di sini biar buyer / partner percaya."}</p>
            <div className="profile-links">
              {form.website && <a href={form.website} target="_blank" rel="noreferrer">🌐 {form.website}</a>}
              <Link href="/v-market">🛒 Lihat di Market →</Link>
              <Link href="/v-circle">👥 Lihat di Community →</Link>
            </div>
          </div>
          <Link href="/company" className="btn-company">🏢 Company →</Link>
        </div>

        {/* TABS - CUMA 3 */}
        <div className="tabs">
          <button onClick={()=>setTab("profil")} className={tab==="profil"?"tab active":"tab"}>👤 Profil</button>
          <button onClick={()=>setTab("bisnis")} className={tab==="bisnis"?"tab active":"tab"}>🏢 Bisnis</button>
          <button onClick={()=>setTab("pengaturan")} className={tab==="pengaturan"?"tab active":"tab"}>⚙️ Pengaturan</button>
        </div>

        {msg && <div className={msg.includes("Gagal") ? "msg err" : "msg ok"}>{msg}</div>}

        {tab==="profil" && (
          <div className="form-card">
            <h2>{t("myProfile", lang)}</h2>
            <label>{t("displayName", lang)}</label>
            <input value={form.display_name} onChange={e=>set("display_name", e.target.value)} placeholder="Nama tampilan" />
            <label>{t("bio", lang)}</label>
            <textarea value={form.bio} onChange={e=>set("bio", e.target.value)} placeholder="Ceritain bisnis kamu..." rows={3} />
            <label>{t("location", lang)}</label>
            <input value={form.location} onChange={e=>set("location", e.target.value)} placeholder="Jakarta, Indonesia" />
            <label>{t("website", lang)}</label>
            <input value={form.website} onChange={e=>set("website", e.target.value)} placeholder="https://..." />
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "..." : "💾 " + t("saveProfile", lang)}</button>
          </div>
        )}

        {tab==="bisnis" && (
          <div className="form-card">
            <h2>Identitas Bisnis</h2>
            <p className="form-note">Ini yang muncul di Market + Community. Makin lengkap, makin dipercaya buyer.</p>
            <label>Nama Perusahaan</label>
            <input value={form.company} onChange={e=>set("company", e.target.value)} placeholder="PT / CV / Brand kamu" />
            <label>Industri</label>
            <input value={form.industry} onChange={e=>set("industry", e.target.value)} placeholder="Fashion, Elektronik, Makanan..." />
            <label>Website Perusahaan</label>
            <input value={form.website} onChange={e=>set("website", e.target.value)} placeholder="https://..." />
            <div className="verified-box">
              <div><b>✓ Verified Badge</b><p>Verifikasi perusahaan biar buyer percaya. Hubungi admin v-nect untuk verifikasi.</p></div>
              <span className={form.verified ? "verified" : "not-verified"}>{form.verified ? "✓ Verified" : "Belum Verified"}</span>
            </div>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "..." : "💾 " + t("saveProfile", lang)}</button>
            <Link href="/company" className="btn-secondary">🏢 Lengkapi Company Profile →</Link>
          </div>
        )}

        {tab==="pengaturan" && (
          <div className="form-card">
            <h2>Pengaturan</h2>
            <div className="setting-row"><div><b>Bahasa / Language</b><p>Ganti bahasa pakai bendera di atas.</p></div><LanguageSwitcher /></div>
            <div className="setting-row"><div><b>Email</b><p>{email || "Belum login"}</p></div><span className="chip">Akun aktif</span></div>
            <div className="setting-row"><div><b>Dashboard</b><p>Lihat semua aktivitas & statistik kamu.</p></div><Link href="/dashboard" className="btn-ghost">Buka Dashboard →</Link></div>
            <div className="setting-row"><div><b>Company Profile</b><p>Halaman publik perusahaan kamu.</p></div><Link href="/company" className="btn-ghost">Buka Company →</Link></div>
          </div>
        )}
      </main>

      <footer className="footer"><b>v<span>-nect</span></b><p>Connect Beyond Boundaries.</p><small>© 2026 v-nect</small></footer>

      <nav className="bottom-nav">
        <Link href="/" className="bnav bnav-home">⌂<small>{lang==="id"?"Beranda":"Home"}</small></Link>
        <Link href="/v-market" className="bnav">🛒<small>{t("market", lang)}</small></Link>
        <Link href="/#feed" className="bnav plus">+<small></small></Link>
        <Link href="/v-circle?tab=messages" className="bnav">✉️<small>Kotak Masuk</small></Link>
        <Link href="/v-hub" className="bnav active">●<small>Profil</small></Link>
      </nav>

      <style jsx>{`
        .hub{background:#060B24;color:#f3f7ff;min-height:100vh;font-family:var(--font-sans),Arial,sans-serif;padding-bottom:70px;overflow-x:hidden}
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
        .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.28);color:#eef3ff;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap}
        .hub-main{max-width:680px;margin:0 auto;padding:24px 16px}
        .profile-card{background:#0E183A;border:1px solid #4B6BFF;border-radius:20px;padding:22px;display:flex;gap:16px;align-items:flex-start}
        .big-avatar{width:64px;height:64px;flex-shrink:0;border-radius:50%;background:#4B6BFF;display:grid;place-items:center;font-weight:800;font-size:26px}
        .profile-info{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.profile-info b{font-size:19px}.profile-info span{font-size:13px;color:#B4C6E7}.profile-info .loc{color:#9CB0D9}.profile-info p{font-size:13.5px;line-height:1.6;color:#E2ECFF;margin:6px 0}
        .name-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.verified{background:#0CAA91;color:#fff;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap}.not-verified{background:rgba(255,255,255,.08);border:1px solid rgba(154,178,255,.3);color:#B4C6E7;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
        .profile-links{display:flex;gap:14px;flex-wrap:wrap;margin-top:4px}.profile-links a{color:#9EC0FF;text-decoration:none;font-size:12.5px;font-weight:700}
        .btn-company{background:#fff;color:#060B24;padding:9px 14px;border-radius:999px;font-size:12.5px;font-weight:800;text-decoration:none;white-space:nowrap;flex-shrink:0}
        .tabs{display:flex;gap:8px;margin:18px 0 14px;flex-wrap:wrap}
        .tab{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.25);color:#d9e4ff;padding:9px 18px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer}.tab.active{background:#fff;color:#060b24;border-color:#fff}
        .msg{padding:12px 14px;border-radius:12px;font-weight:700;margin-bottom:12px}.msg.ok{background:#0CAA91}.msg.err{background:#FE2C55}
        .form-card{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:8px}.form-card h2{margin:0 0 6px}.form-card label{font-size:12px;color:#9CB0D9;margin-top:6px}.form-card input,.form-card textarea{width:100%;box-sizing:border-box;background:#060B24;border:1px solid rgba(138,165,255,.25);border-radius:12px;padding:12px;color:#fff;font-size:14px;outline:none}.form-note{color:#a9b9da;font-size:13px;margin:0 0 4px;line-height:1.6}
        .btn-primary{background:#4B6BFF;color:#fff;border:none;padding:12px 18px;border-radius:12px;font-size:13.5px;font-weight:750;cursor:pointer;margin-top:10px}.btn-secondary{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.3);color:#fff;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:700;text-decoration:none;text-align:center;margin-top:6px}
        .verified-box{display:flex;gap:12px;align-items:center;justify-content:space-between;background:#16224F;border:1px solid rgba(138,165,255,.2);border-radius:12px;padding:14px;margin-top:8px}.verified-box b{font-size:14px}.verified-box p{font-size:12.5px;color:#B4C6E7;margin:4px 0 0;line-height:1.5}
        .setting-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid rgba(138,165,255,.12)}.setting-row:last-child{border-bottom:none}.setting-row b{font-size:14px}.setting-row p{font-size:12.5px;color:#9CB0D9;margin:3px 0 0}
        .footer{text-align:center;padding:28px;color:#96a8d0}.footer b{color:#fff;font-size:22px}
        .bottom-nav{display:none}
        @media(max-width:640px){
          .nav-desktop{display:none}.topnav{padding:10px 4%}.home-pill{padding:7px 12px;font-size:12.5px}.hub-main{padding:18px 12px}
          .profile-card{flex-direction:column}.btn-company{align-self:flex-start}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#060B24;border-top:1px solid rgba(138,165,255,.2);justify-content:space-around;padding:8px 4px 12px}
          .bottom-nav a{color:#c8d7f5;text-decoration:none;display:flex;flex-direction:column;align-items:center;font-size:18px}.bottom-nav small{font-size:9px;margin-top:2px}.bottom-nav .plus{background:#4B6BFF;width:44px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-top:-18px}
          .bnav-home{color:#fff}.bnav-home small{color:#fff;font-weight:800}.bnav.active{color:#fff}.bnav.active small{color:#fff;font-weight:800}
        }
      `}</style>
    </div>
  );
}
