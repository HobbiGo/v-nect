"use client";
import { Suspense, useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import SignOutButton from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/client";

const TEXTS: Record<string, any> = {
  id: { member: "Member v-nect", businessMember: "Business Member", locEmpty: "Lokasi belum diisi", bioEmpty: "Bio belum diisi. Ceritain bisnis kamu di sini biar buyer / partner percaya.", viewMarket: "Lihat di Market →", viewCommunity: "Lihat di Community →", tabProfile: "Profil", tabBusiness: "Bisnis", tabSettings: "Pengaturan", myProfile: "Profil Saya", displayName: "Nama tampilan", displayPh: "Nama tampilan", bio: "Bio", bioPh: "Ceritain bisnis kamu...", location: "Lokasi", locationPh: "Jakarta, Indonesia", website: "Website", save: "Simpan Profil", company: "Company →" },
  en: { member: "Member v-nect", businessMember: "Business Member", locEmpty: "Location not set", bioEmpty: "Bio not set. Tell your business here so buyers / partners trust you.", viewMarket: "View in Market →", viewCommunity: "View in Community →", tabProfile: "Profile", tabBusiness: "Business", tabSettings: "Settings", myProfile: "My Profile", displayName: "Display name", displayPh: "Display name", bio: "Bio", bioPh: "Tell your business...", location: "Location", locationPh: "Jakarta, Indonesia", website: "Website", save: "Save Profile", company: "Company →" },
  zh: { member: "Member v-nect", businessMember: "商业会员", locEmpty: "未填写位置", bioEmpty: "未填写简介。在这里介绍你的业务，让买家 / 合作伙伴信任你。", viewMarket: "在市场中查看 →", viewCommunity: "在社区中查看 →", tabProfile: "个人资料", tabBusiness: "业务", tabSettings: "设置", myProfile: "我的资料", displayName: "显示名称", displayPh: "显示名称", bio: "简介", bioPh: "介绍你的业务...", location: "位置", locationPh: "雅加达，印度尼西亚", website: "网站", save: "保存资料", company: "公司 →" },
  ja: { member: "Member v-nect", businessMember: "ビジネスメンバー", locEmpty: "場所が未入力", bioEmpty: "自己紹介が未入力。ここでビジネスを語って、バイヤー / パートナーに信頼してもらおう。", viewMarket: "マーケットで見る →", viewCommunity: "コミュニティで見る →", tabProfile: "プロフィール", tabBusiness: "ビジネス", tabSettings: "設定", myProfile: "マイプロフィール", displayName: "表示名", displayPh: "表示名", bio: "自己紹介", bioPh: "ビジネスを語って...", location: "場所", locationPh: "ジャカルタ、インドネシア", website: "ウェブサイト", save: "プロフィールを保存", company: "会社 →" },
  ko: { member: "Member v-nect", businessMember: "비즈니스 멤버", locEmpty: "위치가 입력되지 않음", bioEmpty: "소개가 입력되지 않음. 여기서 비즈니스를 소개해 구매자 / 파트너가 신뢰하게 하세요.", viewMarket: "마켓에서 보기 →", viewCommunity: "커뮤니티에서 보기 →", tabProfile: "프로필", tabBusiness: "비즈니스", tabSettings: "설정", myProfile: "내 프로필", displayName: "표시 이름", displayPh: "표시 이름", bio: "소개", bioPh: "비즈니스를 소개하세요...", location: "위치", locationPh: "자카르타, 인도네시아", website: "웹사이트", save: "프로필 저장", company: "회사 →" },
};

function HubContent() {
  const [lang, setLang] = useState("en");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("wenyonghan927@gmail.com");
  const [saved, setSaved] = useState(false);
  const T = TEXTS[lang] || TEXTS.en;
  useEffect(() => {
    const read = () => { try { const l = localStorage.getItem("vnect-lang") || "en"; if (TEXTS[l]) setLang(l); } catch {} };
    read();
    const h = (e: any) => { if (TEXTS[e.detail]) setLang(e.detail); };
    window.addEventListener("vnect-lang-change", h);
    const iv = setInterval(read, 1000);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); });
    return () => { window.removeEventListener("vnect-lang-change", h); clearInterval(iv); };
  }, []);
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", background: "#060B24", minHeight: "100vh", color: "#fff" }}>
      <TopNav active="hub" />
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}><SignOutButton /></div>
      <div style={{ background: "#0E183A", borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", background: "#4B6BFF", display: "grid", placeItems: "center", fontSize: 24, fontWeight: 900 }}>V</span>
          <div>
            <b style={{ fontSize: 18 }}>{T.member}</b><div style={{ fontSize: 13, color: "#B4C6E7" }}>{T.businessMember}</div>
            <div style={{ fontSize: 13, color: "#B4C6E7", marginTop: 6 }}>📍 {location || T.locEmpty} • {email}</div>
            <p style={{ color: "#D6E2FF", fontSize: 14 }}>{bio || T.bioEmpty}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><a href="/v-market" style={{ color: "#fff" }}>{T.viewMarket}</a><a href="/v-circle" style={{ color: "#fff" }}>{T.viewCommunity}</a></div>
          </div>
          <a href="/company" style={{ marginLeft: "auto", color: "#fff" }}>{T.company}</a>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <button style={tabActive}>{T.tabProfile}</button><button style={tab}>{T.tabBusiness}</button><button style={tab}>{T.tabSettings}</button>
      </div>
      <div style={{ background: "#0E183A", borderRadius: 20, padding: 24 }}>
        <h2>{T.myProfile}</h2>
        <label style={label}>{T.displayName}</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={T.displayPh} style={input} />
        <label style={label}>{T.bio}</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={T.bioPh} style={{ ...input, height: 80 }} />
        <label style={label}>{T.location}</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={T.locationPh} style={input} />
        <label style={label}>{T.website}</label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={input} />
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={primary}>{saved ? "✓ Saved!" : T.save}</button>
      </div>
    </main>
  );
}

export default function VHubPage() {
  return (<Suspense fallback={<main style={{ padding: 24 }}>Loading...</main>}><HubContent /></Suspense>);
}
const tabActive: React.CSSProperties = { background: "#fff", color: "#060B24", border: "none", borderRadius: 999, padding: "8px 16px", fontWeight: 700, cursor: "pointer" };
const tab: React.CSSProperties = { background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 999, padding: "8px 16px", fontWeight: 700, cursor: "pointer" };
const label: React.CSSProperties = { display: "block", fontSize: 13, color: "#B4C6E7", margin: "14px 0 6px" };
const input: React.CSSProperties = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.2)", background: "#16224F", color: "#fff", boxSizing: "border-box" };
const primary: React.CSSProperties = { background: "#4B6BFF", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 700, cursor: "pointer", marginTop: 16 };
