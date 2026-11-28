"use client";
import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { getLang, type Lang } from "@/lib/i18n";

// v-market - FULL FIX Alibaba style: MOQ + Tiered Price + RFQ + Verified + Translate Full
// File: src/app/v-market/page.tsx - timpa file lama

const TR: Record<string, Record<string, string>> = {
  id: {
    title: "v-market",
    subtitle: "Marketplace B2B ala Alibaba. Cari supplier terverifikasi, bandingkan MOQ & harga bertingkat, kirim RFQ.",
    search: "Cari produk, supplier, kategori...",
    all: "Semua",
    verified: "Terverifikasi ✓",
    moq: "Min. Order",
    price: "Harga",
    tier: "Harga Bertingkat",
    rfq: "Minta Penawaran",
    rfqSent: "RFQ Terkirim ✓",
    chat: "Chat Supplier",
    store: "Kunjungi Toko",
    supplier: "Supplier",
    category: "Kategori",
    location: "Lokasi",
    empty: "Tidak ada produk yang cocok.",
    catAll: "Semua Kategori",
    catFood: "Makanan & Minuman",
    catElec: "Elektronik",
    catFashion: "Fashion",
    catBeauty: "Kecantikan",
    sort: "Urutkan",
  },
  en: {
    title: "v-market",
    subtitle: "Alibaba-style B2B marketplace. Find verified suppliers, compare MOQ & tiered pricing, send RFQ.",
    search: "Search products, suppliers, categories...",
    all: "All",
    verified: "Verified ✓",
    moq: "Min. Order",
    price: "Price",
    tier: "Tiered Pricing",
    rfq: "Request Quote",
    rfqSent: "RFQ Sent ✓",
    chat: "Chat Supplier",
    store: "Visit Store",
    supplier: "Supplier",
    category: "Category",
    location: "Location",
    empty: "No products matched.",
    catAll: "All Categories",
    catFood: "Food & Beverage",
    catElec: "Electronics",
    catFashion: "Fashion",
    catBeauty: "Beauty",
    sort: "Sort",
  },
  zh: {
    title: "v-market",
    subtitle: "阿里巴巴风格 B2B 市场。找认证供应商，对比起订量与阶梯价，发送询盘。",
    search: "搜索产品、供应商、类目...",
    all: "全部",
    verified: "已认证 ✓",
    moq: "起订量",
    price: "价格",
    tier: "阶梯价格",
    rfq: "获取报价",
    rfqSent: "询盘已发送 ✓",
    chat: "联系供应商",
    store: "访问店铺",
    supplier: "供应商",
    category: "类目",
    location: "位置",
    empty: "没有匹配的产品。",
    catAll: "全部类目",
    catFood: "食品饮料",
    catElec: "电子产品",
    catFashion: "服装",
    catBeauty: "美妆",
    sort: "排序",
  },
  ja: {
    title: "v-market",
    subtitle: "アリババ式 B2B マーケット。認証サプライヤーを探し、MOQと段階価格を比較、見積依頼を送る。",
    search: "製品、サプライヤー、カテゴリを検索...",
    all: "すべて",
    verified: "認証済み ✓",
    moq: "最小注文数",
    price: "価格",
    tier: "段階価格",
    rfq: "見積依頼",
    rfqSent: "見積依頼送信済み ✓",
    chat: "サプライヤーに連絡",
    store: "店舗を見る",
    supplier: "サプライヤー",
    category: "カテゴリ",
    location: "場所",
    empty: "一致する製品がありません。",
    catAll: "すべてのカテゴリ",
    catFood: "食品・飲料",
    catElec: "電子機器",
    catFashion: "ファッション",
    catBeauty: "美容",
    sort: "並び替え",
  },
};

type Product = { id: string; name: string; supplier: string; country: string; cat: string; price: number; moq: number; tiers: { qty: string; price: string }[]; verified: boolean; emoji: string; rating: string };

const PRODUCTS: Product[] = [
  { id: "1", name: "Kopi Arabika Gayo 1kg - Single Origin", supplier: "Nusantara Coffee Co.", country: "Indonesia", cat: "food", price: 12.5, moq: 100, tiers: [{ qty: "100-499", price: "$12.50" }, { qty: "500-999", price: "$11.20" }, { qty: "1000+", price: "$9.80" }], verified: true, emoji: "☕", rating: "4.9" },
  { id: "2", name: "Wireless Earbuds TWS Pro - Bluetooth 5.3", supplier: "Tokyo Earbuds Factory", country: "Japan", cat: "elec", price: 8.9, moq: 500, tiers: [{ qty: "500-999", price: "$8.90" }, { qty: "1000-4999", price: "$7.50" }, { qty: "5000+", price: "$6.20" }], verified: true, emoji: "🎧", rating: "4.8" },
  { id: "3", name: "Oversized Hoodie Cotton 400GSM", supplier: "Shanghai Fashion Lab", country: "China", cat: "fashion", price: 6.5, moq: 200, tiers: [{ qty: "200-499", price: "$6.50" }, { qty: "500-999", price: "$5.80" }, { qty: "1000+", price: "$4.90" }], verified: true, emoji: "� hoodies".replace(" ", ""), rating: "4.7" },
  { id: "4", name: "Vitamin C Serum 30ml - Brightening", supplier: "Madrid Beauty Supply", country: "Spain", cat: "beauty", price: 3.2, moq: 300, tiers: [{ qty: "300-999", price: "$3.20" }, { qty: "1000-2999", price: "$2.75" }, { qty: "3000+", price: "$2.30" }], verified: false, emoji: "💧", rating: "4.6" },
  { id: "5", name: "Teh Herbal Chamomile 500g Bulk", supplier: "Nusantara Coffee Co.", country: "Indonesia", cat: "food", price: 4.1, moq: 100, tiers: [{ qty: "100-499", price: "$4.10" }, { qty: "500+", price: "$3.60" }], verified: true, emoji: "🍵", rating: "4.9" },
  { id: "6", name: "Smart Watch Fitness AMOLED", supplier: "Tokyo Earbuds Factory", country: "Japan", cat: "elec", price: 18.5, moq: 200, tiers: [{ qty: "200-499", price: "$18.50" }, { qty: "500+", price: "$16.00" }], verified: true, emoji: "⌚", rating: "4.8" },
];

export default function VMarketPage() {
  const [lang, setLang] = useState<Lang>(getLang());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [rfqSent, setRfqSent] = useState<string[]>([]);
  const [busy, setBusy] = useState<string[]>([]);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  const tr = (k: string) => TR[lang]?.[k] || TR.en[k] || k;
  const list = PRODUCTS.filter((p) => (cat === "all" || p.cat === cat) && (p.name + p.supplier + p.country).toLowerCase().includes(q.toLowerCase()));

  const sendRFQ = (id: string) => {
    if (busy.includes(id) || rfqSent.includes(id)) return;
    setBusy((b) => [...b, id]);
    setRfqSent((prev) => [...prev, id]);
    setTimeout(() => setBusy((b) => b.filter((x) => x !== id)), 600);
  };

  const cats = [
    { id: "all", label: tr("catAll") },
    { id: "food", label: tr("catFood") },
    { id: "elec", label: tr("catElec") },
    { id: "fashion", label: tr("catFashion") },
    { id: "beauty", label: tr("catBeauty") },
  ];

  return (
    <main className="market">
      <TopNav active="market" />
      <section className="head">
        <h1>{tr("title")}</h1>
        <p>{tr("subtitle")}</p>
        <div className="searchbar"><span>🔍</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("search")} /></div>
        <div className="cats">
          {cats.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={cat === c.id ? "cat active" : "cat"}>{c.label}</button>
          ))}
        </div>
      </section>
      <section className="grid">
        {list.length === 0 ? <p className="empty">{tr("empty")}</p> : list.map((p) => (
          <article key={p.id} className="card">
            <div className="thumb">{p.emoji}</div>
            <h3>{p.name}</h3>
            <p className="supplier">🏢 {p.supplier} {p.verified && <span className="verified">✓ {tr("verified")}</span>}</p>
            <p className="meta">📍 {p.country} • ⭐ {p.rating} • {tr("moq")}: {p.moq} pcs</p>
            <div className="price-row"><span className="price">${p.price.toFixed(2)}</span><span className="per">/ pcs</span></div>
            <div className="tiers">
              <b>{tr("tier")}</b>
              {p.tiers.map((t) => <div key={t.qty} className="tier"><span>{t.qty} pcs</span><b>{t.price}</b></div>)}
            </div>
            <div className="actions">
              <button onClick={() => sendRFQ(p.id)} disabled={busy.includes(p.id) || rfqSent.includes(p.id)} className={rfqSent.includes(p.id) ? "btn-done" : "btn-primary"}>
                {rfqSent.includes(p.id) ? tr("rfqSent") : tr("rfq")}
              </button>
              <button className="btn-ghost">{tr("chat")}</button>
            </div>
            <button className="store">{tr("store")} →</button>
          </article>
        ))}
      </section>
      <style jsx>{`
        .market { background: #060B24; color: #F3F7FF; min-height: 100vh; padding-bottom: 40px; }
        .head { max-width: 1150px; margin: 0 auto; padding: 28px 4% 10px; }
        .head h1 { font-size: 36px; margin: 0 0 8px; }
        .head p { color: #B4C6E7; margin: 0 0 18px; line-height: 1.6; }
        .searchbar { display: flex; gap: 10px; align-items: center; background: #0E183A; border: 1px solid rgba(138,165,255,.25); border-radius: 14px; padding: 12px 14px; }
        .searchbar input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font-size: 14px; }
        .searchbar input::placeholder { color: #8A9CC4; }
        .cats { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
        .cat { background: rgba(255,255,255,.07); border: 1px solid rgba(154,178,255,.28); color: #E2ECFF; padding: 9px 16px; border-radius: 999px; font-weight: 700; cursor: pointer; }
        .cat.active { background: #fff; color: #060B24; border-color: #fff; }
        .grid { max-width: 1150px; margin: 0 auto; padding: 18px 4%; display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        .card { background: #0E183A; border: 1px solid rgba(138,165,255,.18); border-radius: 18px; padding: 18px; display: flex; flex-direction: column; gap: 8px; }
        .thumb { height: 110px; border-radius: 12px; background: #1A2A5A; display: grid; place-items: center; font-size: 44px; }
        .card h3 { font-size: 15px; line-height: 1.4; margin: 6px 0 0; }
        .supplier { font-size: 13px; color: #B4C6E7; margin: 0; }
        .verified { color: #4ADE80; font-weight: 800; font-size: 12px; }
        .meta { font-size: 12px; color: #B4C6E7; margin: 0; }
        .price-row { display: flex; gap: 4px; align-items: baseline; margin-top: 4px; }
        .price { font-size: 22px; font-weight: 850; color: #FF6B35; }
        .per { font-size: 12px; color: #B4C6E7; }
        .tiers { background: rgba(255,255,255,.04); border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
        .tiers b { font-size: 12px; }
        .tier { display: flex; justify-content: space-between; font-size: 12px; color: #B4C6E7; }
        .tier b { color: #fff; }
        .actions { display: flex; gap: 8px; margin-top: 6px; }
        .btn-primary { flex: 1; background: #FF6B35; color: #fff; border: none; padding: 11px; border-radius: 11px; font-weight: 800; cursor: pointer; }
        .btn-done { flex: 1; background: rgba(74,222,128,.15); color: #4ADE80; border: 1px solid rgba(74,222,128,.4); padding: 11px; border-radius: 11px; font-weight: 800; cursor: pointer; }
        .btn-ghost { background: rgba(255,255,255,.07); color: #fff; border: 1px solid rgba(154,178,255,.28); padding: 11px 14px; border-radius: 11px; font-weight: 700; cursor: pointer; }
        .store { background: transparent; border: none; color: #8AB4FF; font-weight: 800; cursor: pointer; padding: 6px; }
        .empty { color: #B4C6E7; grid-column: 1 / -1; text-align: center; padding: 30px; }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
