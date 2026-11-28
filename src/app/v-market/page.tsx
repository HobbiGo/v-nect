"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/client";

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function VMeetContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [room, setRoom] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("Johan");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const r = params.get("room");
    if (r) setRoom(r.toUpperCase());
    // Load user name
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Johan");
    });
    // History dari localStorage - biar meeting luar tetap terdata rapi di sini
    try {
      const h = JSON.parse(localStorage.getItem("vmeet-history") || "[]");
      setHistory(h);
    } catch {}
  }, [params]);

  function createRoom() {
    const code = makeCode();
    setRoom(code);
    setCopied(false);
    const entry = { code, createdAt: new Date().toLocaleString("en-US"), name };
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    try { localStorage.setItem("vmeet-history", JSON.stringify(next)); } catch {}
    router.push(`/v-meet?room=${code}`);
  }

  function joinByCode() {
    const c = joinCode.trim().toUpperCase();
    if (!c) { alert("Masukkan kode room dulu, contoh: KX7P2Q"); return; }
    setRoom(c);
    router.push(`/v-meet?room=${c}`);
  }

  function copyInvite() {
    const link = `${window.location.origin}/v-meet?room=${room}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inviteLink = room ? `${typeof window !== "undefined" ? window.location.origin : "https://voinnect.vercel.app"}/v-meet?room=${room}` : "";

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <TopNav active="meet" />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}><SignOutButton /></div>

      <h1 style={{ fontSize: 28, fontWeight: 800 }}>V-Meet</h1>
      <p style={{ color: "#666" }}>Buat room, share kode ke client / invited person, mereka klik link langsung masuk.</p>

      {!room ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          <div style={card}>
            <h2>Buat Room Baru</h2>
            <p style={{ color: "#666" }}>Kamu jadi host. Kode room dibuat otomatis, bisa di-share.</p>
            <button onClick={createRoom} style={primaryBtn}>+ Buat Room Baru</button>
          </div>
          <div style={card}>
            <h2>Join dengan Kode</h2>
            <p style={{ color: "#666" }}>Punya kode dari host? Masukkan di sini.</p>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Contoh: KX7P2Q" style={input} maxLength={6} />
            <button onClick={joinByCode} style={primaryBtn}>Join Room →</button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{ ...card, background: "#eef4ff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: "#666" }}>KODE ROOM — SHARE KE CLIENT</div>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4 }}>{room}</div>
                <div style={{ fontSize: 13, color: "#333", wordBreak: "break-all" }}>{inviteLink}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copyInvite} style={primaryBtn}>{copied ? "✓ Tersalin!" : "📋 Copy Link Invite"}</button>
                <button onClick={() => { setRoom(""); router.push("/v-meet"); }} style={ghostBtn}>Keluar Room</button>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#555", marginTop: 10 }}>Cara share: klik Copy Link Invite → kirim ke WhatsApp / Email client. Client klik link → langsung masuk room ini, tanpa daftar lagi.</p>
          </div>

          <div style={{ marginTop: 16, borderRadius: 16, overflow: "hidden", border: "1px solid #ddd" }}>
            <iframe
              src={`https://meet.jit.si/vnect-${room}`}
              style={{ width: "100%", height: 520, border: 0 }}
              allow="camera; microphone; fullscreen; display-capture"
              title={`V-Meet Room ${room}`}
            />
          </div>
          <p style={{ fontSize: 12, color: "#888" }}>Meeting berjalan di dalam V-Meet. Riwayat room tersimpan di bawah, biar tetap terdata di sini.</p>
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Riwayat Room Saya</h2>
      {history.length === 0 ? (
        <p style={{ color: "#888" }}>Belum ada room. Buat room pertama di atas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h: any, i: number) => (
            <div key={i} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><b>{h.code}</b> <span style={{ color: "#666", fontSize: 13 }}>• {h.createdAt} • Host: {h.name}</span></div>
              <button onClick={() => { setRoom(h.code); router.push(`/v-meet?room=${h.code}`); }} style={ghostBtn}>Masuk Lagi →</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function VMeetPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24 }}>Loading V-Meet...</main>}>
      <VMeetContent />
    </Suspense>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 20 };
const input: React.CSSProperties = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", fontSize: 18, letterSpacing: 4, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, boxSizing: "border-box" };
const primaryBtn: React.CSSProperties = { background: "#4B6BFF", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 700, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 12, padding: "12px 16px", fontWeight: 700, cursor: "pointer" };
