"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Company = {
  user_id: string;
  company_name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  logo_url: string;
  is_verified: boolean;
};

const INDUSTRIES = [
  "Fashion & Apparel",
  "Food & Beverage",
  "Beauty & Cosmetics",
  "Electronics",
  "Home & Living",
  "Health & Wellness",
  "Agriculture",
  "Handicraft & Souvenir",
  "Technology / IT",
  "Jasa / Services",
  "Lainnya",
];

export default function CompanyPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Company>({
    user_id: "",
    company_name: "",
    industry: "Fashion & Apparel",
    location: "",
    website: "",
    description: "",
    logo_url: "",
    is_verified: false,
  });

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setEmail(user.email || "");
      // Tabel: company_profiles - kalau belum ada tabelnya, lihat catatan SQL di bawah halaman ini
      const { data } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm({
          user_id: user.id,
          company_name: data.company_name || "",
          industry: data.industry || "Fashion & Apparel",
          location: data.location || "",
          website: data.website || "",
          description: data.description || "",
          logo_url: data.logo_url || "",
          is_verified: !!data.is_verified,
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
    if (!form.company_name.trim()) { setMsg("Isi dulu Nama Perusahaan."); return; }
    setSaving(true); setMsg("");
    const payload = {
      user_id: userId,
      company_name: form.company_name,
      industry: form.industry,
      location: form.location,
      website: form.website,
      description: form.description,
      logo_url: form.logo_url,
      updated_at: new Date().toISOString(),
    };
    // UPSERT - jangan pakai .update() doang, biar yang baru pertama isi nggak hilang
    // is_verified TIDAK ikut di-update dari sini, hanya admin yang bisa ubah
    const { error } = await supabase
      .from("company_profiles")
      .upsert(payload, { onConflict: "user_id" });
    if (error) setMsg("Gagal save: " + error.message);
    else setMsg("✅ Profil Company tersimpan! Refresh pun tetap ada.");
    setSaving(false);
  }

  function set(k: keyof Company, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  if (loading) return <div style={{ padding: 20, color: "#fff", background: "#060B24", minHeight: "100vh" }}>Loading Company...</div>;

  return (
    <div style={{ background: "#060B24", minHeight: "100vh", color: "#fff" }}>
      <header className="vn-top">
        <Link href="/" className="vn-brand">v<span>-nect</span><small>GLOBAL BUSINESS ECOSYSTEM</small></Link>
        <nav className="vn-nav">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/v-market">Market</Link>
          <Link href="/v-circle">Community</Link>
          <LanguageSwitcher />
        </nav>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
        <Link href="/dashboard" style={{ color: "#9CB0D9", fontSize: 13, textDecoration: "none" }}>← Kembali ke Dashboard</Link>
        <h1 style={{ fontSize: 26, margin: "12px 0 4px" }}>🏢 Company Profile</h1>
        <p style={{ color: "#9CB0D9", marginTop: 0 }}>Lengkapi profil bisnis kamu biar dipercaya buyer di V-Market.</p>

        {/* CARD PREVIEW + VERIFIED */}
        <div style={{ background: "#0E183A", border: "1px solid rgba(138,165,255,.25)", borderRadius: 16, padding: 16, display: "flex", gap: 14, alignItems: "center", margin: "16px 0" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, overflow: "hidden", flexShrink: 0 }}>
            {form.logo_url ? <img src={form.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🏢"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{form.company_name || "Nama Perusahaan Belum Diisi"}</div>
            <div style={{ fontSize: 13, color: "#9CB0D9" }}>{form.industry} • {form.location || "Lokasi belum diisi"}</div>
            <div style={{ marginTop: 6 }}>
              {form.is_verified ? (
                <span style={{ background: "#0CAA91", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800 }}>✓ VERIFIED</span>
              ) : (
                <span style={{ background: "#333", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>⏳ Belum Verified - Lengkapi profil & hubungi Admin</span>
              )}
            </div>
          </div>
        </div>

        {msg && <div style={{ background: msg.includes("Gagal") || msg.includes("Isi dulu") ? "#FE2C55" : "#0CAA91", padding: "12px 14px", borderRadius: 12, fontWeight: 700, margin: "12px 0" }}>{msg}</div>}

        <div className="vn-card" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Data Perusahaan</h2>
          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Nama Perusahaan *</label>
          <input className="vn-input" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="PT / CV / Brand kamu" style={{ margin: "6px 0 12px" }} />

          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Industry / Kategori</label>
          <select value={form.industry} onChange={(e) => set("industry", e.target.value)} style={{ width: "100%", background: "#1A1A1A", border: "1px solid #222", borderRadius: 12, padding: 12, color: "#fff", boxSizing: "border-box", margin: "6px 0 12px" }}>
            {INDUSTRIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>

          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Lokasi</label>
          <input className="vn-input" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Jakarta, Indonesia" style={{ margin: "6px 0 12px" }} />

          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Website / Instagram / Tokopedia</label>
          <input className="vn-input" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." style={{ margin: "6px 0 12px" }} />

          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Deskripsi Bisnis</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Jual apa? MOQ berapa? Bisa kirim ke mana aja?" rows={4} style={{ width: "100%", background: "#1A1A1A", border: "1px solid #222", borderRadius: 12, padding: 12, color: "#fff", boxSizing: "border-box", margin: "6px 0 12px" }} />

          <label style={{ fontSize: 12, color: "#9CB0D9" }}>Logo Perusahaan (URL)</label>
          <input className="vn-input" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://.../logo.jpg" style={{ margin: "6px 0 16px" }} />

          <button onClick={save} disabled={saving} className="vn-btn" style={{ width: "100%" }}>
            {saving ? "Menyimpan..." : "💾 Simpan Company Profile"}
          </button>
          <p style={{ fontSize: 12, color: "#9CB0D9", textAlign: "center" }}>Email login: {email} • Verified hanya bisa diubah Admin.</p>
        </div>
      </main>
    </div>
  );
}
