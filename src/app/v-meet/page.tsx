"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

const LANGS: { code: string; label: string; flag: string }[] = [
  { code: "id", label: "Indonesia", flag: "🇮🇩" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

const DEMO_SUBS: Record<string, string[]> = {
  id: ["Halo, selamat datang di v-meet.", "Kita bahas harga MOQ hari ini ya.", "Saya bisa kirim sample minggu depan."],
  en: ["Hello, welcome to v-meet.", "Let's discuss MOQ pricing today.", "I can send samples next week."],
  zh: ["你好，欢迎来到 v-meet。", "今天我们讨论 MOQ 价格。", "我下周可以寄样品。"],
  ja: ["こんにちは、v-meetへようこそ。", "今日はMOQ価格について話しましょう。", "来週サンプルを送れます。"],
  es: ["Hola, bienvenido a v-meet.", "Hoy hablamos del precio MOQ.", "Puedo enviar muestras la próxima semana."],
};

export default function VMeetPage() {
  const [supabase] = useState(() => createClient());
  const [lang, setLang] = useState<Lang>(getLang());
  const [meetLang, setMeetLang] = useState("id");
  const [isLive, setIsLive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [subIdx, setSubIdx] = useState(0);
  const [chat, setChat] = useState<{ who: string; text: string }[]>([
    { who: "David Chen", text: "Halo, suara saya jelas?" },
    { who: "Kamu", text: "Jelas! Kita mulai ya." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const h = (e: any) => { setLang(e.detail as Lang); setMeetLang(e.detail as string); };
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Kamu");
    });
  }, [supabase]);

  // Demo subtitle jalan - ganti tiap 4 detik pas Live
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => setSubIdx(i => (i + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, [isLive]);

  // Kamera lokal - preview aja
  useEffect(() => {
    if (!camOn) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false }).then(s => {
      stream = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    }).catch(() => {});
    return () => stream?.getTracks().forEach(tr => tr.stop());
  }, [camOn]);

  function sendChat() {
    if (!chatInput.trim()) return;
    setChat(c => [...c, { who: userName || "Kamu", text: chatInput }]);
    setChatInput("");
  }

  const subs = DEMO_SUBS[meetLang] || DEMO_SUBS["id"];

  return (
    <div className="meet">
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
          <Link href="/v-meet" className="nav-tab active">🎥 {t("meet", lang)}</Link>
        </nav>
        <div className="top-right">
          <LanguageSwitcher />
          {userName ? <span className="chip">● {userName}</span> : <Link href="/dashboard" className="btn-ghost">Sign In</Link>}
        </div>
      </header>

      <main className="meet-main">
        {/* HEADER - JELAS */}
        <div className="meet-head">
          <span className="eyebrow">LIVE MEETING • V-MEET</span>
          <h1>v-meet — {t("meet", lang)} + Live Translate</h1>
          <p>Meeting lintas negara, subtitle langsung diterjemahkan. Pilih bahasa di bawah, subtitle ikut ganti.</p>
        </div>

        {/* PILIH BAHASA MEET - BENDERA, JELAS */}
        <div className="lang-row">
          <b>🌐 Bahasa Subtitle:</b>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>setMeetLang(l.code)} className={meetLang===l.code ? "lang-btn active" : "lang-btn"}>{l.flag} {l.label}</button>
          ))}
        </div>

        {/* VIDEO + CHAT - 2 KOLOM, NGGAK KEPOTONG */}
        <div className="meet-grid">
          {/* VIDEO */}
          <div className="video-box">
            <div className="video-top">
              <span className={isLive ? "live-dot" : "live-dot off"}>{isLive ? "● LIVE" : "○ OFFLINE"}</span>
              <span className="room">Room: v-nect-demo • {userName || "Kamu"}</span>
            </div>
            <div className="video-area">
              {camOn ? <video ref={videoRef} autoPlay muted playsInline className="video" /> : <div className="cam-off">📷 Kamera Mati<br/><small>Nyalain kamera di bawah</small></div>}
              {/* SUBTITLE - DI DALAM VIDEO, JELAS */}
              {isLive && (
                <div className="subtitle">
                  <span className="sub-label">🌐 LIVE TRANSLATE • {LANGS.find(l=>l.code===meetLang)?.label}</span>
                  <p>{subs[subIdx]}</p>
                </div>
              )}
              {!isLive && <div className="video-overlay"><b>Siap Meeting?</b><p>Pencet ▶ Mulai Meeting di bawah untuk mulai.</p></div>}
              {/* PESERTA KECIL */}
              <div className="mini-participants">
                <span className="mini">👤 David</span>
                <span className="mini">👤 Ayu</span>
                <span className="mini">+2</span>
              </div>
            </div>
            {/* KONTROL - JELAS, 1 BARIS */}
            <div className="controls">
              <button onClick={()=>setIsLive(v=>!v)} className={isLive ? "ctl stop" : "ctl go"}>{isLive ? "⏹ Akhiri" : "▶ Mulai Meeting"}</button>
              <button onClick={()=>setMicOn(v=>!v)} className={micOn ? "ctl" : "ctl off"}>{micOn ? "🎤 Mic On" : "🔇 Mic Off"}</button>
              <button onClick={()=>setCamOn(v=>!v)} className={camOn ? "ctl" : "ctl off"}>{camOn ? "📷 Cam On" : "📷 Cam Off"}</button>
              <button onClick={()=>setHandRaised(v=>!v)} className={handRaised ? "ctl hand" : "ctl"}>{handRaised ? "✋ Turun Tangan" : "✋ Angkat Tangan"}</button>
            </div>
            {handRaised && <div className="hand-note">✋ Kamu angkat tangan — host akan lihat.</div>}
            {/* SUMMARY */}
            <div className="summary">
              <b>📝 Ringkasan Meeting (Auto)</b>
              <p>• Bahas MOQ & harga bertingkat<br/>• Sample dikirim minggu depan<br/>• Follow-up di Chat / RFQ Market</p>
              <Link href="/v-market" className="summary-link">🛒 Lanjut ke Market →</Link>
            </div>
          </div>

          {/* CHAT */}
          <div className="chat-box">
            <div className="chat-head"><b>💬 Chat Meeting</b><span>{chat.length} pesan</span></div>
            <div className="chat-list">
              {chat.map((c, i)=>(
                <div key={i} className={c.who===(userName || "Kamu") ? "chat-msg me" : "chat-msg"}>
                  <b>{c.who}</b><p>{c.text}</p>
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter" && sendChat()} placeholder="Ketik pesan... / Type message..." />
              <button onClick={sendChat} className="btn-send">Kirim →</button>
            </div>
            <p className="chat-note">💡 Chat ini demo lokal. Untuk 2 orang beneran (suara lawan bicara kedengeran), perlu WebRTC / Daily / Agora — bilang aja kalau mau aku pasangin.</p>
          </div>
        </div>
      </main>

      <footer className="footer"><b>v<span>-nect</span></b><p>Connect Beyond Boundaries.</p><small>© 2026 v-nect</small></footer>

      <nav className="bottom-nav">
        <Link href="/" className="bnav bnav-home">⌂<small>{lang==="id"?"Beranda":"Home"}</small></Link>
        <Link href="/v-market" className="bnav">🛒<small>{t("market", lang)}</small></Link>
        <Link href="/#feed" className="bnav plus">+<small></small></Link>
        <Link href="/v-circle?tab=messages" className="bnav">✉️<small>Kotak Masuk</small></Link>
        <Link href="/v-hub" className="bnav">●<small>Profil</small></Link>
      </nav>

      <style jsx>{`
        .meet{background:#060B24;color:#f3f7ff;min-height:100vh;font-family:var(--font-sans),Arial,sans-serif;padding-bottom:70px;overflow-x:hidden}
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
        .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.28);color:#eef3ff;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none}
        .meet-main{max-width:1100px;margin:0 auto;padding:24px 16px}
        .eyebrow{color:#79a6ff;font-size:10.5px;font-weight:800;letter-spacing:2.6px}
        .meet-head h1{margin:8px 0 6px;font-size:30px}.meet-head p{color:#a9b9da;font-size:13.5px;margin:0;line-height:1.6;max-width:680px}
        .lang-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:18px 0 14px;background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:14px;padding:12px}.lang-row b{font-size:13px}.lang-btn{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.25);color:#d9e4ff;padding:7px 14px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer}.lang-btn.active{background:#fff;color:#060b24;border-color:#fff}
        .meet-grid{display:grid;grid-template-columns:1.6fr 1fr;gap:14px;align-items:start}
        .video-box{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:12px}
        .video-top{display:flex;justify-content:space-between;align-items:center;gap:10px}.live-dot{background:#FE2C55;color:#fff;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:800}.live-dot.off{background:rgba(255,255,255,.1);color:#B4C6E7}.room{font-size:12px;color:#9CB0D9}
        .video-area{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden}.video{width:100%;height:100%;object-fit:cover;display:block}.cam-off{width:100%;height:100%;display:grid;place-items:center;align-content:center;text-align:center;font-size:16px}.cam-off small{font-size:12px;color:#9CB0D9}
        .subtitle{position:absolute;left:12px;right:12px;bottom:12px;background:rgba(0,0,0,.75);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 12px}.sub-label{font-size:10px;color:#25F4EE;font-weight:800}.subtitle p{margin:4px 0 0;font-size:14px;line-height:1.5}
        .video-overlay{position:absolute;inset:0;display:grid;place-items:center;align-content:center;text-align:center;background:rgba(0,0,0,.55);padding:16px}.video-overlay b{font-size:18px}.video-overlay p{font-size:13px;color:#C3D0EC}
        .mini-participants{position:absolute;top:10px;right:10px;display:flex;gap:6px}.mini{background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.25);padding:5px 10px;border-radius:999px;font-size:11px}
        .controls{display:flex;gap:8px;flex-wrap:wrap}.ctl{background:rgba(255,255,255,.08);border:1px solid rgba(154,178,255,.3);color:#fff;padding:10px 14px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer}.ctl.go{background:#0CAA91;border-color:#0CAA91}.ctl.stop{background:#FE2C55;border-color:#FE2C55}.ctl.off{background:rgba(254,44,85,.25);border-color:#FE2C55}.ctl.hand{background:#FBBF24;color:#000;border-color:#FBBF24}
        .hand-note{background:#2A2200;border:1px solid #FBBF24;border-radius:10px;padding:10px 12px;font-size:13px}
        .summary{background:#16224F;border:1px solid rgba(138,165,255,.2);border-radius:12px;padding:14px}.summary b{font-size:14px}.summary p{font-size:12.5px;color:#B4C6E7;line-height:1.7;margin:6px 0}.summary-link{color:#9EC0FF;text-decoration:none;font-size:12.5px;font-weight:700}
        .chat-box{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:420px}.chat-head{display:flex;justify-content:space-between;align-items:center}.chat-head span{font-size:11px;color:#9CB0D9}.chat-list{display:flex;flex-direction:column;gap:8px;flex:1;max-height:320px;overflow-y:auto}.chat-msg{background:#16224F;border-radius:12px;padding:10px}.chat-msg.me{background:#1A2A5A;border:1px solid rgba(138,165,255,.3)}.chat-msg b{font-size:12px}.chat-msg p{font-size:13px;margin:3px 0 0;line-height:1.5}.chat-input-row{display:flex;gap:8px}.chat-input-row input{flex:1;background:#060B24;border:1px solid rgba(138,165,255,.3);border-radius:10px;padding:10px;color:#fff;outline:none}.btn-send{background:#4B6BFF;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-size:12.5px;font-weight:750;cursor:pointer;white-space:nowrap}.chat-note{font-size:11.5px;color:#9CB0D9;line-height:1.5;margin:0}
        .footer{text-align:center;padding:28px;color:#96a8d0}.footer b{color:#fff;font-size:22px}
        .bottom-nav{display:none}
        @media(max-width:640px){
          .nav-desktop{display:none}.topnav{padding:10px 4%}.home-pill{padding:7px 12px;font-size:12.5px}.meet-main{padding:18px 12px}
          .meet-grid{grid-template-columns:1fr}.video-area{aspect-ratio:4/3}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#060B24;border-top:1px solid rgba(138,165,255,.2);justify-content:space-around;padding:8px 4px 12px}
          .bottom-nav a{color:#c8d7f5;text-decoration:none;display:flex;flex-direction:column;align-items:center;font-size:18px}.bottom-nav small{font-size:9px;margin-top:2px}.bottom-nav .plus{background:#4B6BFF;width:44px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-top:-18px}
          .bnav-home{color:#fff}.bnav-home small{color:#fff;font-weight:800}
        }
      `}</style>
    </div>
  );
}
