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

type Txt = {
  choose: string; hostBtn: string; guestBtn: string;
  createTitle: string; createDesc: string; customLabel: string; customHint: string; createBtn: string;
  joinTitle: string; joinDesc: string; joinBtn: string; joinHint: string;
  history: string; noHistory: string; rejoin: string;
  roomEnter: string; invited: string; joinMeet: string; exitRoom: string; copyLink: string; copied: string; back: string;
  enterCode: string; minCode: string; exCustom: string; exJoin: string;
  youGuest: string; hostLabel: string;
};

const TEXTS: Record<string, Txt> = {
  id: {
    choose: "Pilih dulu kamu Host atau Tamu, biar gak salah klik lagi.",
    hostBtn: "Saya Host — Buat Room", guestBtn: "Saya Tamu — Join Room",
    createTitle: "Buat Room Baru — Untuk Host",
    createDesc: "Kamu Host. Buat room, nanti dapat ID Room + Link Invite untuk di-share ke client.",
    customLabel: "Buat Nomor / ID Room Sendiri (opsional)",
    customHint: "Kosongkan kalau mau otomatis — nanti keluar ID acak kayak GDPYFZ.",
    createBtn: "+ Buat Room Baru",
    joinTitle: "Join Room — Untuk Tamu / Client",
    joinDesc: "Kamu Tamu. Masukkan ID Room dari Host, jangan buat room baru.",
    joinBtn: "Join Room →", joinHint: "Atau lebih gampang: klik link yang dikirim Host, langsung masuk tanpa ketik kode.",
    history: "Riwayat Room Saya", noHistory: "Belum ada room. Buat room pertama di atas.", rejoin: "Masuk Lagi →",
    roomEnter: "ID ROOM YANG KAMU MASUKI", invited: "Kamu diundang ke room ini. Klik Join untuk masuk, jangan buat room baru lagi.",
    joinMeet: "▶ Join VNECT MEET", exitRoom: "Keluar Room", copyLink: "📋 Copy Link Invite", copied: "✓ Link Tersalin!",
    back: "← Kembali ke Halaman Utama V-Meet", enterCode: "Masukkan ID Room dulu, contoh: KX7P2Q",
    minCode: "Kode sendiri minimal 4 karakter, contoh: JOHAN-01", exCustom: "Contoh: JOHAN-01 / RAPAT-123", exJoin: "Contoh: KX7P2Q",
    youGuest: "Kamu Tamu • Host:", hostLabel: "Host:"
  },
  en: {
    choose: "Choose first if you are Host or Guest, so you don't click the wrong one.",
    hostBtn: "I'm Host — Create Room", guestBtn: "I'm Guest — Join Room",
    createTitle: "Create New Room — For Host",
    createDesc: "You are Host. Create a room, you will get a Room ID + Invite Link to share with your client.",
    customLabel: "Create Your Own Room Number / ID (optional)",
    customHint: "Leave it empty for automatic — a random ID like GDPYFZ will appear.",
    createBtn: "+ Create New Room",
    joinTitle: "Join Room — For Guest / Client",
    joinDesc: "You are Guest. Enter the Room ID from Host, do not create a new room.",
    joinBtn: "Join Room →", joinHint: "Or easier: click the link sent by Host, you enter directly without typing a code.",
    history: "My Room History", noHistory: "No room yet. Create your first room above.", rejoin: "Re-enter →",
    roomEnter: "ROOM ID YOU ARE ENTERING", invited: "You are invited to this room. Click Join to enter, do not create a new room.",
    joinMeet: "▶ Join VNECT MEET", exitRoom: "Leave Room", copyLink: "📋 Copy Invite Link", copied: "✓ Link Copied!",
    back: "← Back to V-Meet Home", enterCode: "Enter Room ID first, e.g. KX7P2Q",
    minCode: "Custom code must be at least 4 characters, e.g. JOHAN-01", exCustom: "e.g. JOHAN-01 / MEETING-123", exJoin: "e.g. KX7P2Q",
    youGuest: "You are Guest • Host:", hostLabel: "Host:"
  },
  zh: {
    choose: "请先选择你是主持人还是嘉宾，以免点错。",
    hostBtn: "我是主持人 — 创建房间", guestBtn: "我是嘉宾 — 加入房间",
    createTitle: "创建新房间 — 主持人",
    createDesc: "你是主持人。创建一个房间，你将获得房间号 + 邀请链接，可分享给客户。",
    customLabel: "创建自己的房间号 / ID（可选）",
    customHint: "留空则自动生成 — 会出现像 GDPYFZ 这样的随机号。",
    createBtn: "+ 创建新房间",
    joinTitle: "加入房间 — 嘉宾 / 客户",
    joinDesc: "你是嘉宾。请输入主持人的房间号，不要创建新房间。",
    joinBtn: "加入房间 →", joinHint: "更简单：点击主持人发来的链接，直接进入，无需输入代码。",
    history: "我的房间记录", noHistory: "暂无房间。请在上面创建第一个房间。", rejoin: "再次进入 →",
    roomEnter: "你要进入的房间号", invited: "你被邀请到这个房间。点击加入进入，不要再创建新房间。",
    joinMeet: "▶ 加入 VNECT MEET", exitRoom: "离开房间", copyLink: "📋 复制邀请链接", copied: "✓ 链接已复制！",
    back: "← 返回 V-Meet 首页", enterCode: "请先输入房间号，例如 KX7P2Q",
    minCode: "自定义代码至少 4 个字符，例如 JOHAN-01", exCustom: "例如：JOHAN-01 / MEETING-123", exJoin: "例如：KX7P2Q",
    youGuest: "你是嘉宾 • 主持人：", hostLabel: "主持人："
  },
  ja: {
    choose: "まずホストかゲストか選んでください。間違えてクリックしないように。",
    hostBtn: "ホストです — ルーム作成", guestBtn: "ゲストです — ルーム参加",
    createTitle: "新しいルームを作成 — ホスト用",
    createDesc: "あなたはホストです。ルームを作成すると、ルームID + 招待リンクがもらえ、クライアントに共有できます。",
    customLabel: "自分のルーム番号 / ID を作る（任意）",
    customHint: "空欄なら自動 — GDPYFZ のようなランダムIDが出ます。",
    createBtn: "+ 新しいルームを作成",
    joinTitle: "ルームに参加 — ゲスト / クライアント用",
    joinDesc: "あなたはゲストです。ホストのルームIDを入力してください。新しく作らないでください。",
    joinBtn: "ルームに参加 →", joinHint: "もっと簡単：ホストから送られたリンクをクリックすれば、コード入力なしで直接入れます。",
    history: "マイ ルーム履歴", noHistory: "まだルームがありません。上で最初のルームを作ってください。", rejoin: "再入室 →",
    roomEnter: "入室するルームID", invited: "このルームに招待されています。参加をクリックして入ってください。新しく作らないでください。",
    joinMeet: "▶ VNECT MEET に参加", exitRoom: "ルームを出る", copyLink: "📋 招待リンクをコピー", copied: "✓ リンクをコピーしました！",
    back: "← V-Meet ホームに戻る", enterCode: "まずルームIDを入力してください。例：KX7P2Q",
    minCode: "カスタムコードは4文字以上。例：JOHAN-01", exCustom: "例：JOHAN-01 / MEETING-123", exJoin: "例：KX7P2Q",
    youGuest: "あなたはゲスト • ホスト：", hostLabel: "ホスト："
  },
  ko: {
    choose: "호스트인지 게스트인지 먼저 선택하세요. 잘못 클릭하지 않도록.",
    hostBtn: "호스트입니다 — 방 만들기", guestBtn: "게스트입니다 — 방 참여",
    createTitle: "새 방 만들기 — 호스트용",
    createDesc: "당신은 호스트입니다. 방을 만들면 방 ID + 초대 링크를 받아 클라이언트와 공유할 수 있습니다.",
    customLabel: "직접 방 번호 / ID 만들기 (선택)",
    customHint: "비워두면 자동 — GDPYFZ 같은 랜덤 ID가 나옵니다.",
    createBtn: "+ 새 방 만들기",
    joinTitle: "방 참여 — 게스트 / 클라이언트용",
    joinDesc: "당신은 게스트입니다. 호스트의 방 ID를 입력하세요. 새 방을 만들지 마세요.",
    joinBtn: "방 참여 →", joinHint: "더 쉬운 방법: 호스트가 보낸 링크를 클릭하면 코드 없이 바로 들어갑니다.",
    history: "내 방 기록", noHistory: "아직 방이 없습니다. 위에서 첫 방을 만드세요.", rejoin: "다시 들어가기 →",
    roomEnter: "입장할 방 ID", invited: "이 방에 초대되었습니다. 참여를 클릭해 들어가세요. 새 방을 만들지 마세요.",
    joinMeet: "▶ VNECT MEET 참여", exitRoom: "방 나가기", copyLink: "📋 초대 링크 복사", copied: "✓ 링크 복사됨!",
    back: "← V-Meet 홈으로 돌아가기", enterCode: "먼저 방 ID를 입력하세요. 예: KX7P2Q",
    minCode: "사용자 코드는 최소 4자. 예: JOHAN-01", exCustom: "예: JOHAN-01 / MEETING-123", exJoin: "예: KX7P2Q",
    youGuest: "당신은 게스트 • 호스트:", hostLabel: "호스트:"
  },
};

function getLangSafe(): string {
  try {
    const l = (localStorage.getItem("vnect-lang") || (window as any).__vnect_lang || "en") as string;
    if (TEXTS[l]) return l;
    const fromEvent = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    if (TEXTS[fromEvent]) return fromEvent;
    return "en";
  } catch { return "en"; }
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
  const [lang, setLang] = useState("en");
  const T = TEXTS[lang] || TEXTS.en;

  useEffect(() => {
    setLang(getLangSafe());
    const h = (e: any) => {
      const nl = (e.detail as string) || getLangSafe();
      if (TEXTS[nl]) setLang(nl);
    };
    window.addEventListener("vnect-lang-change", h);
    const iv = setInterval(() => {
      const nl = getLangSafe();
      setLang((prev) => (prev !== nl ? nl : prev));
    }, 1000);
    return () => { window.removeEventListener("vnect-lang-change", h); clearInterval(iv); };
  }, []);

  useEffect(() => {
    const r = params.get("room");
    if (r) { setRoom(r.toUpperCase()); setMode("guest"); setJoined(false); }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Johan");
    });
    try { setHistory(JSON.parse(localStorage.getItem("vmeet-history") || "[]")); } catch {}
  }, [params]);

  function createRoom() {
    let code = customCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (code) {
      if (code.length < 4) { alert(T.minCode); return; }
    } else {
      code = makeCode();
    }
    setRoom(code); setJoined(false); setCopied(false);
    const entry = { code, createdAt: new Date().toLocaleString("en-US"), name };
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    try { localStorage.setItem("vmeet-history", JSON.stringify(next)); } catch {}
    router.push(`/v-meet?room=${code}`);
  }

  function joinByCode() {
    const c = joinCode.trim().toUpperCase();
    if (!c) { alert(T.enterCode); return; }
    setRoom(c); setJoined(false);
    router.push(`/v-meet?room=${c}`);
  }

  function copyInvite() {
    const link = `${window.location.origin}/v-meet?room=${room}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const inviteLink = room ? `${typeof window !== "undefined" ? window.location.origin : "https://voinnect.vercel.app"}/v-meet?room=${room}` : "";

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <TopNav active="meet" />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}><SignOutButton /></div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>V-Meet</h1>

      {room ? (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "#060B24", borderRadius: "16px 16px 0 0", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🎥</span>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 20 }}>VNECT <span style={{ color: "#8AB4FF" }}>MEET</span></span>
              <span style={{ background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>● LIVE • Room {room}</span>
            </div>
            <span style={{ color: "#B4C6E7", fontSize: 12 }}>{T.youGuest} {name}</span>
          </div>
          <div style={{ background: "linear-gradient(135deg, #060B24 0%, #1A2A5A 50%, #4B6BFF 100%)", padding: 24, color: "#fff", borderRadius: "0 0 16px 16px" }}>
            <div style={{ fontSize: 13, color: "#D6E2FF" }}>{T.roomEnter}</div>
            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 4 }}>{room}</div>
            <p style={{ color: "#D6E2FF", fontSize: 14, margin: "8px 0" }}>{T.invited}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!joined ? (
                <button onClick={() => setJoined(true)} style={primaryBtnWhite}>{T.joinMeet}</button>
              ) : (
                <button onClick={() => { setRoom(""); setJoined(false); router.push("/v-meet"); }} style={ghostBtnWhite}>{T.exitRoom}</button>
              )}
              <button onClick={copyInvite} style={ghostBtnWhite}>{copied ? T.copied : T.copyLink}</button>
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
              <p style={{ color: "#666" }}>{T.createDesc}</p>
              <label style={{ fontSize: 13, fontWeight: 700 }}>{T.customLabel}</label>
              <input value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase())} placeholder={T.exCustom} style={{ ...input, fontSize: 15, letterSpacing: 1, marginTop: 6 }} maxLength={20} />
              <p style={{ fontSize: 12, color: "#888", marginTop: -6 }}>{T.customHint}</p>
              <button onClick={createRoom} style={primaryBtn}>{T.createBtn}</button>
            </div>
          ) : (
            <div style={{ ...card, marginTop: 16 }}>
              <h2>{T.joinTitle}</h2>
              <p style={{ color: "#666" }}>{T.joinDesc}</p>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder={T.exJoin} style={input} maxLength={20} />
              <button onClick={joinByCode} style={primaryBtn}>{T.joinBtn}</button>
              <p style={{ fontSize: 12, color: "#888" }}>{T.joinHint}</p>
            </div>
          )}
        </div>
      )}

      <h2 style={{ marginTop: 28 }}>{T.history}</h2>
      {history.length === 0 ? <p style={{ color: "#888" }}>{T.noHistory}</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h: any, i: number) => (
            <div key={i} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div><b>{h.code}</b> <span style={{ color: "#666", fontSize: 13 }}>• {h.createdAt} • {T.hostLabel} {h.name}</span></div>
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
const input: React.CSSProperties = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", fontSize: 15, fontWeight: 700, textTransform: "uppercase", marginBottom: 12, boxSizing: "border-box" };
const primaryBtn: React.CSSProperties = { background: "#4B6BFF", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 700, cursor: "pointer" };
const primaryBtnWhite: React.CSSProperties = { background: "#fff", color: "#060B24", border: "none", borderRadius: 999, padding: "14px 28px", fontWeight: 900, fontSize: 15, cursor: "pointer" };
const ghostBtn: React.CSSProperties = { background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 12, padding: "12px 16px", fontWeight: 700, cursor: "pointer" };
const ghostBtnWhite: React.CSSProperties = { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.5)", borderRadius: 999, padding: "12px 18px", fontWeight: 700, cursor: "pointer" };
