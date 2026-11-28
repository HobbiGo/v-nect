"use client";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import { getLang, type Lang } from "@/lib/i18n";

// v-circle - FULL FIX: Logo gede tanpa tulisan, TopNav bareng, Translate full, Tanpa garis, Connect 1x klik
// File: src/app/v-circle/page.tsx - timpa file lama

const TR: Record<string, Record<string, string>> = {
  id: {
    title: "v-circle",
    subtitle: "Founder, profesional & perusahaan. Cari partner, diskusi, tanya produk — di satu circle.",
    search: "Cari orang, circle, produk, negara...",
    people: "Orang",
    companies: "Perusahaan",
    circles: "Circle",
    inbox: "Kotak Masuk",
    connect: "Connect",
    connected: "Terhubung ✓",
    pending: "Menunggu...",
    message: "Pesan",
    location: "Lokasi",
    industry: "Industri",
    members: "Anggota",
    join: "Gabung",
    joined: "Sudah Gabung ✓",
    all: "Semua",
    emptyPeople: "Belum ada orang yang cocok.",
    emptyCompanies: "Belum ada perusahaan yang cocok.",
    emptyCircles: "Belum ada circle yang cocok.",
    inboxEmpty: "Belum ada pesan.",
    filterAll: "Semua Negara",
  },
  en: {
    title: "v-circle",
    subtitle: "Founders, professionals & companies. Find partners, discuss, ask about products — in one circle.",
    search: "Search people, circles, products, countries...",
    people: "People",
    companies: "Companies",
    circles: "Circles",
    inbox: "Inbox",
    connect: "Connect",
    connected: "Connected ✓",
    pending: "Pending...",
    message: "Message",
    location: "Location",
    industry: "Industry",
    members: "Members",
    join: "Join",
    joined: "Joined ✓",
    all: "All",
    emptyPeople: "No people matched.",
    emptyCompanies: "No companies matched.",
    emptyCircles: "No circles matched.",
    inboxEmpty: "No messages yet.",
    filterAll: "All Countries",
  },
  zh: {
    title: "v-circle",
    subtitle: "创始人、专业人士与企业。在一个圈子里找伙伴、讨论、咨询产品。",
    search: "搜索人、圈子、产品、国家...",
    people: "人",
    companies: "公司",
    circles: "圈子",
    inbox: "收件箱",
    connect: "连接",
    connected: "已连接 ✓",
    pending: "等待中...",
    message: "发消息",
    location: "位置",
    industry: "行业",
    members: "成员",
    join: "加入",
    joined: "已加入 ✓",
    all: "全部",
    emptyPeople: "没有匹配的人。",
    emptyCompanies: "没有匹配的公司。",
    emptyCircles: "没有匹配的圈子。",
    inboxEmpty: "暂无消息。",
    filterAll: "所有国家",
  },
  ja: {
    title: "v-circle",
    subtitle: "創業者、専門家、企業。1つのサークルでパートナー探し、議論、製品相談。",
    search: "人、サークル、製品、国を検索...",
    people: "人",
    companies: "企業",
    circles: "サークル",
    inbox: "受信箱",
    connect: "つながる",
    connected: "つながり済み ✓",
    pending: "保留中...",
    message: "メッセージ",
    location: "場所",
    industry: "業界",
    members: "メンバー",
    join: "参加",
    joined: "参加済み ✓",
    all: "すべて",
    emptyPeople: "一致する人がいません。",
    emptyCompanies: "一致する企業がありません。",
    emptyCircles: "一致するサークルがありません。",
    inboxEmpty: "メッセージはまだありません。",
    filterAll: "すべての国",
  },
};

const PEOPLE = [
  { id: "p1", name: "Ayu Putri", role: "Founder • Fashion", country: "Indonesia", avatar: "👩", tags: ["Fashion", "Export"] },
  { id: "p2", name: "Kenji Tanaka", role: "Buyer • Electronics", country: "Japan", avatar: "👨", tags: ["Electronics", "Import"] },
  { id: "p3", name: "Li Wei", role: "Supplier • Coffee", country: "China", avatar: "🧑", tags: ["Coffee", "Factory"] },
  { id: "p4", name: "Maria Gomez", role: "Distributor • Beauty", country: "Spain", avatar: "👩‍💼", tags: ["Beauty", "Retail"] },
  { id: "p5", name: "David Kim", role: "CEO • Tech", country: "South Korea", avatar: "👨‍💼", tags: ["Tech", "SaaS"] },
  { id: "p6", name: "Sarah Lim", role: "Marketing • F&B", country: "Singapore", avatar: "👩", tags: ["F&B", "Marketing"] },
];
const COMPANIES = [
  { id: "c1", name: "Nusantara Coffee Co.", industry: "Makanan • Kopi", country: "Indonesia", avatar: "☕" },
  { id: "c2", name: "Tokyo Earbuds Factory", industry: "Elektronik • Audio", country: "Japan", avatar: "🎧" },
  { id: "c3", name: "Shanghai Fashion Lab", industry: "Fashion • Garmen", country: "China", avatar: "👗" },
  { id: "c4", name: "Madrid Beauty Supply", industry: "Kecantikan • Skincare", country: "Spain", avatar: "💄" },
];
const CIRCLES = [
  { id: "ci1", name: "Export Kopi Indonesia", members: 1240, desc: "Diskusi buyer, harga, logistik kopi." },
  { id: "ci2", name: "Electronics Sourcing Asia", members: 860, desc: "Cari pabrik, MOQ, QC elektronik." },
  { id: "ci3", name: "Fashion Founders", members: 2100, desc: "Brand, produksi, marketplace fashion." },
  { id: "ci4", name: "Beauty Distributors", members: 640, desc: "Distribusi skincare & kosmetik." },
];

export default function VCirclePage() {
  const [lang, setLang] = useState<Lang>(getLang());
  const [tab, setTab] = useState<"people" | "companies" | "circles" | "inbox">("people");
  const [q, setQ] = useState("");
  const [connected, setConnected] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  // FIX Connect dobel: kunci per-id, jadi 1 klik = 1 aksi, nggak bisa dobel klik
  const [busy, setBusy] = useState<string[]>([]);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  const tr = (k: string) => TR[lang]?.[k] || TR.en[k] || k;
  const filter = (s: string) => s.toLowerCase().includes(q.toLowerCase());
  const people = PEOPLE.filter((p) => filter(p.name + p.role + p.country));
  const companies = COMPANIES.filter((c) => filter(c.name + c.industry + c.country));
  const circles = CIRCLES.filter((c) => filter(c.name + c.desc));

  const toggleConnect = (id: string) => {
    if (busy.includes(id)) return; // cegah dobel klik
    setBusy((b) => [...b, id]);
    setConnected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setTimeout(() => setBusy((b) => b.filter((x) => x !== id)), 600);
  };
  const toggleJoin = (id: string) => {
    if (busy.includes(id)) return;
    setBusy((b) => [...b, id]);
    setJoined((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setTimeout(() => setBusy((b) => b.filter((x) => x !== id)), 600);
  };

  return (
    <main className="vcircle">
      <TopNav active="community" />
      <section className="head">
        <h1>{tr("title")}</h1>
        <p>{tr("subtitle")}</p>
        <div className="searchbar">
          <span>🔍</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("search")} />
        </div>
        <div className="tabs">
          <button onClick={() => setTab("people")} className={tab === "people" ? "tab active" : "tab"}>👤 {tr("people")}</button>
          <button onClick={() => setTab("companies")} className={tab === "companies" ? "tab active" : "tab"}>🏢 {tr("companies")}</button>
          <button onClick={() => setTab("circles")} className={tab === "circles" ? "tab active" : "tab"}>👥 {tr("circles")}</button>
          <button onClick={() => setTab("inbox")} className={tab === "inbox" ? "tab active" : "tab"}>✉️ {tr("inbox")}</button>
        </div>
      </section>

      <section className="grid">
        {tab === "people" && (people.length === 0 ? <p className="empty">{tr("emptyPeople")}</p> : people.map((p) => (
          <article key={p.id} className="card">
            <div className="row"><span className="avatar">{p.avatar}</span><div><b>{p.name}</b><p>{p.role}</p></div></div>
            <p className="meta">📍 {p.country}</p>
            <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
            <div className="actions">
              <button onClick={() => toggleConnect(p.id)} disabled={busy.includes(p.id)} className={connected.includes(p.id) ? "btn-done" : "btn-primary"}>
                {connected.includes(p.id) ? tr("connected") : tr("connect")}
              </button>
              <button className="btn-ghost">{tr("message")}</button>
            </div>
          </article>
        )))}
        {tab === "companies" && (companies.length === 0 ? <p className="empty">{tr("emptyCompanies")}</p> : companies.map((c) => (
          <article key={c.id} className="card">
            <div className="row"><span className="avatar">{c.avatar}</span><div><b>{c.name}</b><p>{c.industry}</p></div></div>
            <p className="meta">📍 {c.country}</p>
            <div className="actions">
              <button onClick={() => toggleConnect(c.id)} disabled={busy.includes(c.id)} className={connected.includes(c.id) ? "btn-done" : "btn-primary"}>
                {connected.includes(c.id) ? tr("connected") : tr("connect")}
              </button>
              <button className="btn-ghost">{tr("message")}</button>
            </div>
          </article>
        )))}
        {tab === "circles" && (circles.length === 0 ? <p className="empty">{tr("emptyCircles")}</p> : circles.map((c) => (
          <article key={c.id} className="card">
            <div className="row"><span className="avatar">👥</span><div><b>{c.name}</b><p>{c.members.toLocaleString()} {tr("members")}</p></div></div>
            <p className="meta">{c.desc}</p>
            <div className="actions">
              <button onClick={() => toggleJoin(c.id)} disabled={busy.includes(c.id)} className={joined.includes(c.id) ? "btn-done" : "btn-primary"}>
                {joined.includes(c.id) ? tr("joined") : tr("join")}
              </button>
            </div>
          </article>
        )))}
        {tab === "inbox" && <p className="empty">{tr("inboxEmpty")}</p>}
      </section>

      <style jsx>{`
        .vcircle { background: #060B24; color: #F3F7FF; min-height: 100vh; padding-bottom: 40px; }
        .head { max-width: 1100px; margin: 0 auto; padding: 28px 4% 10px; }
        .head h1 { font-size: 36px; margin: 0 0 8px; }
        .head p { color: #B4C6E7; margin: 0 0 18px; line-height: 1.6; }
        .searchbar { display: flex; gap: 10px; align-items: center; background: #0E183A; border: 1px solid rgba(138,165,255,.25); border-radius: 14px; padding: 12px 14px; }
        .searchbar input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 14px; }
        .searchbar input::placeholder { color: #8A9CC4; }
        .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
        .tab { background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.28); color: #E2ECFF; padding: 9px 16px; border-radius: 999px; font-weight: 700; cursor: pointer; text-decoration: none; }
        .tab.active { background: #fff; color: #060B24; border-color: #fff; }
        .grid { max-width: 1100px; margin: 0 auto; padding: 18px 4%; display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .card { background: #0E183A; border: 1px solid rgba(138,165,255,.18); border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 10px; }
        .row { display: flex; gap: 12px; align-items: center; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; background: #1A2A5A; display: grid; place-items: center; font-size: 22px; flex-shrink: 0; }
        .card b { font-size: 15px; }
        .card p { margin: 2px 0 0; color: #B4C6E7; font-size: 13px; }
        .meta { font-size: 13px; }
        .tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .tags span { background: rgba(75,107,255,.18); color: #AFC6FF; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        .actions { display: flex; gap: 8px; margin-top: 4px; }
        .btn-primary { flex: 1; background: #4B6BFF; color: #fff; border: none; padding: 11px; border-radius: 11px; font-weight: 800; cursor: pointer; }
        .btn-done { flex: 1; background: rgba(255,255,255,.12); color: #AFC6FF; border: 1px solid rgba(138,165,255,.3); padding: 11px; border-radius: 11px; font-weight: 800; cursor: pointer; }
        .btn-ghost { background: rgba(255,255,255,.07); color: #fff; border: 1px solid rgba(154,178,255,.28); padding: 11px 14px; border-radius: 11px; font-weight: 700; cursor: pointer; }
        .btn-primary:disabled, .btn-done:disabled { opacity: .6; }
        .empty { color: #B4C6E7; grid-column: 1 / -1; text-align: center; padding: 30px; }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
          <Footer />
    </main>
  );
}
