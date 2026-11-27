// src/lib/i18n.ts - Kamus v-nect
// Cara pakai: import { t } from "@/lib/i18n"; t("dashboard", lang)

export type Lang = "id" | "en" | "zh" | "ja" | "ko";

export const DICT: Record<Lang, Record<string, string>> = {
  id: {
    dashboard: "Dashboard", hello: "Halo", myProfile: "Profil Saya",
    displayName: "Nama Tampilan", bio: "Bio", bioPh: "Ceritain bisnis kamu...",
    location: "Lokasi", website: "Website", saveProfile: "Simpan Profil", saved: "Tersimpan!",
    company: "Company", companyProfile: "Profil Perusahaan", companyName: "Nama Perusahaan",
    home: "Beranda", explore: "Jelajahi", feed: "Feed", market: "Market", meet: "Meet",
    community: "Komunitas", joinCommunity: "Gabung Komunitas", forYou: "Untuk Kamu",
    following: "Mengikuti", trending: "Trending", editProfile: "Edit Profil", shareProfile: "Bagikan Profil",
    heroTitle1: "Terhubung Tanpa", heroTitle2: "Batas.", heroDesc: "Komunikasi, meeting video, komunitas & commerce — dalam satu tempat.",
    exploreAll: "Jelajahi Semua", watchFeed: "Nonton Feed", featureTitle: "Semua yang Dibutuhkan Bisnismu",
    vMeet: "V-Meet", vMarket: "V-Market", vCircle: "V-Circle", vHub: "V-Hub",
    liveTranslate: "Live Translate", b2bMarket: "Marketplace B2B",
  },
  en: {
    dashboard: "Dashboard", hello: "Hello", myProfile: "My Profile",
    displayName: "Display Name", bio: "Bio", bioPh: "Tell us about your business...",
    location: "Location", website: "Website", saveProfile: "Save Profile", saved: "Saved!",
    company: "Company", companyProfile: "Company Profile", companyName: "Company Name",
    home: "Home", explore: "Explore", feed: "Feed", market: "Market", meet: "Meet",
    community: "Community", joinCommunity: "Join Community", forYou: "For You",
    following: "Following", trending: "Trending", editProfile: "Edit Profile", shareProfile: "Share Profile",
    heroTitle1: "Connect Beyond", heroTitle2: "Boundaries.", heroDesc: "Communication, video meetings, community & commerce — in one place.",
    exploreAll: "Explore All", watchFeed: "Watch Feed", featureTitle: "Everything Your Business Needs",
    vMeet: "V-Meet", vMarket: "V-Market", vCircle: "V-Circle", vHub: "V-Hub",
    liveTranslate: "Live Translate", b2bMarket: "B2B Marketplace",
  },
  zh: {
    dashboard: "仪表盘", hello: "你好", myProfile: "我的资料",
    displayName: "显示名称", bio: "简介", bioPh: "介绍一下你的业务...",
    location: "位置", website: "网站", saveProfile: "保存资料", saved: "已保存！",
    company: "公司", companyProfile: "公司资料", companyName: "公司名称",
    home: "首页", explore: "探索", feed: "动态", market: "市场", meet: "会议",
    community: "社区", joinCommunity: "加入社区", forYou: "为你推荐",
    following: "关注", trending: "热门", editProfile: "编辑资料", shareProfile: "分享资料",
    heroTitle1: "连接超越", heroTitle2: "边界。", heroDesc: "沟通、视频会议、社区和商业 — 尽在一个平台。",
    exploreAll: "探索全部", watchFeed: "观看动态", featureTitle: "你的业务所需的一切",
    vMeet: "V-Meet", vMarket: "V-Market", vCircle: "V-Circle", vHub: "V-Hub",
    liveTranslate: "实时翻译", b2bMarket: "B2B 市场",
  },
  ja: {
    dashboard: "ダッシュボード", hello: "こんにちは", myProfile: "マイプロフィール",
    displayName: "表示名", bio: "自己紹介", bioPh: "ビジネスについて教えてください...",
    location: "場所", website: "ウェブサイト", saveProfile: "保存", saved: "保存しました！",
    company: "会社", companyProfile: "会社プロフィール", companyName: "会社名",
    home: "ホーム", explore: "探索", feed: "フィード", market: "マーケット", meet: "ミート",
    community: "コミュニティ", joinCommunity: "コミュニティに参加", forYou: "おすすめ",
    following: "フォロー中", trending: "トレンド", editProfile: "プロフィール編集", shareProfile: "プロフィール共有",
    heroTitle1: "境界を超えて", heroTitle2: "つながる。", heroDesc: "コミュニケーション、ビデオ会議、コミュニティ＆コマース — すべてここに。",
    exploreAll: "すべて探索", watchFeed: "フィードを見る", featureTitle: "ビジネスに必要なすべて",
    vMeet: "V-Meet", vMarket: "V-Market", vCircle: "V-Circle", vHub: "V-Hub",
    liveTranslate: "ライブ翻訳", b2bMarket: "B2Bマーケット",
  },
  ko: {
    dashboard: "대시보드", hello: "안녕하세요", myProfile: "내 프로필",
    displayName: "표시 이름", bio: "소개", bioPh: "비즈니스를 소개해 주세요...",
    location: "위치", website: "웹사이트", saveProfile: "프로필 저장", saved: "저장됨!",
    company: "회사", companyProfile: "회사 프로필", companyName: "회사 이름",
    home: "홈", explore: "탐색", feed: "피드", market: "마켓", meet: "밋",
    community: "커뮤니티", joinCommunity: "커뮤니티 참여", forYou: "추천",
    following: "팔로잉", trending: "트렌딩", editProfile: "프로필 편집", shareProfile: "프로필 공유",
    heroTitle1: "경계를 넘어", heroTitle2: "연결하세요.", heroDesc: "소통, 영상 회의, 커뮤니티 및 커머스 — 한 곳에서.",
    exploreAll: "모두 탐색", watchFeed: "피드 보기", featureTitle: "비즈니스에 필요한 모든 것",
    vMeet: "V-Meet", vMarket: "V-Market", vCircle: "V-Circle", vHub: "V-Hub",
    liveTranslate: "실시간 번역", b2bMarket: "B2B 마켓",
  },
};

export function getLang(): Lang {
  try {
    const s = localStorage.getItem("vnect-lang") as Lang | null;
    if (s && ["id","en","zh","ja","ko"].includes(s)) return s;
  } catch {}
  return "id";
}
export function t(key: string, lang?: Lang): string {
  const l = lang || getLang();
  return DICT[l]?.[key] || DICT["en"][key] || key;
}
// Contoh pakai di Dashboard:
// const [lang, setLang] = useState<Lang>(getLang());
// useEffect(() => { const h = (e: any) => setLang(e.detail); window.addEventListener("vnect-lang-change", h); return () => window.removeEventListener("vnect-lang-change", h); }, []);
// <h1>{t("dashboard", lang)}</h1>  // ID: Dashboard, ZH: 仪表盘, EN: Dashboard
