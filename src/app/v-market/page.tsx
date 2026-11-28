"use client";
import { Suspense, useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";

const TEXTS: Record<string, any> = {
  id: { title: "V-Market", sub: "Marketplace — Produk & supplier.", search: "Cari produk...", all: "Semua", empty: "Belum ada produk. Coba lagi nanti.", view: "Lihat →" },
  en: { title: "V-Market", sub: "Marketplace — Products & suppliers.", search: "Search products...", all: "All", empty: "No products yet. Try again later.", view: "View →" },
  zh: { title: "V-Market", sub: "市场 — 产品与供应商。", search: "搜索产品...", all: "全部", empty: "暂无产品。请稍后再试。", view: "查看 →" },
  ja: { title: "V-Market", sub: "マーケット — 製品とサプライヤー。", search: "製品を検索...", all: "すべて", empty: "まだ製品がありません。後でお試しください。", view: "見る →" },
  ko: { title: "V-Market", sub: "마켓 — 제품 및 공급업체.", search: "제품 검색...", all: "전체", empty: "아직 제품이 없습니다. 나중에 다시 시도하세요.", view: "보기 →" },
};

function MarketContent() {
  const [lang, setLang] = useState("en");
  const [q, setQ] = useState("");
  const T = TEXTS[lang] || TEXTS.en;
  useEffect(() => {
    const read = () => { try { const l = localStorage.getItem("vnect-lang") || "en"; if (TEXTS[l]) setLang(l); } catch {} };
    read();
    const h = (e: any) => { if (TEXTS[e.detail]) setLang(e.detail); };
    window.addEventListener("vnect-lang-change", h);
    const iv = setInterval(read, 1000);
    return () => { window.removeEventListener("vnect-lang-change", h); clearInterval(iv); };
  }, []);
  const products = [
    { name: "Kopi Arabica — 1kg", cat: "Coffee", price: "$12", img: "☕" },
    { name: "Kain Batik Premium", cat: "Fashion", price: "$25", img: "👘" },
    { name: "Elektronik — Headset", cat: "Electronics", price: "$45", img: "🎧" },
    { name: "Furniture Jati", cat: "Furniture", price: "$120", img: "🪑" },
  ].filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <TopNav active="market" />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}><SignOutButton /></div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{T.title}</h1>
      <p style={{ color: "#666" }}>{T.sub}</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", margin: "16px 0", boxSizing: "border-box" }} />
      {products.length === 0 ? <p>{T.empty}</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {products.map((p, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 32 }}>{p.img}</div>
              <b>{p.name}</b><div style={{ color: "#888", fontSize: 13 }}>{p.cat} • {p.price}</div>
              <button style={{ marginTop: 8, background: "#4B6BFF", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>{T.view}</button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function VMarketPage() {
  return (<Suspense fallback={<main style={{ padding: 24 }}>Loading...</main>}><MarketContent /></Suspense>);
}
