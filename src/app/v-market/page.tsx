"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

type Product = {
  id: string; name: string; price: number; price2: number; price3: number;
  moq: number; unit: string; supplier: string; country: string; verified: boolean;
  category: string; img: string; rating: number; sold: number;
};

const CATS = ["Semua", "Fashion", "Elektronik", "Makanan", "Kecantikan", "Rumah", "Otomotif"];

const DEMO: Product[] = [
  { id: "p1", name: "Kemeja Linen Premium Export", price: 85000, price2: 78000, price3: 69000, moq: 100, unit: "pcs", supplier: "PT Sinar Fashion Jaya", country: "Indonesia", verified: true, category: "Fashion", img: "👔", rating: 4.9, sold: 1240 },
  { id: "p2", name: "TWS Earbuds Bluetooth 5.3 OEM", price: 125000, price2: 110000, price3: 95000, moq: 500, unit: "pcs", supplier: "Shenzhen Tech Co.", country: "China", verified: true, category: "Elektronik", img: "🎧", rating: 4.8, sold: 8600 },
  { id: "p3", name: "Kopi Arabika Gayo 1kg - Green Bean", price: 145000, price2: 135000, price3: 120000, moq: 50, unit: "kg", supplier: "Koperasi Gayo Aceh", country: "Indonesia", verified: true, category: "Makanan", img: "☕", rating: 5.0, sold: 3200 },
  { id: "p4", name: "Serum Vitamin C 30ml - Private Label", price: 45000, price2: 39000, price3: 34000, moq: 1000, unit: "pcs", supplier: "PT Kosmetik Nusantara", country: "Indonesia", verified: false, category: "Kecantikan", img: "🧴", rating: 4.7, sold: 5400 },
  { id: "p5", name: "Lampu LED Smart Home WiFi", price: 98000, price2: 88000, price3: 76000, moq: 200, unit: "pcs", supplier: "Guangzhou Light Factory", country: "China", verified: true, category: "Rumah", img: "💡", rating: 4.8, sold: 2100 },
  { id: "p6", name: "Sarung Tangan Motor Kulit Asli", price: 175000, price2: 160000, price3: 145000, moq: 100, unit: "pasang", supplier: "CV Kulit Garut", country: "Indonesia", verified: true, category: "Otomotif", img: "🧤", rating: 4.9, sold: 980 },
];

function fmt(n: number) { return "Rp " + n.toLocaleString("id-ID"); }

export default function VMarketPage() {
  const [supabase] = useState(() => createClient());
  const [lang, setLang] = useState<Lang>(getLang());
  const [cat, setCat] = useState("Semua");
  const [search, setSearch] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [rfqOpen, setRfqOpen] = useState<string | null>(null);
  const [rfqMsg, setRfqMsg] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserName(data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Member");
    });
  }, [supabase]);

  const list = DEMO.filter(p =>
    (cat === "Semua" || p.category === cat) &&
    (!onlyVerified || p.verified) &&
    (p.name + p.supplier + p.country).toLowerCase().includes(search.toLowerCase())
  );

  function sendRfq(p: Product) {
    setRfqMsg(`✅ RFQ terkirim ke ${p.supplier} untuk "${p.name}". Supplier akan balas di Kotak Masuk.`);
    setRfqOpen(null);
  }

  return (
    <div className="mk">
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
          <Link href="/v-market" className="nav-tab active">🛒 {t("market", lang)}</Link>
          <Link href="/v-meet" className="nav-link">🎥 {t("meet", lang)}</Link>
        </nav>
        <div className="top-right">
          <LanguageSwitcher />
          {userName ? <span className="chip">● {userName}</span> : <Link href="/dashboard" className="btn-ghost">Sign In</Link>}
        </div>
      </header>

      <main className="mk-main">
        {/* HEADER - JELAS, NGGAK GRADASI */}
        <div className="mk-head">
          <span className="eyebrow">MARKETPLACE • B2B • V-MARKET</span>
          <h1>v-market — {t("market", lang)}</h1>
          <p>Cari supplier, bandingin harga pabrik, nego MOQ — kayak Alibaba, tapi di dalam v-nect.</p>
        </div>

        {/* SEARCH + FILTER - 1 BARIS JELAS */}
        <input className="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cari produk, supplier, negara... contoh: kopi, earbuds, fashion" />
        <div className="cats">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={cat===c ? "cat active" : "cat"}>{c}</button>
          ))}
          <button onClick={()=>setOnlyVerified(v=>!v)} className={onlyVerified ? "cat verified-on" : "cat"}>{onlyVerified ? "✓ Hanya Verified" : "✓ Verified saja"}</button>
        </div>

        {rfqMsg && <div className="msg ok">{rfqMsg}</div>}

        {/* INFO HARGA BERTINGKAT - JELAS DI ATAS */}
        <div className="tier-info">
          <div><b>💰 Harga Bertingkat</b><p>Makin banyak beli, makin murah. Lihat 3 harga di tiap kartu.</p></div>
          <div><b>📦 MOQ</b><p>Minimum order. Bisa nego lewat RFQ.</p></div>
          <div><b>✓ Verified</b><p>Supplier terverifikasi v-nect, lebih aman.</p></div>
        </div>

        {/* GRID PRODUK - SOLID NAVY, NGGAK KEPOTONG */}
        {list.length===0 ? (
          <div className="empty"><div className="empty-logo">🛒</div><h3>Nggak ketemu.</h3><p>Coba kata lain atau matiin filter Verified.</p></div>
        ) : (
          <div className="grid">
            {list.map(p=>(
              <article key={p.id} className="prod">
                <div className="prod-img">{p.img}<span className="prod-cat">{p.category}</span></div>
                <div className="prod-body">
                  <h3>{p.name}</h3>
                  <div className="supplier-row">
                    <span className="supplier">{p.supplier}</span>
                    {p.verified && <span className="verified">✓ Verified</span>}
                  </div>
                  <span className="country">📍 {p.country} • ⭐ {p.rating} • Terjual {p.sold.toLocaleString()}</span>
                  {/* HARGA BERTINGKAT - JELAS */}
                  <div className="tiers">
                    <div><span>MOQ {p.moq} {p.unit}</span><b>{fmt(p.price)}</b></div>
                    <div><span>≥ {p.moq*2} {p.unit}</span><b>{fmt(p.price2)}</b></div>
                    <div className="best"><span>≥ {p.moq*5} {p.unit}</span><b>{fmt(p.price3)}</b><small>BEST</small></div>
                  </div>
                  <div className="prod-actions">
                    <button onClick={()=>setRfqOpen(rfqOpen===p.id ? null : p.id)} className="btn-rfq">📩 Minta Penawaran (RFQ)</button>
                    <button onClick={()=>setSaved(s=>s.includes(p.id) ? s.filter(x=>x!==p.id) : [...s, p.id])} className={saved.includes(p.id) ? "btn-save saved" : "btn-save"}>{saved.includes(p.id) ? "★ Tersimpan" : "☆ Simpan"}</button>
                  </div>
                  {rfqOpen===p.id && (
                    <div className="rfq-box">
                      <b>RFQ ke {p.supplier}</b>
                      <p>Mau pesan berapa {p.unit}? Supplier akan balas harga + ongkir di Kotak Masuk.</p>
                      <div className="rfq-row">
                        <input defaultValue={String(p.moq)} type="number" />
                        <span>{p.unit}</span>
                        <button onClick={()=>sendRfq(p)} className="btn-send">Kirim RFQ →</button>
                      </div>
                    </div>
                  )}
                  <Link href="/v-circle" className="chat-link">💬 Chat Supplier →</Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* SUPPLIER CTA */}
        <div className="supplier-cta">
          <div><h2>Punya produk? Jadi Supplier di v-market.</h2><p>Buka Storefront, upload produk, terima RFQ dari buyer global.</p></div>
          <Link href="/company" className="btn-white">🏢 Buka Storefront →</Link>
        </div>
      </main>

      <footer className="footer"><b>v<span>-nect</span></b><p>Connect Beyond Boundaries.</p><small>© 2026 v-nect</small></footer>

      <nav className="bottom-nav">
        <Link href="/" className="bnav bnav-home">⌂<small>{lang==="id"?"Beranda":"Home"}</small></Link>
        <Link href="/v-market" className="bnav active">🛒<small>{t("market", lang)}</small></Link>
        <Link href="/#feed" className="bnav plus">+<small></small></Link>
        <Link href="/v-circle?tab=messages" className="bnav">✉️<small>Kotak Masuk</small></Link>
        <Link href="/v-hub" className="bnav">●<small>Profil</small></Link>
      </nav>

      <style jsx>{`
        .mk{background:#060B24;color:#f3f7ff;min-height:100vh;font-family:var(--font-sans),Arial,sans-serif;padding-bottom:70px;overflow-x:hidden}
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
        .mk-main{max-width:1100px;margin:0 auto;padding:24px 16px}
        .eyebrow{color:#79a6ff;font-size:10.5px;font-weight:800;letter-spacing:2.6px}
        .mk-head h1{margin:8px 0 6px;font-size:30px}.mk-head p{color:#a9b9da;font-size:13.5px;margin:0;line-height:1.6;max-width:640px}
        .search{width:100%;box-sizing:border-box;background:#0E183A;border:1px solid rgba(138,165,255,.25);border-radius:12px;padding:12px 14px;color:#fff;font-size:14px;margin:18px 0 12px;outline:none}.search::placeholder{color:#8A9DC2}
        .cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .cat{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.25);color:#d9e4ff;padding:8px 16px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer}.cat.active{background:#fff;color:#060b24;border-color:#fff}.cat.verified-on{background:#0CAA91;color:#fff;border-color:#0CAA91}
        .msg{padding:12px 14px;border-radius:12px;font-weight:700;margin-bottom:12px}.msg.ok{background:#0CAA91}
        .tier-info{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.tier-info div{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:14px;padding:14px}.tier-info b{font-size:14px}.tier-info p{font-size:12.5px;color:#B4C6E7;margin:4px 0 0;line-height:1.5}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .prod{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
        .prod-img{height:130px;background:#16224F;display:grid;place-items:center;font-size:56px;position:relative}.prod-cat{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.5);padding:4px 10px;border-radius:999px;font-size:11px}
        .prod-body{padding:14px;display:flex;flex-direction:column;gap:6px;min-width:0}.prod-body h3{margin:0;font-size:15px;line-height:1.4}
        .supplier-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.supplier{font-size:12.5px;color:#C8D7F5}.verified{background:#0CAA91;color:#fff;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:800}.country{font-size:11.5px;color:#9CB0D9}
        .tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.tiers div{background:#060B24;border:1px solid rgba(138,165,255,.2);border-radius:10px;padding:8px 6px;display:flex;flex-direction:column;text-align:center;min-width:0}.tiers span{font-size:10.5px;color:#9CB0D9}.tiers b{font-size:12.5px;color:#fff}.tiers .best{border-color:#0CAA91;background:#0A2E2A}.tiers .best small{font-size:9px;color:#25F4EE;font-weight:800}
        .prod-actions{display:flex;gap:8px}.btn-rfq{flex:1;background:#4B6BFF;color:#fff;border:none;padding:10px 8px;border-radius:10px;font-size:12.5px;font-weight:750;cursor:pointer}.btn-save{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.3);color:#fff;padding:10px 10px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap}.btn-save.saved{color:#FBBF24;border-color:#FBBF24}
        .rfq-box{background:#16224F;border:1px solid rgba(138,165,255,.25);border-radius:12px;padding:12px}.rfq-box b{font-size:13px}.rfq-box p{font-size:12px;color:#B4C6E7;margin:4px 0 8px;line-height:1.5}.rfq-row{display:flex;gap:6px;align-items:center}.rfq-row input{width:70px;background:#060B24;border:1px solid rgba(138,165,255,.3);border-radius:8px;padding:8px;color:#fff}.rfq-row span{font-size:12px}.btn-send{background:#0CAA91;color:#fff;border:none;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:750;cursor:pointer;flex:1}
        .chat-link{color:#9EC0FF;text-decoration:none;font-size:12.5px;font-weight:700;text-align:center;margin-top:2px}
        .empty{padding:40px 20px;text-align:center;background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:18px;color:#a9b9da}.empty-logo{font-size:26px;font-weight:850;color:#8ab4ff}.empty h3{color:#fff;margin:10px 0 4px}.empty p{margin:0;font-size:13.5px}
        .supplier-cta{background:#0E183A;border:1px solid #4B6BFF;border-radius:18px;padding:20px;margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:16px}.supplier-cta h2{margin:0 0 4px;font-size:19px}.supplier-cta p{margin:0;color:#B4C6E7;font-size:13px}.btn-white{background:#fff;color:#060B24;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:800;text-decoration:none;white-space:nowrap}
        .footer{text-align:center;padding:28px;color:#96a8d0}.footer b{color:#fff;font-size:22px}
        .bottom-nav{display:none}
        @media(max-width:640px){
          .nav-desktop{display:none}.topnav{padding:10px 4%}.home-pill{padding:7px 12px;font-size:12.5px}.mk-main{padding:18px 12px}
          .tier-info{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr;gap:10px}.prod-img{height:100px;font-size:40px}.prod-body{padding:12px}.prod-body h3{font-size:13.5px}.supplier-cta{flex-direction:column;align-items:flex-start}.btn-white{width:100%;text-align:center;box-sizing:border-box}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#060B24;border-top:1px solid rgba(138,165,255,.2);justify-content:space-around;padding:8px 4px 12px}
          .bottom-nav a{color:#c8d7f5;text-decoration:none;display:flex;flex-direction:column;align-items:center;font-size:18px}.bottom-nav small{font-size:9px;margin-top:2px}.bottom-nav .plus{background:#4B6BFF;width:44px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-top:-18px}
          .bnav-home{color:#fff}.bnav-home small{color:#fff;font-weight:800}.bnav.active{color:#fff}.bnav.active small{color:#fff;font-weight:800}
        }
      `}</style>
    </div>
  );
}
