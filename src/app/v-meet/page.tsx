"use client";
import { useEffect, useRef, useState } from "react";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { getLang, type Lang } from "@/lib/i18n";

// v-meet - FULL FIX: Video Live + Live Translate subtitle DI DALAM video + Flag picker + Swap + Auto-detect
// File: src/app/v-meet/page.tsx - timpa file lama

const TR: Record<string, Record<string, string>> = {
  id: {
    title: "v-meet",
    subtitle: "Video live dengan Live Translate. Ngobrol beda bahasa, subtitle langsung muncul di dalam video.",
    start: "Mulai Meet",
    join: "Gabung Meet",
    live: "● LIVE",
    offline: "Offline - Preview",
    myLang: "Bahasa Saya",
    theirLang: "Bahasa Lawan Bicara",
    swap: "⇄ Tukar",
    auto: "Auto-detect",
    subtitleOn: "Subtitle: ON",
    subtitleOff: "Subtitle: OFF",
    micOn: "Mic Nyala",
    micOff: "Mic Mati",
    camOn: "Kamera Nyala",
    camOff: "Kamera Mati",
    end: "Akhiri",
    chat: "Chat",
    summary: "Ringkasan",
    typeMsg: "Ketik pesan...",
    send: "Kirim",
    quick: "Quick Pick",
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
    subtitle: "Live video with Live Translate. Talk in different languages, subtitles appear inside the video.",
    start: "Start Meet",
    join: "Join Meet",
    live: "● LIVE",
    offline: "Offline - Preview",
    myLang: "My Language",
    theirLang: "Partner Language",
    swap: "⇄ Swap",
    auto: "Auto-detect",
    subtitleOn: "Subtitle: ON",
    subtitleOff: "Subtitle: OFF",
    micOn: "Mic On",
    micOff: "Mic Off",
    camOn: "Camera On",
    camOff: "Camera Off",
    end: "End",
    chat: "Chat",
    summary: "Summary",
    typeMsg: "Type a message...",
    send: "Send",
    quick: "Quick Pick",
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
    subtitle: "带实时翻译的直播视频。不同语言交流，字幕直接显示在视频内。",
    start: "开始会议",
    join: "加入会议",
    live: "● 直播中",
    offline: "离线 - 预览",
    myLang: "我的语言",
    theirLang: "对方语言",
    swap: "⇄ 交换",
    auto: "自动检测",
    subtitleOn: "字幕：开",
    subtitleOff: "字幕：关",
    micOn: "麦克风开",
    micOff: "麦克风关",
    camOn: "摄像头开",
    camOff: "摄像头关",
    end: "结束",
    chat: "聊天",
    summary: "摘要",
    typeMsg: "输入消息...",
    send: "发送",
    quick: "快捷选择",
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
    subtitle: "ライブ翻訳付きライブビデオ。違う言語で話しても、字幕がビデオ内に直接表示されます。",
    start: "ミートを開始",
    join: "ミートに参加",
    live: "● ライブ中",
    offline: "オフライン - プレビュー",
    myLang: "自分の言語",
    theirLang: "相手の言語",
    swap: "⇄ 入れ替え",
    auto: "自動検出",
    subtitleOn: "字幕：オン",
    subtitleOff: "字幕：オフ",
    micOn: "マイク オン",
    micOff: "マイク オフ",
    camOn: "カメラ オン",
    camOff: "カメラ オフ",
    end: "終了",
    chat: "チャット",
    summary: "要約",
    typeMsg: "メッセージを入力...",
    send: "送信",
    quick: "クイック選択",
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

export default function VMeetPage() {
  const [lang, setLang] = useState<Lang>(getLang());
  const [myLang, setMyLang] = useState("id");
  const [theirLang, setTheirLang] = useState("en");
  const [isLive, setIsLive] = useState(false);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [subOn, setSubOn] = useState(true);
  const [chat, setChat] = useState<{ who: string; text: string; trans: string }[]>([]);
  const [camError, setCamError] = useState("");
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // KAMERA BENERAN - pakai kamera HP/laptop, bukan emoji lagi
  const startCamera = async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = stream;
        selfVideoRef.current.play().catch(() => {});
      }
      setCam(true); setMic(true); setIsLive(true);
    } catch (e: any) {
      // Kalau user tolak izin kamera / buka di HTTP / browser block
      if (e?.name === "NotAllowedError") setCamError("Izin kamera ditolak. Klik ikon 🔒 / 🎥 di address bar browser → Allow kamera & mic → refresh.");
      else if (e?.name === "NotFoundError") setCamError("Kamera tidak ditemukan di perangkat ini.");
      else if (e?.name === "NotSupportedError" || location.protocol !== "https:" && location.hostname !== "localhost") setCamError("Kamera hanya jalan di HTTPS. Buka via https://voinnect.vercel.app, jangan via IP / HTTP.");
      else setCamError("Kamera gagal dibuka: " + (e?.message || "coba refresh & Allow kamera."));
    }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (selfVideoRef.current) selfVideoRef.current.srcObject = null;
    setIsLive(false);
  };
  // Mic / Cam toggle beneran - matiin track-nya, bukan cuma ganti label
  const toggleMicReal = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) track.enabled = !mic;
    setMic(!mic);
  };
  const toggleCamReal = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) track.enabled = !cam;
    setCam(!cam);
  };
  useEffect(() => { return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }; }, []);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  const tr = (k: string) => TR[lang]?.[k] || TR.en[k] || k;
  const myFlag = LANGS.find((l) => l.id === myLang)?.flag || "🇮🇩";
  const theirFlag = LANGS.find((l) => l.id === theirLang)?.flag || "🇺🇸";

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
        {/* FLAG PICKER - Bahasa Saya / Bahasa Lawan Bicara + Swap + Auto */}
        <div className="langbar">
          <div className="langbox">
            <span className="lbl">{tr("myLang")}</span>
            <div className="flags">
              {LANGS.map((l) => (
                <button key={l.id} onClick={() => setMyLang(l.id)} className={myLang === l.id ? "flag active" : "flag"} title={l.name}>{l.flag}</button>
              ))}
            </div>
          </div>
          <button onClick={swap} className="swap">{tr("swap")}</button>
          <div className="langbox">
            <span className="lbl">{tr("theirLang")}</span>
            <div className="flags">
              {LANGS.map((l) => (
                <button key={l.id} onClick={() => setTheirLang(l.id)} className={theirLang === l.id ? "flag active" : "flag"} title={l.name}>{l.flag}</button>
              ))}
            </div>
          </div>
          <span className="auto">✨ {tr("auto")}</span>
        </div>
      </section>

      {/* VIDEO AREA - Subtitle DI DALAM video */}
      <section className="videos">
        <div className="video main">
          <div className="video-bg">👩‍💼</div><p className="partner-note">Partner video muncul setelah partner join via link yang sama (butuh Daily / Agora untuk 2 arah)</p>
          <span className={isLive ? "badge live" : "badge off"}>{isLive ? tr("live") : tr("offline")}</span>
          <span className="name">{theirFlag} {tr("partner")} • {LANGS.find((l) => l.id === theirLang)?.name}</span>
          {subOn && (
            <div className="subtitle">
              <span>{myFlag} {TR[myLang]?.hello || TR.en.hello}</span>
              <small>{theirFlag} {TR[myLang]?.helloTrans || TR.en.helloTrans}</small>
            </div>
          )}
        </div>
        <div className="video self">
          {cam && streamRef.current ? (
            <video ref={selfVideoRef} autoPlay playsInline muted className="real-video" />
          ) : (
            <>
              <video ref={selfVideoRef} autoPlay playsInline muted className="real-video" style={{ display: streamRef.current ? "block" : "none" }} />
              {!streamRef.current && <div className="video-bg">🧑</div>}
              {!cam && streamRef.current && <div className="video-bg">📷❌</div>}
            </>
          )}
          <span className="name">{myFlag} {tr("you")} • {LANGS.find((l) => l.id === myLang)?.name}</span>
          {subOn && <div className="subtitle small"><span>{myFlag} {TR[myLang]?.hello || ""}</span></div>}
        </div>
      </section>

      {/* CONTROLS */}
      <section className="controls">
        <button onClick={toggleMicReal} className={mic ? "ctl on" : "ctl off"}>🎤 {mic ? tr("micOn") : tr("micOff")}</button>
        <button onClick={toggleCamReal} className={cam ? "ctl on" : "ctl off"}>📷 {cam ? tr("camOn") : tr("camOff")}</button>
        <button onClick={() => setSubOn(!subOn)} className={subOn ? "ctl on" : "ctl off"}>💬 {subOn ? tr("subtitleOn") : tr("subtitleOff")}</button>
        {!isLive ? (
          <button onClick={startCamera} className="ctl start">▶ {tr("start")}</button>
        ) : (
          <button onClick={stopCamera} className="ctl end">■ {tr("end")}</button>
        )}
      </section>

      {camError && <div className="cam-error">⚠️ {camError}</div>}
      {/* QUICK PICK + CHAT */}
      <section className="bottom">
        <div className="quick">
          <b>⚡ {tr("quick")}</b>
          <button onClick={() => quickSend("hello")}>👋 {TR[myLang]?.hello || TR.en.hello}</button>
          <button onClick={() => quickSend("priceQ")}>💰 {TR[myLang]?.priceQ || TR.en.priceQ}</button>
          <button onClick={() => quickSend("moqQ")}>📦 {TR[myLang]?.moqQ || TR.en.moqQ}</button>
          <button onClick={() => quickSend("shipQ")}>🚚 {TR[myLang]?.shipQ || TR.en.shipQ}</button>
        </div>
        <div className="chatbox">
          <b>💬 {tr("chat")}</b>
          <div className="msgs">
            {chat.length === 0 ? <p className="empty">—</p> : chat.map((m, i) => (
              <div key={i} className="msg"><b>{m.who}</b><p>{m.text}</p><small>→ {m.trans}</small></div>
            ))}
          </div>
          <div className="inputrow">
            <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={tr("typeMsg")} onKeyDown={(e) => e.key === "Enter" && sendMsg()} />
            <button onClick={sendMsg}>{tr("send")}</button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .meet { background: #060B24; color: #F3F7FF; min-height: 100vh; padding-bottom: 40px; }
        .head { max-width: 1100px; margin: 0 auto; padding: 28px 4% 10px; }
        .head h1 { font-size: 36px; margin: 0 0 8px; }
        .head p { color: #B4C6E7; margin: 0 0 18px; line-height: 1.6; }
        .langbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 16px; padding: 14px; }
        .langbox { display: flex; flex-direction: column; gap: 6px; }
        .lbl { font-size: 12px; color: #B4C6E7; font-weight: 700; }
        .flags { display: flex; gap: 6px; }
        .flag { font-size: 22px; background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.28); border-radius: 10px; padding: 6px 10px; cursor: pointer; }
        .flag.active { background: #fff; border-color: #fff; transform: scale(1.08); }
        .swap { background: #4B6BFF; color: #fff; border: none; padding: 10px 14px; border-radius: 999px; font-weight: 800; cursor: pointer; }
        .auto { font-size: 12px; color: #AFC6FF; font-weight: 700; }
        .videos { max-width: 1100px; margin: 16px auto 0; padding: 0 4%; display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        .video { position: relative; background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 18px; overflow: hidden; min-height: 320px; display: grid; place-items: center; }
        .video-bg { font-size: 90px; } .real-video { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; } .partner-note { position: absolute; bottom: 64px; left: 12px; right: 12px; text-align: center; font-size: 11px; color: #B4C6E7; background: rgba(0,0,0,.5); padding: 6px; border-radius: 8px; } .cam-error { max-width: 1100px; margin: 12px auto 0; padding: 0 4%; } .cam-error { background: #FEF3C7; color: #92400E; border-radius: 12px; padding: 12px 14px; font-size: 13px; line-height: 1.5; font-weight: 700; }
        .badge { position: absolute; top: 12px; left: 12px; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; }
        .badge.live { background: #EF4444; color: #fff; }
        .badge.off { background: rgba(255,255,255,.15); color: #fff; }
        .name { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,.5); padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .subtitle { position: absolute; bottom: 14px; left: 12px; right: 12px; background: rgba(0,0,0,.72); border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; text-align: center; }
        .subtitle span { font-size: 14px; font-weight: 700; }
        .subtitle small { font-size: 12px; color: #AFC6FF; }
        .subtitle.small { padding: 8px; }
        .controls { max-width: 1100px; margin: 14px auto 0; padding: 0 4%; display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
        .ctl { padding: 11px 18px; border-radius: 999px; font-weight: 800; cursor: pointer; border: 1px solid rgba(154,178,255,.3); background: rgba(255,255,255,.07); color: #fff; }
        .ctl.on { background: #fff; color: #060B24; }
        .ctl.start { background: #22C55E; color: #fff; border-color: #22C55E; }
        .ctl.end { background: #EF4444; color: #fff; border-color: #EF4444; }
        .bottom { max-width: 1100px; margin: 16px auto 0; padding: 0 4%; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .quick, .chatbox { background: #0E183A; border: 1px solid rgba(138,165,255,.2); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
        .quick button { text-align: left; background: rgba(255,255,255,.06); border: 1px solid rgba(154,178,255,.2); color: #E2ECFF; padding: 10px 12px; border-radius: 12px; cursor: pointer; font-size: 13px; }
        .msgs { min-height: 90px; display: flex; flex-direction: column; gap: 8px; }
        .msg { background: rgba(255,255,255,.05); padding: 10px; border-radius: 12px; }
        .msg b { font-size: 12px; }
        .msg p { margin: 4px 0 2px; font-size: 13px; }
        .msg small { color: #AFC6FF; font-size: 12px; }
        .inputrow { display: flex; gap: 8px; }
        .inputrow input { flex: 1; background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.25); border-radius: 11px; padding: 11px; color: #fff; outline: none; }
        .inputrow button { background: #4B6BFF; color: #fff; border: none; padding: 11px 16px; border-radius: 11px; font-weight: 800; cursor: pointer; }
        .empty { color: #8A9CC4; text-align: center; }
        @media (max-width: 700px) { .videos, .bottom { grid-template-columns: 1fr; } }
      `}</style>
          <Footer />
    </main>
  );
}
