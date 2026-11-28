// src/lib/i18n.ts — 1 FILE TERJEMAHAN OTOMATIS UNTUK SEMUA HALAMAN
// Cara pakai di halaman manapun:
// import { useLang, t } from "@/lib/i18n";
// const { lang, setLang } = useLang();
// <h1>{t(lang, "marketTitle")}</h1>  // otomatis ikut bendera

"use client";
import { useEffect, useState } from "react";

export type Lang = "id" | "en" | "zh" | "ja" | "ko";
export const LANGS: Lang[] = ["id", "en", "zh", "ja", "ko"];
export const LANG_LABEL: Record<Lang, string> = { id: "🇮🇩 ID", en: "🇺🇸 EN", zh: "🇨🇳 ZH", ja: "🇯🇵 JA", ko: "🇰🇷 KO" };

// 1 KAMUS UNTUK SEMUA — tambah key baru di sini, semua halaman langsung bisa pakai
export const DICT: Record<string, Record<Lang, string>> = {
  // Umum
  home: { id: "Beranda", en: "Home", zh: "首页", ja: "ホーム", ko: "홈" },
  feed: { id: "Feed", en: "Feed", zh: "动态", ja: "フィード", ko: "피드" },
  meet: { id: "Meet", en: "Meet", zh: "会议", ja: "ミート", ko: "미팅" },
  circle: { id: "Circle", en: "Circle", zh: "圈子", ja: "サークル", ko: "서클" },
  hub: { id: "Hub", en: "Hub", zh: "中心", ja: "ハブ", ko: "허브" },
  market: { id: "Market", en: "Market", zh: "市场", ja: "マーケット", ko: "마켓" },
  businessFeed: { id: "Business Feed", en: "Business Feed", zh: "商业动态", ja: "ビジネスフィード", ko: "비즈니스 피드" },
  explore: { id: "Jelajahi", en: "Explore", zh: "探索", ja: "探索", ko: "탐색" },
  search: { id: "Cari...", en: "Search...", zh: "搜索...", ja: "検索...", ko: "검색..." },
  loading: { id: "Memuat...", en: "Loading...", zh: "加载中...", ja: "読み込み中...", ko: "로딩 중..." },
  save: { id: "Simpan", en: "Save", zh: "保存", ja: "保存", ko: "저장" },
  view: { id: "Lihat →", en: "View →", zh: "查看 →", ja: "見る →", ko: "보기 →" },
  join: { id: "Gabung", en: "Join", zh: "加入", ja: "参加", ko: "참여" },
  joined: { id: "Sudah Gabung", en: "Joined", zh: "已加入", ja: "参加済み", ko: "참여함" },
  like: { id: "Suka", en: "Like", zh: "点赞", ja: "いいね", ko: "좋아요" },
  comment: { id: "Komentar", en: "Comment", zh: "评论", ja: "コメント", ko: "댓글" },
  share: { id: "Bagikan", en: "Share", zh: "分享", ja: "共有", ko: "공유" },
  follow: { id: "Ikuti", en: "Follow", zh: "关注", ja: "フォロー", ko: "팔로우" },
  profile: { id: "Profil", en: "Profile", zh: "个人资料", ja: "プロフィール", ko: "프로필" },
  business: { id: "Bisnis", en: "Business", zh: "业务", ja: "ビジネス", ko: "비즈니스" },
  settings: { id: "Pengaturan", en: "Settings", zh: "设置", ja: "設定", ko: "설정" },
  locationNotSet: { id: "Lokasi belum diisi", en: "Location not set", zh: "未填写位置", ja: "場所が未入力", ko: "위치가 입력되지 않음" },
  bioEmpty: { id: "Bio belum diisi. Ceritain bisnis kamu di sini.", en: "Bio not set. Tell your business here.", zh: "未填写简介。在这里介绍你的业务。", ja: "自己紹介が未入力。ここでビジネスを語って。", ko: "소개가 입력되지 않음. 여기서 비즈니스를 소개하세요." },
  noProducts: { id: "Belum ada produk.", en: "No products yet.", zh: "暂无产品。", ja: "まだ製品がありません。", ko: "아직 제품이 없습니다." },
  noCircles: { id: "Belum ada circle.", en: "No circles yet.", zh: "暂无圈子。", ja: "まだサークルがありません。", ko: "아직 서클이 없습니다." },
  noPosts: { id: "Belum ada post.", en: "No posts yet.", zh: "暂无帖子。", ja: "まだ投稿がありません。", ko: "아직 게시물이 없습니다." },
  // V-Meet
  meetTitle: { id: "V-Meet", en: "V-Meet", zh: "V-会议", ja: "V-ミート", ko: "V-미팅" },
  createRoom: { id: "Buat Room", en: "Create Room", zh: "创建房间", ja: "ルームを作る", ko: "방 만들기" },
  joinRoom: { id: "Gabung Room", en: "Join Room", zh: "加入房间", ja: "ルームに参加", ko: "방 참여" },
  iAmHost: { id: "Saya Host", en: "I am Host", zh: "我是主持人", ja: "ホストです", ko: "호스트입니다" },
  iAmGuest: { id: "Saya Tamu", en: "I am Guest", zh: "我是客人", ja: "ゲストです", ko: "게스트입니다" },
  // Hub / Market / Circle / Feed judul
  hubTitle: { id: "Profil Saya", en: "My Profile", zh: "我的资料", ja: "マイプロフィール", ko: "내 프로필" },
  marketTitle: { id: "V-Market", en: "V-Market", zh: "V-市场", ja: "V-マーケット", ko: "V-마켓" },
  circleTitle: { id: "V-Circle", en: "V-Circle", zh: "V-圈子", ja: "V-サークル", ko: "V-서클" },
  feedTitle: { id: "Business Feed", en: "Business Feed", zh: "商业动态", ja: "ビジネスフィード", ko: "비즈니스 피드" },
  forYou: { id: "Untuk Kamu", en: "For You", zh: "为你推荐", ja: "あなたへ", ko: "추천" },
};

export function t(lang: Lang, key: string): string {
  return DICT[key]?.[lang] ?? DICT[key]?.["en"] ?? key;
}

// Hook global — semua halaman pakai ini, jadi 1x klik bendera di depan, semua halaman ikut
export function useLang() {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const read = () => { try { const l = (localStorage.getItem("vnect-lang") || "en") as Lang; if (LANGS.includes(l)) setLangState(l); } catch {} };
    read();
    const h = (e: any) => { if (LANGS.includes(e.detail)) setLangState(e.detail); };
    window.addEventListener("vnect-lang-change", h);
    const iv = setInterval(read, 800);
    return () => { window.removeEventListener("vnect-lang-change", h); clearInterval(iv); };
  }, []);
  const setLang = (l: Lang) => {
    try { localStorage.setItem("vnect-lang", l); } catch {}
    window.dispatchEvent(new CustomEvent("vnect-lang-change", { detail: l }));
    setLangState(l);
  };
  return { lang, setLang };
}
