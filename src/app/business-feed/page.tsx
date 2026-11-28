"use client";
import { Suspense, useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";
const TEXTS: Record<string, any> = {
  id: { title: "Business Feed", sub: "Feed bisnis — post dari akun bisnis, bukan feed pribadi.", search: "Cari post bisnis...", forYou: "Untuk Kamu", business: "Bisnis", explore: "Jelajahi", empty: "Belum ada post bisnis yang dipublish.", like: "Suka", comment: "Komentar", share: "Bagikan", follow: "Ikuti", following: "Mengikuti", create: "Buat Post Bisnis" },
  en: { title: "Business Feed", sub: "Business feed — posts from business accounts, not personal feed.", search: "Search business posts...", forYou: "For You", business: "Business", explore: "Explore", empty: "No published business posts yet.", like: "Like", comment: "Comment", share: "Share", follow: "Follow", following: "Following", create: "Create Business Post" },
  zh: { title: "商业动态", sub: "商业动态 — 来自企业账号的帖子，不是个人动态。", search: "搜索商业帖子...", forYou: "为你推荐", business: "商业", explore: "探索", empty: "暂无已发布的商业帖子。", like: "点赞", comment: "评论", share: "分享", follow: "关注", following: "已关注", create: "发布商业帖子" },
  ja: { title: "ビジネスフィード", sub: "ビジネスフィード — 個人ではなくビジネスアカウントの投稿。", search: "ビジネス投稿を検索...", forYou: "あなたへ", business: "ビジネス", explore: "探索", empty: "まだ公開されたビジネス投稿がありません。", like: "いいね", comment: "コメント", share: "共有", follow: "フォロー", following: "フォロー中", create: "ビジネス投稿を作成" },
  ko: { title: "비즈니스 피드", sub: "비즈니스 피드 — 개인 피드가 아닌 비즈니스 계정의 게시물.", search: "비즈니스 게시물 검색...", forYou: "추천", business: "비즈니스", explore: "탐색", empty: "게시된 비즈니스 게시물이 아직 없습니다.", like: "좋아요", comment: "댓글", share: "공유", follow: "팔로우", following: "팔로잉", create: "비즈니스 게시물 만들기" },
};
function FeedContent() {
  const [lang, setLang] = useState("en");
  const [q, setQ] = useState("");
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const T = TEXTS[lang] || TEXTS.en;
  useEffect(() => {
    const read = () => { try { const l = localStorage.getItem("vnect-lang") || "en"; if (TEXTS[l]) setLang(l); } catch {} };
    read();
    const h = (e: any) => { if (TEXTS[e.detail]) setLang(e.detail); };
    window.addEventListener("vnect-lang-change", h);
    const iv = setInterval(read, 1000);
    return () => { window.removeEventListener("vnect-lang-change", h); clearInterval(iv); };
  }, []);
  const posts = [
    { biz: "PT Kopi Nusantara", text: "Kopi Arabica baru panen! Ready export ke Jepang & Korea.", likes: 128 },
    { biz: "Batik Solo", text: "Koleksi batik premium baru, cocok untuk B2B.", likes: 89 },
    { biz: "Tech Jaya", text: "Headset Pro diskon 20% untuk partner VNECT.", likes: 210 },
  ].filter(p => (p.biz + p.text).toLowerCase().includes(q.toLowerCase()));
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <TopNav active="feed" />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}><SignOutButton /></div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{T.title}</h1><p style={{ color: "#666" }}>{T.sub}</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", margin: "16px 0", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><button style={{ background: "#111", color: "#fff", border: "none", borderRadius: 999, padding: "8px 14px", fontWeight: 700 }}>{T.forYou}</button><button style={{ background: "#eee", border: "none", borderRadius: 999, padding: "8px 14px", fontWeight: 700 }}>{T.business}</button><button style={{ background: "#eee", border: "none", borderRadius: 999, padding: "8px 14px", fontWeight: 700 }}>{T.explore}</button><button style={{ marginLeft: "auto", background: "#4B6BFF", color: "#fff", border: "none", borderRadius: 999, padding: "8px 14px", fontWeight: 700 }}>{T.create}</button></div>
      {posts.length === 0 ? <p>{T.empty}</p> : posts.map((p, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <b>{p.biz}</b><span style={{ background: "#E8EDFF", color: "#4B6BFF", fontSize: 11, padding: "2px 8px", borderRadius: 999, marginLeft: 8 }}>{T.business}</span>
          <p>{p.text}</p>
          <div style={{ display: "flex", gap: 12, color: "#666", fontSize: 13 }}><button onClick={() => { const n = new Set(liked); if (n.has(i)) n.delete(i); else n.add(i); setLiked(n); }} style={{ border: "none", background: "none", cursor: "pointer" }}>❤️ {T.like} {p.likes + (liked.has(i) ? 1 : 0)}</button><span>💬 {T.comment}</span><span>↗ {T.share}</span><button style={{ marginLeft: "auto", background: "#111", color: "#fff", border: "none", borderRadius: 999, padding: "6px 12px", fontWeight: 700 }}>{T.follow}</button></div>
        </div>
      ))}
    </main>
  );
}
export default function BusinessFeedPage() { return (<Suspense fallback={<main style={{ padding: 24 }}>Loading...</main>}><FeedContent /></Suspense>); }
