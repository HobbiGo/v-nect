"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState("Member v-nect");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      const meta: any = data.user.user_metadata || {};
      setName(meta.full_name || meta.name || data.user.email?.split("@")[0] || "Member v-nect");
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif" }}>
        <TopNav active="home" />
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <TopNav active="home" />
      <div style={{ margin: "16px 0", display: "flex", justifyContent: "flex-end" }}>
        <SignOutButton />
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Dashboard</h1>
      <p style={{ fontSize: 18 }}>Halo, {name} 👋</p>
      <p style={{ color: "#666" }}>Lihat aktivitas &amp; perkembangan bisnismu hari ini.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 20 }}>
        <div style={card}><b style={big}>12</b><div>Koneksi</div></div>
        <div style={card}><b style={big}>8</b><div>Meeting</div></div>
        <div style={card}><b style={big}>3</b><div>Pesan</div></div>
        <div style={card}><b style={big}>1.2k</b><div>Dilihat</div></div>
      </div>

      <h2 style={{ marginTop: 28 }}>Aksi Cepat</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <a href="/meet" style={card}>📹 V-Meet</a>
        <a href="/market" style={card}>🛒 V-Market</a>
        <a href="/circle" style={card}>👥 V-Circle</a>
        <a href="/company" style={card}>🏢 Company</a>
      </div>

      <h2 style={{ marginTop: 28 }}>Profil Saya</h2>
      <div style={card}>
        <p><b>{name}</b></p>
        <p style={{ color: "#666" }}>Member v-nect • Bekasi, Indonesia</p>
        <a href="/profile">Lihat Profil →</a>
      </div>
    </main>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 16,
  textDecoration: "none",
  color: "#111",
};

const big: React.CSSProperties = { fontSize: 28 };
