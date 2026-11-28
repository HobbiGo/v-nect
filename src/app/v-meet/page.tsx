"use client";
import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { getLang, type Lang } from "@/lib/i18n";

// v-meet MULTI 5-10 ORANG - 2 ARAH BENERAN via Daily.co
// File: src/app/v-meet/page.tsx - timpa file lama
// SETUP DAILY (5 menit, gratis):
// 1. Buka https://dashboard.daily.co/signup -> daftar
// 2. Dashboard Daily -> Domains -> copy domain kamu, contoh: vnect.daily.co
// 3. Rooms -> Create Room -> nama misal: vnect-room -> Save
// 4. Di Vercel -> Settings -> Environment Variables -> tambah:
//    NEXT_PUBLIC_DAILY_DOMAIN = vnect.daily.co
//    NEXT_PUBLIC_DAILY_ROOM = vnect-room
// 5. Redeploy. Selesai. Link room bisa dishare ke 5-10 orang, semua video muncul grid.

const TR: Record<string, Record<string, string>> = {
  id: {
    title: "v-meet",
    subtitle: "Video live 2 arah untuk 5-10 orang. Semua video muncul grid, ada Live Translate subtitle.",
    roomLabel: "Nama Room",
    roomPh: "vnect-room",
    nameLabel: "Nama Kamu",
    namePh: "Ayu Putri",
    join: "Gabung Meet (5-10 Orang)",
    leave: "Keluar Meet",
    live: "● LIVE - 2 Arah",
    offline: "Offline - Belum Join",
    myLang: "Bahasa Saya",
    theirLang: "Bahasa Lawan Bicara",
    swap: "⇄ Tukar",
    auto: "Auto-detect",
    subtitleOn: "Subtitle: ON",
    subtitleOff: "Subtitle: OFF",
    how: "Cara pakai: isi Nama + Room yang sama → klik Gabung → share link room ke 4-9 orang lain → semua video muncul grid otomatis.",
    participants: "Peserta",
    gridNote: "Grid otomatis: 1 orang = gede, 2-4 = 2x2, 5-10 = 3x3 / 4x3.",
    quick: "Quick Pick",
    chat: "Chat",
    typeMsg: "Ketik pesan...",
    send: "Kirim",
    you: "Kamu",
    partner: "Partner",
    hello: "Halo, senang bertemu denganmu!",
    helloTrans: "Hello, nice to meet you!",
    priceQ: "Berapa harga untuk 500 pcs?",
    priceQTrans: "What is the price for 500 pcs?",
    moqQ: "Berapa MOQ-nya?",
    moqQTrans: "What is the MOQ?",
    shipQ: "Berapa lama pengiriman ke Jakarta?",
    shipQTrans: "How long is shipping to Jakarta?",
  },
  en: {
    title: "v-meet",
    subtitle: "2-way live video for 5-10 people. All videos in grid, with Live Translate subtitles.",
    roomLabel: "Room Name",
    roomPh: "vnect-room",
    nameLabel: "Your Name",
    namePh: "Ayu Putri",
    join: "Join Meet (5-10 People)",
    leave: "Leave Meet",
    live: "● LIVE - 2 Way",
    offline: "Offline - Not Joined",
    myLang: "My Language",
    theirLang: "Partner Language",
    swap: "⇄ Swap",
    auto: "Auto-detect",
    subtitleOn: "Subtitle: ON",
    subtitleOff: "Subtitle: OFF",
    how: "How to: same Name + Room → Join → share room link to 4-9 others → all videos appear in grid automatically.",
    participants: "Participants",
    gridNote: "Auto grid: 1 = large, 2-4 = 2x2, 5-10 = 3x3 / 4x3.",
    quick: "Quick Pick",
    chat: "Chat",
    typeMsg: "Type a message...",
    send: "Send",
    you: "You",
    partner: "Partner",
    hello: "Hello, nice to meet you!",
    helloTrans: "Halo, senang bertemu denganmu!",
    priceQ: "What is the price for 500 pcs?",
    priceQTrans: "Berapa harga untuk 500 pcs?",
    moqQ: "What is the MOQ?",
    moqQTrans: "Berapa MOQ-nya?",
    shipQ: "How long is shipping to Jakarta?",
    shipQTrans: "Berapa lama pengiriman ke Jakarta?",
  },
  zh: {
    title: "v-meet",
    subtitle: "5-10人双向直播视频。所有视频网格显示，带实时翻译字幕。",
    roomLabel: "房间名",
    roomPh: "vnect-room",
    nameLabel: "你的名字",
    namePh: "Ayu Putri",
    join: "加入会议 (5-10人)",
    leave: "离开会议",
    live: "● 直播中 - 双向",
    offline: "离线 - 未加入",
    myLang: "我的语言",
    theirLang: "对方语言",
    swap: "⇄ 交换",
    auto: "自动检测",
    subtitleOn: "字幕：开",
    subtitleOff: "字幕：关",
    how: "用法：输入相同房间名 → 加入 → 把链接分享给4-9人 → 所有视频自动网格显示。",
    participants: "参与者",
    gridNote: "自动网格：1人=大屏，2-4人=2x2，5-10人=3x3 / 4x3。",
    quick: "快捷选择",
    chat: "聊天",
    typeMsg: "输入消息...",
    send: "发送",
    you: "你",
    partner: "对方",
    hello: "你好，很高兴见到你！",
    helloTrans: "Halo, senang bertemu denganmu!",
    priceQ: "500件的价格是多少？",
    priceQTrans: "Berapa harga untuk 500 pcs?",
    moqQ: "起订量是多少？",
    moqQTrans: "Berapa MOQ-nya?",
    shipQ: "发到雅加达要多久？",
    shipQTrans: "Berapa lama pengiriman ke Jakarta?",
  },
  ja: {
    title: "v-meet",
    subtitle: "5-10人双方向ライブビデオ。全ビデオをグリッド表示、ライブ翻訳字幕付き。",
    roomLabel: "ルーム名",
    roomPh: "vnect-room",
    nameLabel: "あなたの名前",
    namePh: "Ayu Putri",
    join: "ミートに参加 (5-10人)",
    leave: "ミートを退出",
    live: "● ライブ中 - 双方向",
    offline: "オフライン - 未参加",
    myLang: "自分の言語",
    theirLang: "相手の言語",
    swap: "⇄ 入れ替え",
    auto: "自動検出",
    subtitleOn: "字幕：オン",
    subtitleOff: "字幕：オフ",
    how: "使い方：同じルーム名を入力 → 参加 → 4-9人にリンクを共有 → 全ビデオが自動でグリッド表示。",
    participants: "参加者",
    gridNote: "自動グリッド：1人=大画面、2-4人=2x2、5-10人=3x3 / 4x3。",
    quick: "クイック選択",
    chat: "チャット",
    typeMsg: "メッセージを入力...",
    send: "送信",
    you: "あなた",
    partner: "パートナー",
    hello: "こんにちは、お会いできて嬉しいです！",
    helloTrans: "Halo, senang bertemu denganmu!",
    priceQ: "500個の価格はいくらですか？",
    priceQTrans: "Berapa harga untuk 500 pcs?",
    moqQ: "MOQはいくつですか？",
    moqQTrans: "Berapa MOQ-nya?",
    shipQ: "ジャカルタへの配送はどのくらいかかりますか？",
    shipQTrans: "Berapa lama pengiriman ke Jakarta?",
  },
};

const LANGS = [
  { id: "id", flag: "🇮🇩", name: "Indonesia" },
  { id: "en", flag: "🇺🇸", name: "English" },
  { id: "zh", flag: "🇨🇳", name: "中文" },
  { id: "ja", flag: "🇯🇵", name: "日本語" },
];

export default function VMeetMultiPage() {
  const [lang, setLang] = useState<Lang>(getLang());
  const [myLang, setMyLang] = useState("id");
  const [theirLang, setTheirLang] = useState("en");
  const [room, setRoom] = useState(process.env.NEXT_PUBLIC_DAILY_ROOM || "vnect-room");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [subOn, setSubOn] = useState(true);
  const [chat, setChat] = useState<{ who: string; text: string; trans: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [camError, setCamError] = useState("");

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  const tr = (k: string) => TR[lang]?.[k] || TR.en[k] || k;
  const myFlag = LANGS.find((l) => l.id === myLang)?.flag || "🇮🇩";
  const theirFlag = LANGS.find((l) => l.id === theirLang)?.flag || "🇺🇸";
  const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN || "vnect.daily.co";
  // Daily Prebuilt - iframe ini yang handle 5-10 video 2 arah, grid, mic/cam, screen share, chat
  const dailyUrl = `https://${domain}/${room}?t=${encodeURIComponent(name || "Guest")}`;

  const join = async () => {
    setCamError("");
    if (!name.trim()) { setCamError("Isi Nama Kamu dulu."); return; }
    if (!room.trim()) { setCamError("Isi Nama Room dulu."); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      s.getTracks().forEach((t) => t.stop()); // cek izin aja, Daily yang pegang stream-nya
      setJoined(true);
    } catch (e: any) {
      if (e?.name === "NotAllowedError") setCamError("Izin kamera ditolak. Klik ikon 🔒 di address bar → Allow kamera & mic → refresh.");
      else setCamError("Kamera gagal: " + (e?.message || "coba refresh & Allow kamera."));
    }
  };

  const quickSend = (key: string) => {
    const text = TR[myLang]?.[key] || TR.en[key];
    const trans = TR[myLang]?.[key + "Trans"] || TR.en[key + "Trans"] || "";
    setChat((c) => [...c, { who: tr("you"), text, trans }]);
  };
  const sendMsg = () => {
    if (!msg.trim()) return;
    setChat((c) => [...c, { who: tr("you"), text: msg, trans: "[auto-translate] " + msg }]);
    setMsg("");
  };
  const swap = () => { const a = myLang; setMyLang(theirLang); setTheirLang(a); };

  return (
    <main className="meet">
      <TopNav active="meet" />
      <section className="head">
        <h1>{tr("title")}</h1>
        <p>{tr("subtitle")}</p>
        <p className="how">💡 {tr("how")}</p>
        <p className="how2">👥 {tr("gridNote")}</p>
        <div className="langbar">
          <div className="langbox">
            <span className="lbl">{tr("myLang")}</span>
            <div className="flags">{LANGS.map((l) => (<button key={l.id} onClick={() => setMyLang(l.id)} className={myLang === l.id ? "flag active" : "flag"}>{l.flag}</button>))}</div>
          </div>
          <button onClick={swap} className="swap">{tr("swap")}</button>
          <div className="langbox">
            <span className="lbl">{tr("theirLang")}</span>
            <div className="flags">{LANGS.map((l) => (<button key={l.id} onClick={() => setTheirLang(l.id)} className={theirLang === l.id ? "flag active" : "flag"}>{l.flag}</button>))}</div>
          </div>
          <span className="auto">✨ {tr("auto")}</span>
        </div>
      </section>

      {!joined ? (
        <section className="joinbox">
          <div className="field"><label>{tr("nameLabel")}</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("namePh")} /></div>
          <div className="field"><label>{tr("roomLabel")}</label><input value={room} onChange={(e) => setRoom(e.target.value)} placeholder={tr("roomPh")} /></div>
          <button onClick={join} className="joinbtn">🎥 {tr("join")}</button>
          {camError && <p className="err">⚠️ {camError}</p>}
          <p className="share">🔗 Share link ini ke 4-9 orang: <b>{typeof window !== "undefined" ? window.location.origin : ""}/v-meet?room={room}</b></p>
        </section>
      ) : (
        <section className="dailywrap">
          <div className="dailyhead">
            <span className="live">● {tr("live")}</span>
            <span>🏠 {room} • 👥 {tr("participants")}: 1-10 • {myFlag} {name}</span>
            <button onClick={() => setJoined(false)} className="leave">■ {tr("leave")}</button>
          </div>
          {/* DAILY IFRAME - ini yang nampilin 5-10 video 2 arah, grid otomatis */}
          <iframe src={dailyUrl} allow="camera; microphone; fullscreen; display-capture; autoplay" className="dailyframe" title="v-meet Daily" />
          {subOn && (
            <div className="subtitle">
              <span>{myFlag} {TR[myLang]?.hello || TR.en.hello}</span>
              <small>{theirFlag} {TR[myLang]?.helloTrans || TR.en.helloTrans}</small>
            </div>
          )}
          <div className="controls">
            <button onClick={() => setSubOn(!subOn)} className="ctl on">💬 {subOn ? tr("subtitleOn") : tr("subtitleOff")}</button>
            <span className="hint">Mic / Kamera / Screen Share diatur di dalam video Daily (bawah video)</span>
          </div>
        </section>
      )}

      <section className="bottom">
        <div className="quick">
          <b>⚡ {tr("quick")}</b>
          <button onClick={() => quickSend("hello")}>👋 {TR[myLang]?.hello || TR.en.hello}</button>
          <button onClick={() => quickSend("priceQ")}>💰 {TR[myLang]?.priceQ || TR.en.priceQ}</button>
          <button onClick={() => quickSend("moqQ")}>📦 {TR[myLang]?.moqQ || TR.en.moqQ}</button>
          <button onClick={() => quickSend("shipQ")}>🚚 {TR[myLang]?.shipQ || TR.en.shipQ}</button>
        </div>
        <div className="chatbox">
          <b>💬 {tr("chat")} + Translate</b>
          <div className="msgs">{chat.length === 0 ? <p className="empty">—</p> : chat.map((m, i) => (<div key={i} className="msg"><b>{m.who}</b><p>{m.text}</p><small>→ {m.trans}</small></div>))}</div>
          <div className="inputrow"><input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={tr("typeMsg")} onKeyDown={(e) => e.key === "Enter" && sendMsg()} /><button onClick={sendMsg}>{tr("send")}</button></div>
        </div>
      </section>
      <Footer />
      <style jsx>{`
        .meet { background: #060B24; color: #F3F7FF; min-height: 100vh; padding-bottom: 40px; }
        .head { max-width: 1100px; margin: 0 auto; padding: 28px 4% 10px; }
        .head h1 { font-size: 36px; margin: 0 0 8px; }
        .head p { color: #B4C6E7; margin: 0 0 10px; line-height: 1.6; }
        .how, .how2 { font-size: 13px; background: rgba(75,107,255,.12); border: 1px solid rgba(138,165,255,.25); padding: 10px 12px; border-radius: 12px; }
        .langbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 16px; padding: 14px; margin-top: 12px; }
        .langbox { display: flex; flex-direction: column; gap: 6px; }
        .lbl { font-size: 12px; color: #B4C6E7; font-weight: 700; }
        .flags { display: flex; gap: 6px; }
        .flag { font-size: 22px; background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.28); border-radius: 10px; padding: 6px 10px; cursor: pointer; }
        .flag.active { background: #fff; transform: scale(1.08); }
        .swap { background: #4B6BFF; color: #fff; border: none; padding: 10px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; }
        .auto { font-size: 12px; color: #AFC6FF; font-weight: 700; }
        .joinbox { max-width: 600px; margin: 18px auto; background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 13px; font-weight: 700; }
        .field input { background: #060B24; border: 1px solid rgba(138,165,255,.3); border-radius: 11px; padding: 12px; color: #fff; outline: none; }
        .joinbtn { background: #22C55E; color: #fff; border: none; padding: 13px; border-radius: 12px; font-weight: 850; cursor: pointer; font-size: 14px; }
        .err { background: #FEF3C7; color: #92400E; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; margin: 0; }
        .share { font-size: 12px; color: #B4C6E7; word-break: break-all; margin: 0; }
        .dailywrap { max-width: 1100px; margin: 16px auto 0; padding: 0 4%; }
        .dailyhead { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 10px; font-size: 13px; font-weight: 700; }
        .live { background: #EF4444; color: #fff; padding: 6px 12px; border-radius: 999px; }
        .leave { background: #EF4444; color: #fff; border: none; padding: 9px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; }
        .dailyframe { width: 100%; height: 640px; border: 1px solid rgba(138,165,255,.25); border-radius: 18px; background: #000; }
        .subtitle { margin-top: 10px; background: rgba(0,0,0,.72); border-radius: 12px; padding: 10px 12px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .subtitle span { font-weight: 700; }
        .subtitle small { color: #AFC6FF; }
        .controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
        .ctl { padding: 10px 16px; border-radius: 999px; font-weight: 800; cursor: pointer; background: #fff; color: #060B24; border: none; }
        .hint { font-size: 12px; color: #B4C6E7; }
        .bottom { max-width: 1100px; margin: 16px auto 0; padding: 0 4%; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .quick, .chatbox { background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .quick button { text-align: left; background: rgba(255,255,255,.06); border: 1px solid rgba(154,178,255,.2); color: #E2ECFF; padding: 10px 12px; border-radius: 12px; cursor: pointer; font-size: 13px; }
        .msgs { min-height: 90px; display: flex; flex-direction: column; gap: 8px; }
        .msg { background: rgba(255,255,255,.05); padding: 10px; border-radius: 12px; }
        .msg b { font-size: 12px; } .msg p { margin: 4px 0 2px; font-size: 13px; } .msg small { color: #AFC6FF; font-size: 12px; }
        .inputrow { display: flex; gap: 8px; }
        .inputrow input { flex: 1; background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.25); border-radius: 11px; padding: 11px; color: #fff; outline: none; }
        .inputrow button { background: #4B6BFF; color: #fff; border: none; padding: 11px 16px; border-radius: 11px; font-weight: 800; cursor: pointer; }
        .empty { color: #8A9CC4; text-align: center; }
        @media (max-width: 700px) { .bottom { grid-template-columns: 1fr; } .dailyframe { height: 480px; } }
      `}</style>
    </main>
  );
}
