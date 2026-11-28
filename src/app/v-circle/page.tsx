"use client";
import { Suspense, useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";

const TEXTS: Record<string, any> = {
  id: { title: "V-Circle", sub: "Komunitas — ngobrol, sharing, dan cari partner.", search: "Cari orang / komunitas...", join: "Gabung", joined: "Sudah Gabung", members: "anggota", create: "Buat Circle", empty: "Belum ada circle. Buat yang pertama!", postPh: "Tulis sesuatu ke circle...", postBtn: "Kirim" },
  en: { title: "V-Circle", sub: "Community — chat, share, and find partners.", search: "Search people / community...", join: "Join", joined: "Joined", members: "members", create: "Create Circle", empty: "No circles yet. Create the first one!", postPh: "Write something to circle...", postBtn: "Post" },
  zh: { title: "V-Circle", sub: "社区 — 聊天、分享、寻找合作伙伴。", search: "搜索人 / 社区...", join: "加入", joined: "已加入", members: "成员", create: "创建圈子", empty: "暂无圈子。创建第一个！", postPh: "向圈子写点什么...", postBtn: "发布" },
  ja: { title: "V-Circle", sub: "コミュニティ — 話して、共有して、パートナーを見つけよう。", search: "人 / コミュニティを検索...", join: "参加", joined: "参加済み", members: "メンバー", create: "サークルを作る", empty: "まだサークルがありません。最初に作ろう！", postPh: "サークルに何か書く...", postBtn: "投稿" },
  ko: { title: "V-Circle", sub: "커뮤니티 — 대화하고, 공유하고, 파트너를 찾으세요.", search: "사람 / 커뮤니티 검색...", join: "참여", joined: "참여함", members: "명", create: "서클 만들기", empty: "아직 서클이 없습니다. 첫 번째를 만드세요!", postPh: "서클에 글 쓰기...", postBtn: "게시" },
};

function CircleContent() {
  const [lang, setLang] = useState("en");
  const [q, setQ] = useState("");
  const [joined, setJoined] = useState<Set<number>>(new Set());
  const [post, setPost] = useState("");
  const T = TEXTS[lang] || TEXTS.en;
  useEffect(() => {
    const read = () => { try { const l = localStorage.getItem("vnect-lang") || "en"; if (TEXTS[l]) setLang(l); } catch {} };
    read();
    const h = (e: any) => { if (TEXTS[e.detail]) setLang(e.detail); };
    window.addEventListener("vnect-lang-change", h);
    const iv = setInterval(read, 1000);
    return () => { window.removeEventListener("vnect-lang-change", h); clearInterval(iv); };
  }, []);
  const circles = [
    { name: "Exportir Kopi Indonesia", members: 1240, emoji: "☕" },
    { name: "Fashion & Batik", members: 860, emoji: "👘" },
    { name: "Tech Startup Asia", members: 2100, emoji: "💻" },
  ].filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (i: number) => { const n = new Set(joined); if (n.has(i)) n.delete(i); else n.add(i); setJoined(n); };
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <TopNav active="circle" />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}><SignOutButton /></div>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>{T.title}</h1><p style={{ color: "#666" }}>{T.sub}</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", margin: "16px 0", boxSizing: "border-box" }} />
      <textarea value={post} onChange={(e) => setPost(e.target.value)} placeholder={T.postPh} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #ddd", boxSizing: "border-box" }} />
      <button onClick={() => setPost("")} style={{ background: "#4B6BFF", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, marginTop: 8, cursor: "pointer" }}>{T.postBtn}</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}><b>Circle</b><button style={{ background: "#111", color: "#fff", border: "none", borderRadius: 999, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>{T.create}</button></div>
      {circles.length === 0 ? <p>{T.empty}</p> : circles.map((c, i) => (
        <div key={i} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 16, marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{c.emoji}</span><div style={{ flex: 1 }}><b>{c.name}</b><div style={{ color: "#888", fontSize: 13 }}>{c.members} {T.members}</div></div>
          <button onClick={() => toggle(i)} style={{ background: joined.has(i) ? "#E8EDFF" : "#4B6BFF", color: joined.has(i) ? "#4B6BFF" : "#fff", border: "none", borderRadius: 999, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>{joined.has(i) ? T.joined : T.join}</button>
        </div>
      ))}
    </main>
  );
}
export default function VCirclePage() { return (<Suspense fallback={<main style={{ padding: 24 }}>Loading...</main>}><CircleContent /></Suspense>); }
