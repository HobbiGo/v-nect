"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/client";
import { getLang, type Lang } from "@/lib/i18n";

const VMEET_TEXT: Record<string, any> = {
  id: { title: "V-Meet", choose: "{T.choose}", hostBtn: "{T.hostBtn}", guestBtn: "{T.guestBtn}", createTitle: "{T.createTitle}", createDesc: "{T.createDesc} // ID Room + Link Invite untuk di-share ke client.", customLabel: "{T.customLabel}", customHint: "{T.customHint}", createBtn: "{T.createBtn}", joinTitle: "{T.joinTitle}", joinDesc: "Kamu Tamu. Masukkan ID Room dari Host, jangan buat room baru.", joinBtn: "{T.joinBtn}", joinHint: "Atau lebih gampang: klik link yang dikirim Host, langsung masuk tanpa ketik kode.", history: "{T.history}", noHistory: "{T.noHistory}", rejoin: "{T.rejoin}", youGuest: "Kamu Tamu • Host:", youHost: "Host:", roomYouEnter: "ID ROOM YANG KAMU MASUKI", invited: "{T.invited}", joinMeet: "{T.joinMeet}", exit: "{T.exit}", copy: "{T.copy}", copied: "{T.copied}", back: "{T.back}", enterCode: "Masukkan ID Room dulu, contoh: KX7P2Q", minCode: "Kode sendiri minimal 4 karakter, contoh: JOHAN-01", exampleCustom: "Contoh: JOHAN-01 / RAPAT-123", exampleJoin: "Contoh: KX7P2Q" },
  en: { title: "V-Meet", choose: "Choose first if you are Host or Guest, so you don\u2019t click the wrong one.", hostBtn: "I\u2019m Host — Create Room", guestBtn: "I\u2019m Guest — Join Room", createTitle: "Create New Room — For Host", createDesc: "You are Host. Create a room, you will get a Room ID + Invite Link to share with your client.", customLabel: "Create Your Own Room Number / ID (optional)", customHint: "Leave it empty for automatic — a random ID like GDPYFZ will appear.", createBtn: "+ Create New Room", joinTitle: "Join Room — For Guest / Client", joinDesc: "You are Guest. Enter the Room ID from Host, do not create a new room.", joinBtn: "{T.joinBtn}", joinHint: "Or easier: click the link sent by Host, you enter directly without typing a code.", history: "My Room History", noHistory: "No room yet. Create your first room above.", rejoin: "Re-enter →", youGuest: "You are Guest • Host:", youHost: "Host:", roomYouEnter: "ROOM ID YOU ARE ENTERING", invited: "You are invited to this room. Click Join to enter, do not create a new room.", joinMeet: "{T.joinMeet}", exit: "Leave Room", copy: "📋 Copy Invite Link", copied: "✓ Link Copied!", back: "← Back to V-Meet Home", enterCode: "Enter Room ID first, e.g. KX7P2Q", minCode: "Custom code must be at least 4 characters, e.g. JOHAN-01", exampleCustom: "e.g. JOHAN-01 / MEETING-123", exampleJoin: "e.g. KX7P2Q" },
  zh: { title: "V-Meet", choose: "请先选择你是主持人还是嘉宾，以免点错。", hostBtn: "我是主持人 — 创建房间", guestBtn: "我是嘉宾 — 加入房间", createTitle: "创建新房间 — 主持人", createDesc: "你是主持人。创建一个房间，你将获得房间号 + 邀请链接，可分享给客户。", customLabel: "创建自己的房间号 / ID（可选）", customHint: "留空则自动生成 — 会出现像 GDPYFZ 这样的随机号。", createBtn: "+ 创建新房间", joinTitle: "加入房间 — 嘉宾 / 客户", joinDesc: "你是嘉宾。请输入主持人的房间号，不要创建新房间。", joinBtn: "加入房间 →", joinHint: "更简单：点击主持人发来的链接，直接进入，无需输入代码。", history: "我的房间记录", noHistory: "暂无房间。请在上面创建第一个房间。", rejoin: "再次进入 →", youGuest: "你是嘉宾 • 主持人：", youHost: "主持人：", roomYouEnter: "你要进入的房间号", invited: "你被邀请到这个房间。点击加入进入，不要再创建新房间。", joinMeet: "▶ 加入 VNECT MEET", exit: "离开房间", copy: "📋 复制邀请链接", copied: "✓ 链接已复制！", back: "← 返回 V-Meet 首页", enterCode: "请先输入房间号，例如 KX7P2Q", minCode: "自定义代码至少 4 个字符，例如 JOHAN-01", exampleCustom: "例如：JOHAN-01 / MEETING-123", exampleJoin: "例如：KX7P2Q" },
  ja: { title: "V-Meet", choose: "まずホストかゲストか選んでください。間違えてクリックしないように。", hostBtn: "ホストです — ルーム作成", guestBtn: "ゲストです — ルーム参加", createTitle: "新しいルームを作成 — ホスト用", createDesc: "あなたはホストです。ルームを作成すると、ルームID + 招待リンクがもらえ、クライアントに共有できます。", customLabel: "自分のルーム番号 / ID を作る（任意）", customHint: "空欄なら自動 — GDPYFZ のようなランダムIDが出ます。", createBtn: "+ 新しいルームを作成", joinTitle: "ルームに参加 — ゲスト / クライアント用", joinDesc: "あなたはゲストです。ホストのルームIDを入力してください。新しく作らないでください。", joinBtn: "ルームに参加 →", joinHint: "もっと簡単：ホストから送られたリンクをクリックすれば、コード入力なしで直接入れます。", history: "マイ ルーム履歴", noHistory: "まだルームがありません。上で最初のルームを作ってください。", rejoin: "再入室 →", youGuest: "あなたはゲスト • ホスト：", youHost: "ホスト：", roomYouEnter: "入室するルームID", invited: "このルームに招待されています。参加をクリックして入ってください。新しく作らないでください。", joinMeet: "▶ VNECT MEET に参加", exit: "ルームを出る", copy: "📋 招待リンクをコピー", copied: "✓ リンクをコピーしました！", back: "← V-Meet ホームに戻る", enterCode: "まずルームIDを入力してください。例：KX7P2Q", minCode: "カスタムコードは4文字以上。例：JOHAN-01", exampleCustom: "例：JOHAN-01 / MEETING-123", exampleJoin: "例：KX7P2Q" },
};

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
  const [lang, setLang] = useState<Lang>(getLang());
  const T = VMEET_TEXT[lang] || VMEET_TEXT.en;
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

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
            <p style={{ color: "#D6E2FF", fontSize: 14, margin: "8px 0" }}>{T.invited}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!joined ? (
                <button onClick={() => setJoined(true)} style={primaryBtnWhite}>{T.joinMeet}</button>
              ) : (
                <button onClick={() => { setRoom(""); setJoined(false); router.push("/v-meet"); }} style={ghostBtnWhite}>{T.exit}</button>
              )}
              <button onClick={copyInvite} style={ghostBtnWhite}>{copied ? "{T.copied}" : "{T.copy}"}</button>
            </div>
            <p style={{ fontSize: 12, color: "#9CB0D9", marginTop: 10, wordBreak: "break-all" }}>{inviteLink}</p>
          </div>
          {joined && (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #ddd", marginTop: 16 }}>
              <iframe src={`https://meet.jit.si/vnect-${room}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfigOverwrite.SHOW_JITSI_WATERMARK=false`} style={{ width: "100%", height: 520, border: 0, display: "block" }} allow="camera; microphone; fullscreen; display-capture" title={`VNECT MEET Room ${room}`} />
            </div>
          )}
          <button onClick={() => { setRoom(""); setJoined(false); router.push("/v-meet"); }} style={{ ...ghostBtn, marginTop: 12 }}>{T.back}</button>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <p style={{ color: "#666" }}>{T.choose}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setMode("host")} style={mode === "host" ? primaryBtn : ghostBtn}>{T.hostBtn}</button>
            <button onClick={() => setMode("guest")} style={mode === "guest" ? primaryBtn : ghostBtn}>{T.guestBtn}</button>
          </div>

          {mode === "host" ? (
            <div style={{ ...card, marginTop: 16 }}>
              <h2>{T.createTitle}</h2>
              <p style={{ color: "#666" }}>{T.createDesc} // <b>ID Room</b> + Link Invite untuk di-share ke client.</p>
              <label style={{ fontSize: 13, fontWeight: 700 }}>{T.customLabel}</label>
              <input value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase())} placeholder="Contoh: JOHAN-01 / RAPAT-123" style={{ ...input, fontSize: 15, letterSpacing: 1, marginTop: 6 }} maxLength={20} />
              <p style={{ fontSize: 12, color: "#888", marginTop: -6 }}>{T.customHint}</p>
              <button onClick={createRoom} style={primaryBtn}>{T.createBtn}</button>
            </div>
          ) : (
            <div style={{ ...card, marginTop: 16 }}>
              <h2>{T.joinTitle}</h2>
              <p style={{ color: "#666" }}>Kamu Tamu. Masukkan ID Room dari Host, <b>jangan buat room baru</b>.</p>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Contoh: KX7P2Q" style={input} maxLength={20} />
              <button onClick={joinByCode} style={primaryBtn}>{T.joinBtn}</button>
              <p style={{ fontSize: 12, color: "#888" }}>Atau lebih gampang: klik link yang dikirim Host, langsung masuk tanpa ketik kode.</p>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>{T.history}</h2>
      {history.length === 0 ? <p style={{ color: "#888" }}>{T.noHistory}</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h: any, i: number) => (
            <div key={i} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div><b>{h.code}</b> <span style={{ color: "#666", fontSize: 13 }}>• {h.createdAt} • Host: {h.name}</span></div>
              <button onClick={() => { setRoom(h.code); setJoined(false); router.push(`/v-meet?room=${h.code}`); }} style={ghostBtn}>{T.rejoin}</button>
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
