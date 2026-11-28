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
  const [customCode, setCustomCode] = useState("");
  const [name, setName] = useState("Johan");
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState<"host" | "guest">("host");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const r = params.get("room");
    if (r) {
      setRoom(r.toUpperCase());
      setMode("guest");
      setJoined(false);
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Johan");
    });
    try {
      const h = JSON.parse(localStorage.getItem("vmeet-history") || "[]");
      setHistory(h);
    } catch {}
  }, [params]);

  function createRoom() {
    let code = customCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (code) {
      if (code.length < 4) { alert("Kode sendiri minimal 4 karakter, contoh: JOHAN-01"); return; }
    } else {
      code = makeCode();
    }
    setRoom(code);
    setJoined(false);
    setCopied(false);
    const entry = { code, createdAt: new Date().toLocaleString("en-US"), name };
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    try { localStorage.setItem("vmeet-history", JSON.stringify(next)); } catch {}
    router.push(`/v-meet?room=${code}`);
  }

  function joinByCode() {
    const c = joinCode.trim().toUpperCase();
    if (!c) { alert("Masukkan ID Room dulu, contoh: KX7P2Q"); return; }
    setRoom(c);
    setJoined(false);
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

      {/* JIKA ADA ROOM DI LINK = TAMU, JANGAN TUNJUKIN BUAT ROOM LAGI */}
      {room ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "#060B24", borderRadius: "16px 16px 0 0", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🎥</span>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>VNECT <span style={{ color: "#8AB4FF" }}>MEET</span></span>
              <span style={{ background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>● LIVE • Room {room}</span>
            </div>
            <span style={{ color: "#B4C6E7", fontSize: 12 }}>Kamu Tamu • Host: {name}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #060B24 0%, #1A2A5A 50%, #4B6BFF 100%)", padding: 24, color: "#fff", borderRadius: "0 0 16px 16px" }}>
            <div style={{ fontSize: 13, color: "#D6E2FF" }}>ID ROOM YANG KAMU MASUKI</div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4 }}>{room}</div>
            <p style={{ color: "#D6E2FF", fontSize: 14, margin: "8px 0" }}>Kamu diundang ke room ini. Klik Join untuk masuk, jangan buat room baru lagi.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!joined ? (
                <button onClick={() => setJoined(true)} style={primaryBtnWhite}>▶ Join VNECT MEET</button>
              ) : (
                <button onClick={() => { setRoom(""); setJoined(false); router.push("/v-meet"); }} style={ghostBtnWhite}>Keluar Room</button>
              )}
              <button onClick={copyInvite} style={ghostBtnWhite}>{copied ? "✓ Link Tersalin!" : "📋 Copy Link Invite"}</button>
            </div>
            <p style={{ fontSize: 12, color: "#9CB0D9", marginTop: 10, wordBreak: "break-all" }}>{inviteLink}</p>
          </div>
          {joined && (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #ddd", marginTop: 16 }}>
              <iframe src={`https://meet.jit.si/vnect-${room}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfigOverwrite.SHOW_JITSI_WATERMARK=false`} style={{ width: "100%", height: 520, border: 0, display: "block" }} allow="camera; microphone; fullscreen; display-capture" title={`VNECT MEET Room ${room}`} />
            </div>
          )}
          <button onClick={() => { setRoom(""); setJoined(false); router.push("/v-meet"); }} style={{ ...ghostBtn, marginTop: 12 }}>← Kembali ke Halaman Utama V-Meet</button>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: "#666" }}>Pilih dulu kamu Host atau Tamu, biar gak salah klik lagi.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setMode("host")} style={mode === "host" ? primaryBtn : ghostBtn}>Saya Host — Buat Room</button>
            <button onClick={() => setMode("guest")} style={mode === "guest" ? primaryBtn : ghostBtn}>Saya Tamu — Join Room</button>
          </div>

          {mode === "host" ? (
            <div style={{ ...card, marginTop: 16 }}>
              <h2>Buat Room Baru — Untuk Host</h2>
              <p style={{ color: "#666" }}>Kamu Host. Buat room, nanti dapat <b>ID Room</b> + Link Invite untuk di-share ke client.</p>
              <label style={{ fontSize: 13, fontWeight: 700 }}>Buat Nomor / ID Room Sendiri (opsional)</label>
              <input value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase())} placeholder="Contoh: JOHAN-01 / RAPAT-123" style={{ ...input, fontSize: 15, letterSpacing: 1, marginTop: 6 }} maxLength={20} />
              <p style={{ fontSize: 12, color: "#888", marginTop: -6 }}>Kosongkan kalau mau otomatis — nanti keluar ID acak kayak GDPYFZ.</p>
              <button onClick={createRoom} style={primaryBtn}>+ Buat Room Baru</button>
            </div>
          ) : (
            <div style={{ ...card, marginTop: 16 }}>
              <h2>Join Room — Untuk Tamu / Client</h2>
              <p style={{ color: "#666" }}>Kamu Tamu. Masukkan ID Room dari Host, <b>jangan buat room baru</b>.</p>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Contoh: KX7P2Q" style={input} maxLength={20} />
              <button onClick={joinByCode} style={primaryBtn}>Join Room →</button>
              <p style={{ fontSize: 12, color: "#888" }}>Atau lebih gampang: klik link yang dikirim Host, langsung masuk tanpa ketik kode.</p>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>Riwayat Room Saya</h2>
      {history.length === 0 ? <p style={{ color: "#888" }}>Belum ada room. Buat room pertama di atas.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h: any, i: number) => (
            <div key={i} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div><b>{h.code}</b> <span style={{ color: "#666", fontSize: 13 }}>• {h.createdAt} • Host: {h.name}</span></div>
              <button onClick={() => { setRoom(h.code); setJoined(false); router.push(`/v-meet?room=${h.code}`); }} style={ghostBtn}>Masuk Lagi →</button>
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
const primaryBtnWhite: React.CSSProperties = { background: "#fff", color: "#060B24", border: "none", borderRadius: 999, padding: "14px 28px", fontWeight: 900, fontSize: 15, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 12, padding: "12px 16px", fontWeight: 700, cursor: "pointer" };
const ghostBtnWhite: React.CSSProperties = { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.5)", borderRadius: 999, padding: "12px 18px", fontWeight: 700, cursor: "pointer" };
