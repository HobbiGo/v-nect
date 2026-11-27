"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AccountAuthModal } from "@/components/AccountAuthModal";
import { PostThreadComments } from "@/components/PostThreadComments";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { t, getLang, type Lang } from "@/lib/i18n";

interface BusinessPost {
  id: string; company_id: string; author_id: string; title: string; content: string;
  post_type: string; image_url: string | null; image_urls?: string[] | null;
  video_url?: string | null; media_url?: string | null; video_urls?: string[] | null; media_urls?: string[] | null; file_url?: string | null; attachment_url?: string | null;
  status: string; created_at: string;
  companies: { company_name: string; logo_url: string | null } | null;
}

const MODULES = [
  { id: "v-chat", name: "v-chat", tag: "Chat & Messaging", desc: "Connect and communicate.", href: "/business-feed", icon: "💬", color: "#36b9ff" },
  { id: "v-meet", name: "v-meet", tag: "Live Meetings", desc: "Voice & video meetings.", href: "/v-meet", icon: "🎥", color: "#bd78ff" },
  { id: "v-hub", name: "v-hub", tag: "Identity Hub", desc: "Build your professional identity.", href: "/v-hub", icon: "✣", color: "#32dce9" },
  { id: "v-feed", name: "v-business feed", tag: "Business Feed", desc: "Feed-nya ada di tab Feed di bawah.", href: "#feed", icon: "▤", color: "#559fff" },
  { id: "v-circle", name: "v-circle", tag: "Network Circle", desc: "Grow your network.", href: "/v-circle", icon: "👥", color: "#4B6BFF" },
  { id: "v-market", name: "v-market", tag: "Marketplace", desc: "Products & suppliers.", href: "/v-market", icon: "🛒", color: "#fbbf24" },
];

const FEATURES = [
  { icon: "💬", title: "Direct & Group Messaging", desc: "Chat real-time sama partner, tim & kontak bisnis." },
  { icon: "🎥", title: "Voice & Video Meetings", desc: "Pitch & meeting cross-border langsung di dalam v-nect." },
  { icon: "🌐", title: "Business Network & Feed", desc: "Share update, launch & insight ke seluruh ekosistem." },
];

function isVideoUrl(u: string) {
  const c = (u||"").toLowerCase();
  if(!c.startsWith("http") && !c.startsWith("blob:") && !c.startsWith("/")) return false;
  if(c.includes("/video/upload/")||c.includes("/video/")||c.includes("video")) return true;
  const base = c.split("?")[0];
  return base.endsWith(".mp4")||base.endsWith(".webm")||base.endsWith(".mov")||base.endsWith(".m4v")||base.endsWith(".m3u8")||base.includes(".mp4")||base.includes(".webm")||base.includes(".mov");
}
function allUrls(text: string): string[] {
  return Array.from(new Set(((text||"").match(/https?:\/\/[^\s"'<>)]+/gi)||[]).map(u=>u.replace(/[.,)]+$/,""))));
}
function extractLink(content: string) {
  const m = (content||"").match(/^\s*Link Video:\s*(https?:\/\/\S+)\s*$/im);
  return m ? m[1].trim() : "";
}
function extractCaption(content: string) {
  const m = (content||"").match(/\(VideoCaption:\s*([^)]*)\)/i);
  return m ? m[1].trim() : "";
}
function cleanText(c: string) {
  return (c||"").replace(/\(VideoCaption:\s*[^)]*\)/gi,"").replace(/^\s*Link Video:\s*https?:\/\/\S+\s*$/gim,"").replace(/\n{3,}/g,"\n\n").trim();
}
function ytId(link: string) {
  return link.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1] || "";
}
type Media = { type: "upload"|"youtube"|"image"|"none"; url: string; thumb?: string; embed?: string };
function getMedia(post: BusinessPost): Media {
  const list: string[] = [];
  const push = (u: any) => { if(typeof u==="string" && u.trim() && !list.includes(u.trim())) list.push(u.trim()); };
  const pushArr = (a: any) => { if(Array.isArray(a)) a.forEach(push); };
  push((post as any).video_url); push((post as any).media_url); push((post as any).file_url); push((post as any).attachment_url);
  pushArr((post as any).video_urls); pushArr((post as any).media_urls);
  pushArr(post.image_urls); push(post.image_url);
  allUrls(post.content).forEach(push);
  allUrls(post.title).forEach(push);
  const upVideo = list.find(isVideoUrl);
  if (upVideo) return { type: "upload", url: upVideo };
  const link = extractLink(post.content) || allUrls(post.content)[0] || "";
  if (link) {
    const id = ytId(link);
    if (id) return { type: "youtube", url: link, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, embed: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&playsinline=1&controls=0` };
    if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(link)) return { type: "image", url: link };
  }
  const img = list.find(u=>/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u));
  if (img) return { type: "image", url: img };
  if (list[0]) return { type: "image", url: list[0] };
  return { type: "none", url: "" };
}

export default function HomePage() {
  const [supabase] = useState(() => createClient());
  const [lang, setLang] = useState<Lang>(getLang());
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string|null>(null);
  const [currentUserName, setCurrentUserName] = useState<string|null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string,number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string,number>>({});
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [mainTab, setMainTab] = useState<"jelajahi"|"feed">("jelajahi");
  const [feedTab, setFeedTab] = useState<"foryou"|"following">("foryou");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: any) => setLang(e.detail as Lang);
    window.addEventListener("vnect-lang-change", h);
    return () => window.removeEventListener("vnect-lang-change", h);
  }, []);

  useEffect(()=>{ fetchPosts(); loadUser();
    const { data:{subscription} } = supabase.auth.onAuthStateChange(()=>loadUser());
    return ()=>subscription.unsubscribe();
  },[supabase]);

  useEffect(()=>{
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        const v = e.target as HTMLVideoElement;
        if(e.isIntersecting) v.play().catch(()=>{}); else v.pause();
      });
    },{ threshold: 0.4 });
    const els = feedRef.current?.querySelectorAll("video.tiktok-video");
    els?.forEach(v=>obs.observe(v));
    return ()=>obs.disconnect();
  },[posts, mainTab, feedTab]);

  async function loadUser(){
    const { data:{user} } = await supabase.auth.getUser();
    if(!user){ setCurrentUserId(null); setCurrentUserName(null); setLikedPostIds([]); return; }
    setCurrentUserId(user.id);
    setCurrentUserName(user.user_metadata?.full_name?.trim() || user.email?.split("@")[0] || "Member");
    const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
    if(data) setLikedPostIds(data.map(r=>r.post_id));
  }
  async function fetchPosts(){
    setLoadingPosts(true);
    const { data, error } = await supabase.from("business_posts").select(`*,companies(company_name,logo_url)`).eq("status","published").order("created_at",{ascending:false}).limit(20);
    if(error){ setPosts([]); setLoadingPosts(false); return; }
    const list = (data||[]) as unknown as BusinessPost[];
    setPosts(list);
    if(list.length){
      const ids = list.map(p=>p.id);
      const { data: likes } = await supabase.from("post_likes").select("post_id").in("post_id", ids);
      const lm: Record<string,number>={}; ids.forEach(id=>lm[id]=0); (likes||[]).forEach(r=>lm[r.post_id]=(lm[r.post_id]||0)+1); setLikeCounts(lm);
      const { data: comments } = await supabase.from("post_comments").select("post_id").in("post_id", ids);
      const cm: Record<string,number>={}; ids.forEach(id=>cm[id]=0); (comments||[]).forEach(r=>cm[r.post_id]=(cm[r.post_id]||0)+1); setCommentCounts(cm);
    }
    setLoadingPosts(false);
  }
  async function toggleLike(id: string){
    if(!currentUserId){ setAuthModalOpen(true); return; }
    const liked = likedPostIds.includes(id);
    if(liked){ setLikedPostIds(p=>p.filter(x=>x!==id)); setLikeCounts(p=>({...p,[id]:Math.max(0,(p[id]||0)-1)})); await supabase.from("post_likes").delete().eq("post_id",id).eq("user_id",currentUserId); }
    else { setLikedPostIds(p=>[...p,id]); setLikeCounts(p=>({...p,[id]:(p[id]||0)+1})); await supabase.from("post_likes").insert({post_id:id,user_id:currentUserId}); }
  }

  return (
    <main className="home">
      {/* ===== TOPNAV BARU - SEMUA JADI TOMBOL PILL, MENARIK ===== */}
      <header className="topnav">
        <div className="top-left">
          <Link href="/" className="brand">v<span>-nect</span></Link>
          <button onClick={()=>setMainTab("jelajahi")} className="home-pill">
            <span className="home-icon">⌂</span>
            <span>{lang==="id" ? "Beranda" : lang==="en" ? "Home" : lang==="zh" ? "首页" : lang==="ja" ? "ホーム" : "Home"}</span>
            <span className="home-dot">●</span>
          </button>
        </div>
        {/* MENU ATAS - SEMUA PILL, NGGAK ADA LAGI TEKS POLOS + UNDERLINE */}
        <nav className="nav-pills">
          <button onClick={()=>setMainTab("jelajahi")} className={mainTab==="jelajahi" ? "pill active" : "pill"}><span>▦</span> {t("explore", lang)}</button>
          <button onClick={()=>setMainTab("feed")} className={mainTab==="feed" ? "pill active" : "pill"}><span>▶</span> {t("feed", lang)}</button>
          <Link href="/v-circle" className="pill"><span>👥</span> {t("community", lang)}</Link>
          <Link href="/v-market" className="pill"><span>🛒</span> {t("market", lang)}</Link>
          <Link href="/v-meet" className="pill"><span>🎥</span> {t("meet", lang)}</Link>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LanguageSwitcher />
          {currentUserName ? <span className="chip">● {currentUserName}</span> : <button className="btn-ghost" onClick={()=>setAuthModalOpen(true)}>Sign In</button>}
        </div>
      </header>

      <section className="hero">
        <span className="eyebrow">THE V-NECT PLATFORM</span>
        <h1>{t("heroTitle1", lang)}<br/><span>{t("heroTitle2", lang)}</span></h1>
        <p>{t("heroDesc", lang)}</p>
        <div className="hero-btns"><button onClick={()=>setMainTab("jelajahi")} className="btn-primary">▦ {t("exploreAll", lang)} →</button><button onClick={()=>setMainTab("feed")} className="btn-secondary">▶ {t("watchFeed", lang)}</button></div>
        <div className="hero-stats"><b>2</b> Menu Besar  •  <b>1</b> Klik Nyampe  •  <b>6</b> Modul di Dalamnya</div>
      </section>

      {mainTab==="jelajahi" && (
      <div id="jelajahi">
      {/* ===== FEATURE + COMMUNITY - FIX BIRU NABRAK: SOLID GELAP TOTAL ===== */}
      <section id="feature-community" className="feature-community">
        <div className="fc-grid">
          <div className="fc-feature">
            <span className="eyebrow">FEATURE</span>
            <h2>{t("featureTitle", lang)}</h2>
            <p className="fc-sub">Satu ekosistem, 3 cara utama buat connect.</p>
            <div className="feature-list">
              {FEATURES.map(f=>(
                <div key={f.title} className="feature-row"><span className="f-icon">{f.icon}</span><div><b>{f.title}</b><p>{f.desc}</p></div></div>
              ))}
            </div>
          </div>
          {/* COMMUNITY - FIX: NAVY GELAP, TEKS PUTIH JELAS, NGGAK ADA BIRU TERANG LAGI */}
          <Link href="/v-circle" className="fc-community">
            <span className="eyebrow">COMMUNITY</span>
            <div className="comm-head"><span className="comm-icon">👥</span><div><h2>v-circle Community</h2><p>Grow your network.</p></div></div>
            <p className="comm-desc">Founder, profesional & perusahaan. Diskusi, tanya produk, cari partner — di satu circle.</p>
            <div className="comm-stats">
              <div><b>{posts.length || "0"}</b><span>Post terbaru</span></div>
              <div><b>{Object.values(likeCounts).reduce((a,b)=>a+b,0) || "0"}</b><span>Total likes</span></div>
              <div><b>{Object.values(commentCounts).reduce((a,b)=>a+b,0) || "0"}</b><span>Diskusi</span></div>
            </div>
            <span className="btn-join">{t("joinCommunity", lang)} →</span>
          </Link>
        </div>
      </section>
      <section id="explore" className="explore">
        <div className="sec-head"><div><span className="eyebrow">EXPLORE • ECOSYSTEM</span><h2>Explore the v-nect Suite</h2><p className="eco-note">Business Feed sudah di dalam sini — klik kartu Business Feed untuk pindah ke tab Feed.</p></div><span className="link">6 modul • 1 tempat</span></div>
        <div className="module-grid">
          {MODULES.map(m=>(
            m.id==="v-feed"
            ? <button key={m.id} onClick={()=>setMainTab("feed")} className="module-card"><span className="m-icon" style={{background:m.color}}>{m.icon}</span><b>{m.name}</b><small>{m.tag}</small><p>{m.desc}</p></button>
            : <Link key={m.id} href={m.href} className="module-card"><span className="m-icon" style={{background:m.color}}>{m.icon}</span><b>{m.name}</b><small>{m.tag}</small><p>{m.desc}</p></Link>
          ))}
        </div>
        <div className="more">
          <h2>One Platform. Every Business Connection.</h2>
          <p>Chat, meet, feed & market dalam 1 akun. Dibuat untuk bisnis lintas negara.</p>
          <button onClick={()=>setMainTab("feed")} className="btn-primary">▶ {t("watchFeed", lang)} →</button>
        </div>
      </section>
      </div>
      )}
      {mainTab==="feed" && (
      <div id="feed">
      <section id="explore" className="explore">
        <div className="sec-head"><div><span className="eyebrow">EXPLORE</span><h2>Explore the v-nect Suite</h2></div><Link href="/explore" className="link">All modules ↗</Link></div>
        <div className="module-grid">
          {MODULES.map(m=>(
            <Link key={m.id} href={m.href} className="module-card">
              <span className="m-icon" style={{background:m.color}}>{m.icon}</span>
              <b>{m.name}</b><small>{m.tag}</small><p>{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="feed-section">
        <div className="sec-head"><div><span className="eyebrow">FEED • BUSINESS FEED</span><h2>{feedTab==="following" ? t("following", lang) : t("forYou", lang)}</h2><p>Scroll ke bawah kayak TikTok. Video jalan sendiri.</p></div><button onClick={()=>setMainTab("jelajahi")} className="link">← Balik ke Jelajahi</button></div>
        <div className="tiktok-tabs feed-tabs"><button onClick={()=>setFeedTab("following")} className={feedTab==="following"?"tab active":"tab"}>{t("following", lang)}</button><button onClick={()=>setFeedTab("foryou")} className={feedTab==="foryou"?"tab active":"tab"}>{t("forYou", lang)}</button></div>

        {loadingPosts ? <div className="loading">Loading posts...</div> : posts.length===0 ? <div className="loading">Belum ada post published.</div> : (
        <div className="tiktok-feed" ref={feedRef}>
          {posts.map(post=>{
            const media = getMedia(post);
            const liked = likedPostIds.includes(post.id);
            const saved = savedIds.includes(post.id);
            const isOpen = openComments.includes(post.id);
            const caption = extractCaption(post.content) || cleanText(post.content);
            return (
              <article key={post.id} className="tiktok-card">
                <div className="tiktok-media">
                  {media.type==="upload" ? (
                    <video className="tiktok-video" src={media.url} autoPlay muted loop playsInline preload="auto" disablePictureInPicture onClick={(e)=>{ const v=e.currentTarget; if(v.paused) v.play().catch(()=>{}); else v.pause(); }} onError={(e)=>{ (e.currentTarget as HTMLVideoElement).style.display="none"; }} />
                  ) : media.type==="youtube" ? (
                    <iframe src={media.embed} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="tiktok-video" />
                  ) : media.type==="image" ? <img src={media.url} alt={post.title} className="tiktok-img"/>
                  : <div className="no-media"><span className="no-media-logo">v-nect</span><p>{post.title}</p></div>}

                  <div className="tiktok-actions">
                    <button onClick={()=>toggleLike(post.id)} className={liked?"act liked":"act"}><span>♥</span><small>{likeCounts[post.id]||0}</small></button>
                    <button onClick={()=>setOpenComments(p=>p.includes(post.id)?p.filter(x=>x!==post.id):[...p,post.id])} className="act"><span>💬</span><small>{commentCounts[post.id]||0}</small></button>
                    <button onClick={()=>setSavedIds(p=>p.includes(post.id)?p.filter(x=>x!==post.id):[...p,post.id])} className={saved?"act saved":"act"}><span>{saved?"★":"☆"}</span><small>Save</small></button>
                    <a href="#feed" className="act"><span>↗</span><small>Share</small></a>
                  </div>

                  <div className="tiktok-caption">
                    <div className="author"><span className="avatar">{post.companies?.company_name?.charAt(0)?.toUpperCase()||"V"}</span><b>@{post.companies?.company_name||"v-nect Official"}</b><span className="badge">{post.post_type}</span></div>
                    <h3>{post.title}</h3>
                    {caption && <p>{caption.slice(0,140)}</p>}
                  </div>
                </div>

                {isOpen && <div className="thread"><PostThreadComments supabase={supabase} postId={post.id} currentUserId={currentUserId} currentUserName={currentUserName} focusTrigger={1} /></div>}
              </article>
            );
          })}
        </div>
        )}
      </section>
      </div>
      )}

      <footer className="footer"><b>v<span>-nect</span></b><p>Connect Beyond Boundaries.</p><small>© 2026 v-nect</small></footer>

      <nav className="bottom-nav">
        <button onClick={()=>setMainTab("jelajahi")} className="bnav bnav-home">⌂<small>{lang==="id"?"Beranda":"Home"}</small></button><a href="/v-market" className="bnav">🛒<small>{t("market", lang)}</small></a><button onClick={()=>setMainTab("feed")} className="bnav plus">+<small></small></button><a href="/v-circle?tab=messages" className="bnav">✉️<small>Kotak Masuk</small></a><a href="/v-hub" className="bnav">●<small>Profil</small></a>
      </nav>

      <AccountAuthModal open={authModalOpen} initialMode="login" onClose={()=>setAuthModalOpen(false)} onSuccess={()=>loadUser()} />

      <style jsx>{`
        .home{background:#060b24;color:#f3f7ff;font-family:var(--font-sans),Arial,sans-serif;padding-bottom:70px;overflow-x:hidden}
        /* TOPNAV BARU - SEMUA PILL */
        .topnav{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 4%;background:#060B24;border-bottom:1px solid rgba(138,165,255,.15)}
        .top-left{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .brand{font-size:21px;font-weight:850;color:#fff;text-decoration:none;white-space:nowrap}.brand span,.footer span{color:#8ab4ff}
        .home-pill{display:flex;align-items:center;gap:7px;background:#ffffff;color:#060B24;border:2px solid #ffffff;padding:8px 15px;border-radius:999px;font-size:13.5px;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(255,255,255,.18);white-space:nowrap}
        .home-icon{font-size:17px;line-height:1}.home-dot{color:#0CAA91;font-size:9px}
        /* NAV PILLS - INI YANG BIKIN ATAS JADI MENARIK */
        .nav-pills{display:flex;gap:6px;align-items:center;flex-wrap:nowrap}
        .pill{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.07);border:1px solid rgba(154,178,255,.28);color:#E2ECFF;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap}
        .pill span{font-size:13px}
        .pill:hover{background:rgba(255,255,255,.14);border-color:rgba(154,178,255,.5)}
        .pill.active{background:#ffffff;color:#060B24;border-color:#ffffff;box-shadow:0 4px 14px rgba(255,255,255,.18)}
        .chip{background:rgba(138,180,255,.14);border:1px solid rgba(138,180,255,.35);padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
        .btn-ghost{background:rgba(255,255,255,.06);border:1px solid rgba(154,178,255,.28);color:#eef3ff;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer}
        .btn-primary{background:#4B6BFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:11px;font-size:13px;font-weight:750;display:inline-flex;gap:8px;border:none;cursor:pointer}
        .btn-secondary{background:rgba(255,255,255,.08);border:1px solid rgba(154,178,255,.3);color:#fff;padding:12px 18px;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer}
        .btn-join{background:#ffffff;color:#060B24;padding:12px 18px;border-radius:12px;font-size:13px;font-weight:800;display:block;text-align:center;margin-top:4px}
        .eyebrow{color:#79a6ff;font-size:10.5px;font-weight:800;letter-spacing:2.6px}
        .hero{padding:36px 7% 28px;max-width:1100px;margin:0 auto;text-align:left}
        .hero h1{font-size:clamp(38px,7vw,60px);line-height:1.05;letter-spacing:-1.5px;margin:12px 0 12px}.hero h1 span{color:#8ab4ff}
        .hero p{color:#b8c7e6;max-width:520px;line-height:1.7;margin:0 0 20px}.hero-stats{margin-top:18px;color:#9cb0d9;font-size:13px}
        .explore,.more{padding:28px 7%;max-width:1100px;margin:0 auto}.feed-section{padding:28px 7%;max-width:560px;margin:0 auto}
        .hero-btns{display:flex;gap:10px;flex-wrap:wrap}
        .feature-community{padding:10px 7% 10px;max-width:1100px;margin:0 auto}.fc-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:16px;align-items:stretch}.fc-feature{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:20px;padding:24px}.fc-feature h2{margin:8px 0 6px;font-size:clamp(22px,3.5vw,30px)}.fc-sub{color:#a9b9da;font-size:13px;margin:0 0 16px}.feature-list{display:flex;flex-direction:column;gap:12px}.feature-row{display:flex;gap:12px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid rgba(138,165,255,.12);border-radius:14px;padding:12px}.feature-row b{font-size:14px}.feature-row p{margin:3px 0 0;color:#b4c6e7;font-size:12.5px;line-height:1.5}.f-icon{width:40px;height:40px;flex-shrink:0;border-radius:11px;background:rgba(92,124,255,.18);display:grid;place-items:center;font-size:18px}
        /* COMMUNITY - FIX BIRU NABRAK: SEMUA GELAP, TEKS PUTIH */
        .fc-community{background:#0E183A !important;background-image:none !important;border:1px solid rgba(138,165,255,.35);border-radius:20px;padding:24px;color:#fff;text-decoration:none;display:flex;flex-direction:column;gap:12px;overflow:hidden;min-width:0}
        .fc-community .eyebrow{color:#8AB4FF}
        .comm-head{display:flex;gap:12px;align-items:center;min-width:0}.comm-icon{width:52px;height:52px;flex-shrink:0;border-radius:16px;background:#1A2A5A !important;display:grid;place-items:center;font-size:24px;border:1px solid rgba(138,165,255,.3)}.comm-head h2{margin:0;font-size:21px;line-height:1.2;word-break:break-word;color:#FFFFFF}.comm-head p{margin:2px 0 0;color:#B4C6E7;font-size:13px}
        .comm-desc{margin:0;line-height:1.6;font-size:13.5px;color:#FFFFFF;word-break:break-word}
        .comm-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:6px 0}.comm-stats div{background:#16224F !important;border:1px solid rgba(138,165,255,.2);border-radius:12px;padding:12px 6px;text-align:center;display:flex;flex-direction:column;min-width:0}.comm-stats b{font-size:20px;color:#fff}.comm-stats span{font-size:11px;color:#B4C6E7}
        .eco-note{color:#a9b9da;font-size:13px;margin:8px 0 0;max-width:620px;line-height:1.6}
        .tiktok-tabs{display:flex;gap:4px;background:rgba(255,255,255,.06);padding:4px;border-radius:999px}.tiktok-tabs .tab{background:transparent;border:none;color:#a9b9da;padding:7px 14px;border-radius:999px;font-size:12.5px;font-weight:700;cursor:pointer}.tiktok-tabs .tab.active{background:#fff;color:#060b24}.feed-tabs{margin-bottom:16px;justify-content:center}
        .sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:18px}.sec-head h2{margin:6px 0 0;font-size:clamp(24px,4vw,32px)}.sec-head p{color:#a9b9da;font-size:13px;margin:6px 0 0}.link{color:#9ec0ff;text-decoration:none;font-size:13px;font-weight:700;white-space:nowrap}
        .module-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .module-card{background:#0E183A;border:1px solid rgba(138,165,255,.16);border-radius:16px;padding:18px;text-decoration:none;color:#fff;display:flex;flex-direction:column;gap:4px}
        .m-icon{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:19px;margin-bottom:6px}.module-card small{color:#82b4ff;font-size:11px;font-weight:700}.module-card p{color:#b4c6e7;font-size:12.5px;line-height:1.5;margin:0}
        .tiktok-feed{display:flex;flex-direction:column;gap:18px;scroll-snap-type:y proximity}
        .tiktok-card{scroll-snap-align:start}
        .tiktok-media{position:relative;width:100%;aspect-ratio:9/16;max-height:720px;border-radius:20px;overflow:hidden;background:#000;border:1px solid rgba(138,165,255,.18)}
        .tiktok-video,.tiktok-img{width:100%;height:100%;object-fit:cover;display:block;border:none}
        .no-media{width:100%;height:100%;display:grid;place-items:center;align-content:center;gap:8px;background:#0E183A;text-align:center;padding:20px}.no-media-logo{font-size:28px;font-weight:850;color:#8ab4ff}
        .tiktok-actions{position:absolute;right:12px;bottom:110px;display:flex;flex-direction:column;gap:12px;z-index:3}.act{background:rgba(0,0,0,.45);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);color:#fff;width:52px;height:52px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;text-decoration:none;font-size:18px}.act small{font-size:9px;margin-top:1px}.act.liked{color:#ff5b7a;border-color:#ff5b7a}.act.saved{color:#fbbf24;border-color:#fbbf24}
        .tiktok-caption{position:absolute;left:14px;right:72px;bottom:14px;z-index:2;text-shadow:0 1px 8px rgba(0,0,0,.9)}.author{display:flex;align-items:center;gap:8px;margin-bottom:6px}.avatar{width:30px;height:30px;border-radius:50%;background:#4b6bff;display:grid;place-items:center;font-size:13px;font-weight:800}.badge{background:rgba(255,255,255,.18);padding:3px 8px;border-radius:999px;font-size:10px}.tiktok-caption h3{margin:0 0 4px;font-size:16px}.tiktok-caption p{margin:0;font-size:13px;line-height:1.5;color:#e2ecff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .thread{margin-top:10px;background:#0d1838;border:1px solid rgba(138,165,255,.2);border-radius:16px;padding:12px;color:#131c36}
        .loading{padding:30px;text-align:center;color:#a9b9da;background:rgba(15,25,58,.7);border-radius:16px}
        .more{background:#0E183A;border:1px solid rgba(138,165,255,.2);border-radius:22px;padding:28px;margin-top:10px}.more h2{margin:0 0 8px}.more p{color:#a9b9da}.more-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0}
        .footer{text-align:center;padding:28px;color:#96a8d0}.footer b{color:#fff;font-size:22px}
        .bottom-nav{display:none}.bottom-nav button{background:none;border:none;cursor:pointer}
        @media(max-width:640px){
          .nav-pills{display:none}.fc-grid{grid-template-columns:1fr}.module-grid{grid-template-columns:repeat(2,1fr);gap:10px}.module-card{padding:14px}.hero{padding:26px 5% 18px}.explore,.feed-section,.more{padding:22px 5%}
          .tiktok-media{aspect-ratio:9/16;max-height:none;border-radius:18px}.more-grid{grid-template-columns:1fr}
          .topnav{padding:10px 4%}
          .home-pill{padding:7px 12px;font-size:12.5px}
          .bottom-nav{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#060B24;border-top:1px solid rgba(138,165,255,.2);justify-content:space-around;padding:8px 4px 12px}
          .bottom-nav a{color:#c8d7f5;text-decoration:none;display:flex;flex-direction:column;align-items:center;font-size:18px}.bottom-nav small{font-size:9px;margin-top:2px}.bottom-nav .plus{background:#4B6BFF;width:44px;height:44px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;margin-top:-18px}
          .bnav-home{color:#fff}.bnav-home small{color:#fff;font-weight:800}
        }
      `}</style>
    </main>
  );
}
