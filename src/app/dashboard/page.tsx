"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Profile = {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  location: string;
  website: string;
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Profile>({
    user_id: "",
    display_name: "",
    bio: "",
    avatar_url: "",
    location: "",
    website: "",
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email || "");
      const { data } = await supabase
        .from("account_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          user_id: user.id,
          display_name: data.display_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          location: data.location || "",
          website: data.website || "",
        });
      } else {
        setForm((p) => ({ ...p, user_id: user.id }));
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!userId) { setMsg("Silakan login dulu."); return; }
    setSaving(true); setMsg("");
    const payload = {
      user_id: userId,
      display_name: form.display_name,
      bio: form.bio,
      avatar_url: form.avatar_url,
      location: form.location,
      website: form.website,
      updated_at: new Date().toISOString(),
    };
    // UPSERT = kunci biar data nggak hilang pas refresh
    const { error } = await supabase
      .from("account_settings")
      .upsert(payload, { onConflict: "user_id" });
    if (error) setMsg("Gagal save: " + error.message);
    else setMsg("✅ Tersimpan! Refresh pun data tetap ada.");
    setSaving(false);
  }

  function set(k: keyof Profile, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  if (loading) return <div style={{ padding: 20, color: "#fff", background: "#060B24", minHeight: "100vh" }}>Loading v-nect Dashboard...</div>;

  return (
    <div style={{ background: "#060B24", minHeight: "100vh", color: "#fff" }}>
      <header className="vn-top">
        <Link href="/" className="vn-brand">v<span>-nect</span><small>GLOBAL BUSINESS ECOSYSTEM</small></Link>
        <nav className="vn-nav">
          <Link href="/">Home</Link>
          <Link href="/v-circle">Community</Link>
          <Link href="/v-market">Market</Link>
          <Link href="/v-meet">Meet</Link>
          <LanguageSwitcher />
        </nav>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <h1 style={{ fontSize: 26, margin: "12px 0 4px" }}>Dashboard</h1>
        <p style={{ color: "#9CB0D9", marginTop: 0 }}>Halo, {form.display_name || email || "Member v-nect"} 👋</p>
        <p style={{ color: "#9CB0D9", fontSize: 13 }}>Email: {email}</p>

        {msg && <div style={{ background: msg.includes("Gagal") ? "#FE2C55" : "#0CAA91", padding: "12px 14px", borderRadius: 12, fontWeight: 700, margin: "12px 0" }}>{msg}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "16px 0" }}>
          <Link href="/v-meet" style={{ background: "#0E183A", border: "1px solid rgba(138,165,255,.25)", borderRadius: 16, padding: 16, textDecoration: "none", color: "#fff" }}>
            <div style={{ fontSize: 24 }}>🎥</div><b>V-Meet</b><div style={{ fontSize: 12, color: "#9CB0D9" }}>Live Translate</div>
          </Link>
          <Link href="/v-market" style={{ background: "#0E183A", border: "1px solid rgba(138,165,255,.25)", borderRadius: 16, padding: 16, textDecoration: "none", color: "#fff" }}>
            <div style={{ fontSize: 24 }}>🛒</div><b>V-Market</b><div style={{ fontSize: 12, color: "#9CB0D9" }}>B2B Marketplace</div>
          </Link>
          <Link href="/v-circle" style={{ background: "#0E183A", border: "1px solid rgba(138,165,255,.25)", borderRadius: 16, padding: 16, textDecoration: "none", color: "#fff" }}>
            <div style={{ fontSize: 24 }}>👥</div><b>V-Circle</b><div style={{ fontSize: 12, color: "#9CB0D9" }}>Community</div>
          </Link>
          <Link href="/company" style={{ background: "#0E183A", border: "1px solid rgba(138,165,255,.25)", borderRadius: 16, padding: 16, textDecoration: "none", color: "#fff" }}>
            <div style={{ fontSize: 24 }}>🏢</div><b>Company</b><div style={{ fontSize: 12, color: "#9CB0D9" }}>Profil Bisnis + Verified</div>
          </Link>
        </div>

        <div className="vn-card" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Profil Saya</h2>
          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Nama Tampilan</label>
          <input className="vn-input" value={form.display_name} onChange={(e) => set("display_name", e.target.value)} placeholder="Nama kamu / nama bisnis" style={{ margin: "6px 0 12px" }} />
          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Bio</label>
          <textarea value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Ceritain bisnis kamu..." rows={3} style={{ width: "100%", background: "#1A1A1A", border: "1px solid #222", borderRadius: 12, padding: 12, color: "#fff", boxSizing: "border-box", margin: "6px 0 12px" }} />
          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Lokasi</label>
          <input className="vn-input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Jakarta, Indonesia" style={{ margin: "6px 0 12px" }} />
          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Website</label>
          <input className="vn-input" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." style={{ margin: "6px 0 12px" }} />
          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Foto Profil (URL)</label>
          <input className="vn-input" value={form.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} placeholder="https://.../foto.jpg" style={{ margin: "6px 0 16px" }} />
          <button onClick={save} disabled={saving} className="vn-btn" style={{ width: "100%" }}>
            {saving ? "Menyimpan..." : "💾 Simpan Profil"}
          </button>
          <p style={{ fontSize: 12, color: "#9CB0D9", textAlign: "center" }}>Pakai UPSERT, jadi data nggak hilang walau baru pertama kali isi.</p>
        </div>
      </main>
    </div>
  );
}
