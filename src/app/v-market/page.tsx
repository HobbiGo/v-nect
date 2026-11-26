"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type MarketplaceListing = {
  id: string;
  name: string;
  supplier: string;
  category: "Products" | "Services" | "Suppliers";
  region: string;
  priceLabel: string;
  description: string;
  featureNotes?: string;
  imageUrl?: string | null;
  verified: boolean;
  connectHref: string;
  connectLabel: string;
};

type MarketComment = {
  id: string;
  listing_key: string;
  author_name: string;
  comment_text: string;
  created_at: string;
};

type InquiryRecord = {
  id: string;
  user_id?: string;
  requester_name: string;
  listing_key: string;
  listing_name: string;
  supplier_name: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  user_id?: string;
  listing_key: string;
  sender_name: string;
  message_text: string;
  created_at: string;
};

type LaunchPostRow = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  image_urls?: string[] | null;
  companies: {
    company_name: string;
  } | null;
};

const MARKET_INQUIRIES_STORAGE_KEY = "v-nect_v_market_inquiries_v2";
const MARKET_CHAT_STORAGE_KEY = "v-nect_v_market_chat_v1";
const MARKET_COMMENTS_STORAGE_KEY = "v-nect_v_market_comments_v1";
const MARKET_CUSTOM_LISTINGS_KEY = "v-nect_v_market_custom_listings_v1";

const DEFAULT_FEATURE_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#102b4d"/>
          <stop offset="100%" stop-color="#134a66"/>
        </linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#bg)"/>
      <circle cx="670" cy="85" r="110" fill="#13c8b5" fill-opacity="0.16"/>
      <circle cx="130" cy="350" r="130" fill="#347cf0" fill-opacity="0.18"/>
      <text x="48" y="185" fill="#7ee8dc" font-family="Arial, sans-serif" font-size="18" font-weight="bold" letter-spacing="2">V-MARKET PRODUCT FEATURE</text>
      <text x="48" y="232" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="bold">Showcase &amp; Feature Highlights</text>
      <text x="48" y="272" fill="#c7d9ec" font-family="Arial, sans-serif" font-size="18">Klik foto untuk memperbesar detail fitur produk perusahaan</text>
    </svg>`
  );

const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: "mkt-1",
    name: "Orbiss Promo Showcase & Feature Kit",
    supplier: "Orbiss Commerce",
    category: "Products",
    region: "Singapore & APAC",
    priceLabel: "From $290 / batch",
    description:
      "Short-form product highlight visuals and commercial launch assets ready for multi-channel campaign deployment.",
    featureNotes:
      "Fitur utama: Template kampanye siap pakai, aset visual resolusi tinggi, dan paket distribusi multi-kanal untuk peluncuran produk.",
    imageUrl: DEFAULT_FEATURE_PHOTO,
    verified: true,
    connectHref: "/business-feed",
    connectLabel: "Lihat di Feed ->",
  },
  {
    id: "mkt-2",
    name: "Cross-Border Supplier Sourcing",
    supplier: "Pacific Supply Co.",
    category: "Suppliers",
    region: "Indonesia · SG · PH",
    priceLabel: "Custom MOQ",
    description:
      "Verified regional manufacturing and trade sourcing with transparent quality checks and logistics coordination.",
    featureNotes:
      "Fitur utama: Inspeksi kualitas pra-pengiriman, koordinasi logistik lintas negara, dan skema MOQ fleksibel untuk partner bisnis.",
    imageUrl: null,
    verified: true,
    connectHref: "/v-circle",
    connectLabel: "Konek di Circle ->",
  },
  {
    id: "mkt-3",
    name: "Enterprise Partnership & GTM Advisory",
    supplier: "Northbridge Ventures",
    category: "Services",
    region: "Jakarta & Singapore",
    priceLabel: "Consultation",
    description:
      "Strategic partnership structuring, distributor introductions, and regional market entry roadmaps.",
    featureNotes:
      "Fitur utama: Pemetaan distribusi regional, introduksi mitra strategis, dan penyusunan rencana ekspansi pasar.",
    imageUrl: null,
    verified: true,
    connectHref: "/v-circle",
    connectLabel: "Konek di Circle ->",
  },
  {
    id: "mkt-4",
    name: "Design System & Web Platform Sprint",
    supplier: "Studio Voin",
    category: "Services",
    region: "Remote / APAC",
    priceLabel: "Fixed Scope",
    description:
      "Responsive web interfaces, brand component libraries, and high-clarity product experiences.",
    featureNotes:
      "Fitur utama: Komponen antarmuka responsif, panduan desain terstandar, dan implementasi cepat untuk produk web.",
    imageUrl: null,
    verified: false,
    connectHref: "/v-hub",
    connectLabel: "Buka v-hub ->",
  },
];

const CATEGORIES = ["All", "Products", "Services", "Suppliers"] as const;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VMarketPage() {
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbSyncActive, setDbSyncActive] = useState(false);

  const [liveLaunchListings, setLiveLaunchListings] = useState<MarketplaceListing[]>([]);
  const [customListings, setCustomListings] = useState<MarketplaceListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [inquiryBanner, setInquiryBanner] = useState("");

  // Inquiries & Chat per listing
  const [inquiriesByListing, setInquiriesByListing] = useState<Record<string, InquiryRecord[]>>({});
  const [chatsByListing, setChatsByListing] = useState<Record<string, ChatMessage[]>>({});
  const [openChatForId, setOpenChatForId] = useState<string | null>(null);
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const [sendingChatId, setSendingChatId] = useState<string | null>(null);

  // Form tambah produk / fitur oleh company
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newCategory, setNewCategory] = useState<"Products" | "Services" | "Suppliers">("Products");
  const [newRegion, setNewRegion] = useState("Indonesia & APAC");
  const [newPriceLabel, setNewPriceLabel] = useState("Contact for Quote");
  const [newDescription, setNewDescription] = useState("");
  const [newFeatureNotes, setNewFeatureNotes] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [savingListing, setSavingListing] = useState(false);

  // Modal lihat foto fitur produk
  const [previewPhoto, setPreviewPhoto] = useState<{
    title: string;
    supplier: string;
    featureNotes?: string;
    imageUrl: string;
  } | null>(null);

  // Komentar per listing
  const [openCommentsForId, setOpenCommentsForId] = useState<string | null>(null);
  const [commentsByListing, setCommentsByListing] = useState<Record<string, MarketComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawReq = window.localStorage.getItem(MARKET_INQUIRIES_STORAGE_KEY);
      if (rawReq) {
        const parsed = JSON.parse(rawReq);
        if (parsed && typeof parsed === "object") {
          setInquiriesByListing(parsed as Record<string, InquiryRecord[]>);
        }
      }

      const rawChat = window.localStorage.getItem(MARKET_CHAT_STORAGE_KEY);
      if (rawChat) {
        const parsedChat = JSON.parse(rawChat);
        if (parsedChat && typeof parsedChat === "object") {
          setChatsByListing(parsedChat as Record<string, ChatMessage[]>);
        }
      }

      const rawCom = window.localStorage.getItem(MARKET_COMMENTS_STORAGE_KEY);
      if (rawCom) {
        const parsedCom = JSON.parse(rawCom);
        if (parsedCom && typeof parsedCom === "object") {
          setCommentsByListing(parsedCom as Record<string, MarketComment[]>);
        }
      }

      const rawCustom = window.localStorage.getItem(MARKET_CUSTOM_LISTINGS_KEY);
      if (rawCustom) {
        const parsedCustom = JSON.parse(rawCustom);
        if (Array.isArray(parsedCustom)) {
          setCustomListings(parsedCustom as MarketplaceListing[]);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  async function loadInquiriesFromDb() {
    const { data, error } = await supabase
      .from("v_market_inquiries")
      .select("id, user_id, requester_name, listing_key, listing_name, supplier_name, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && Array.isArray(data)) {
      setDbSyncActive(true);
      const grouped: Record<string, InquiryRecord[]> = {};
      for (const row of data as InquiryRecord[]) {
        if (!grouped[row.listing_key]) grouped[row.listing_key] = [];
        grouped[row.listing_key].push({
          ...row,
          requester_name: row.requester_name || "Member",
        });
      }
      setInquiriesByListing((prev) => ({ ...prev, ...grouped }));
    }
  }

  async function loadChatMessagesFromDb() {
    const { data, error } = await supabase
      .from("v_market_chat_messages")
      .select("id, user_id, listing_key, sender_name, message_text, created_at")
      .order("created_at", { ascending: true })
      .limit(300);

    if (!error && Array.isArray(data)) {
      const grouped: Record<string, ChatMessage[]> = {};
      for (const row of data as ChatMessage[]) {
        if (!grouped[row.listing_key]) grouped[row.listing_key] = [];
        grouped[row.listing_key].push(row);
      }
      setChatsByListing((prev) => ({ ...prev, ...grouped }));
    }
  }

  async function loadCommentsFromDb() {
    const { data, error } = await supabase
      .from("v_market_comments")
      .select("id, listing_key, author_name, comment_text, created_at")
      .order("created_at", { ascending: true })
      .limit(200);

    if (!error && Array.isArray(data)) {
      const grouped: Record<string, MarketComment[]> = {};
      for (const row of data as MarketComment[]) {
        if (!grouped[row.listing_key]) grouped[row.listing_key] = [];
        grouped[row.listing_key].push(row);
      }
      setCommentsByListing((prev) => ({ ...prev, ...grouped }));
    }
  }

  async function syncMarketData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setCurrentUserId(user.id);
      let displayName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Company Member";

      const { data: settings } = await supabase
        .from("account_settings")
        .select("active_profile_type, active_company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settings?.active_profile_type === "company" && settings?.active_company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("company_name")
          .eq("id", settings.active_company_id)
          .maybeSingle();
        if (comp?.company_name) {
          displayName = comp.company_name;
          setNewCompanyName((prev) => prev || comp.company_name);
        }
      }

      setCurrentUserName(displayName);
      await loadInquiriesFromDb();
      await loadChatMessagesFromDb();
    } else {
      setCurrentUserId(null);
      setCurrentUserName(null);
      setDbSyncActive(false);
    }

    await loadCommentsFromDb();

    const { data: postsData } = await supabase
      .from("business_posts")
      .select(`
        id,
        title,
        content,
        image_url,
        image_urls,
        companies (
          company_name
        )
      `)
      .eq("status", "published")
      .eq("post_type", "product_launch")
      .order("created_at", { ascending: false })
      .limit(12);

    if (Array.isArray(postsData)) {
      const mapped = (postsData as unknown as LaunchPostRow[]).map((row) => {
        const img =
          (Array.isArray(row.image_urls) && row.image_urls[0]) ||
          row.image_url ||
          null;
        const cleanDesc = (row.content || "")
          .replace(/\[VideoCaption:\s*[^\]]*\]/gi, "")
          .replace(/^\s*Link Video:\s*https?:\/\/\S+\s*$/gim, "")
          .trim();

        return {
          id: `launch-${row.id}`,
          name: row.title || "Product Launch",
          supplier: row.companies?.company_name || "v-nect Partner",
          category: "Products" as const,
          region: "v-nect Marketplace",
          priceLabel: "Product Launch",
          description:
            cleanDesc || "Featured product launch published on v-nect Business Feed.",
          featureNotes: cleanDesc || undefined,
          imageUrl: img,
          verified: true,
          connectHref: "/business-feed",
          connectLabel: "Lihat di Feed ->",
        };
      });
      setLiveLaunchListings(mapped);
    }
  }

  useEffect(() => {
    let active = true;
    syncMarketData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        syncMarketData();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCurrentUserId(null);
    setCurrentUserName(null);
    setDbSyncActive(false);
  }

  function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setNewImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateCompanyListing(e: React.FormEvent) {
    e.preventDefault();
    const title = newProductName.trim();
    const desc = newDescription.trim();
    if (!title || !desc) return;

    setSavingListing(true);
    const companyLabel =
      newCompanyName.trim() || currentUserName || "v-nect Company";
    const chosenImage = newImageUrl.trim() || DEFAULT_FEATURE_PHOTO;

    const createdItem: MarketplaceListing = {
      id: `custom-${Date.now()}`,
      name: title,
      supplier: companyLabel,
      category: newCategory,
      region: newRegion.trim() || "APAC",
      priceLabel: newPriceLabel.trim() || "Contact for Quote",
      description: desc,
      featureNotes: newFeatureNotes.trim() || undefined,
      imageUrl: chosenImage,
      verified: true,
      connectHref: "/business-feed",
      connectLabel: "Lihat di Feed ->",
    };

    const nextCustom = [createdItem, ...customListings];
    setCustomListings(nextCustom);
    try {
      window.localStorage.setItem(MARKET_CUSTOM_LISTINGS_KEY, JSON.stringify(nextCustom));
    } catch {
      // Ignore storage errors
    }

    if (currentUserId) {
      await supabase.from("v_market_listings").insert({
        user_id: currentUserId,
        company_name: companyLabel,
        category: newCategory,
        region: newRegion.trim() || "APAC",
        name: title,
        price_label: newPriceLabel.trim() || "Contact for Quote",
        description: desc,
        feature_notes: newFeatureNotes.trim(),
        image_url: chosenImage.startsWith("data:") ? null : chosenImage,
      });
    }

    setSavingListing(false);
    setNewProductName("");
    setNewDescription("");
    setNewFeatureNotes("");
    setNewImageUrl("");
    setShowCreateForm(false);
    setInquiryBanner(
      `Produk & keterangan fitur "${title}" oleh ${companyLabel} berhasil ditambahkan ke v-market.`
    );
  }

  const allListings = useMemo(
    () => [...customListings, ...liveLaunchListings, ...INITIAL_LISTINGS],
    [customListings, liveLaunchListings]
  );

  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allListings.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.featureNotes || "").toLowerCase().includes(q)
      );
    });
  }, [allListings, searchQuery, selectedCategory]);

  async function handleRequestQuote(item: MarketplaceListing) {
    const requesterLabel = currentUserName || "Guest Visitor";
    const nowIso = new Date().toISOString();

    const newRecord: InquiryRecord = {
      id: `req-${Date.now()}`,
      user_id: currentUserId || undefined,
      requester_name: requesterLabel,
      listing_key: item.id,
      listing_name: item.name,
      supplier_name: item.supplier,
      created_at: nowIso,
    };

    const existingList = inquiriesByListing[item.id] || [];
    const filteredExisting = existingList.filter(
      (r) => r.requester_name !== requesterLabel
    );
    const updatedInquiries = {
      ...inquiriesByListing,
      [item.id]: [newRecord, ...filteredExisting],
    };

    setInquiriesByListing(updatedInquiries);
    setOpenChatForId(item.id);

    try {
      window.localStorage.setItem(
        MARKET_INQUIRIES_STORAGE_KEY,
        JSON.stringify(updatedInquiries)
      );
    } catch {
      // Ignore storage errors
    }

    if (currentUserId) {
      const { error } = await supabase.from("v_market_inquiries").upsert(
        {
          user_id: currentUserId,
          requester_name: requesterLabel,
          listing_key: item.id,
          listing_name: item.name,
          supplier_name: item.supplier,
          created_at: nowIso,
        },
        { onConflict: "user_id,listing_key" }
      );

      if (!error) {
        await loadInquiriesFromDb();
        setInquiryBanner(
          `Request info dari ${requesterLabel} pada ${formatTimestamp(nowIso)} untuk "${item.name}" tersimpan. Silakan balas di chat.`
        );
        return;
      }
    }

    setInquiryBanner(
      `Request info dari ${requesterLabel} (${formatTimestamp(nowIso)}) untuk "${item.name}" tercatat. Anda bisa langsung chat di panel bawah kartu.`
    );
  }

  async function handleSendChatMessage(e: React.FormEvent, item: MarketplaceListing) {
    e.preventDefault();
    const text = (chatDrafts[item.id] || "").trim();
    if (!text) return;

    setSendingChatId(item.id);
    const senderLabel = currentUserName || "Partner Company";
    const nowIso = new Date().toISOString();

    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      user_id: currentUserId || undefined,
      listing_key: item.id,
      sender_name: senderLabel,
      message_text: text,
      created_at: nowIso,
    };

    const updatedChats = {
      ...chatsByListing,
      [item.id]: [...(chatsByListing[item.id] || []), newMsg],
    };

    setChatsByListing(updatedChats);
    setChatDrafts((prev) => ({ ...prev, [item.id]: "" }));

    try {
      window.localStorage.setItem(MARKET_CHAT_STORAGE_KEY, JSON.stringify(updatedChats));
    } catch {
      // Ignore storage errors
    }

    if (currentUserId) {
      await supabase.from("v_market_chat_messages").insert({
        user_id: currentUserId,
        listing_key: item.id,
        sender_name: senderLabel,
        message_text: text,
      });
      await loadChatMessagesFromDb();
    }

    setSendingChatId(null);
  }

  async function handleAddComment(e: React.FormEvent, item: MarketplaceListing) {
    e.preventDefault();
    const text = (commentDrafts[item.id] || "").trim();
    if (!text) return;

    setSubmittingCommentId(item.id);
    const authorLabel = currentUserName || "Partner Company";

    const optimisticComment: MarketComment = {
      id: `local-${Date.now()}`,
      listing_key: item.id,
      author_name: authorLabel,
      comment_text: text,
      created_at: new Date().toISOString(),
    };

    const updatedMap = {
      ...commentsByListing,
      [item.id]: [...(commentsByListing[item.id] || []), optimisticComment],
    };
    setCommentsByListing(updatedMap);
    setCommentDrafts((prev) => ({ ...prev, [item.id]: "" }));

    try {
      window.localStorage.setItem(MARKET_COMMENTS_STORAGE_KEY, JSON.stringify(updatedMap));
    } catch {
      // Ignore storage errors
    }

    if (currentUserId) {
      await supabase.from("v_market_comments").insert({
        user_id: currentUserId,
        listing_key: item.id,
        author_name: authorLabel,
        comment_text: text,
      });
      await loadCommentsFromDb();
    }

    setSubmittingCommentId(null);
    setInquiryBanner(`Komentar pada "${item.name}" berhasil dikirim oleh ${authorLabel}.`);
  }

  return (
    <main className="market-page">
      <header className="market-navbar">
        <div className="market-nav-left">
          <Link href="/" className="market-brand">
            v<span>-nect</span>
            <small>V-MARKETPLACE</small>
          </Link>

          <nav className="market-nav-links">
            <Link href="/">Home</Link>
            <Link href="/business-feed">Business Feed</Link>
            <Link href="/v-circle">v-circle</Link>
            <Link href="/v-hub">v-hub</Link>
          </nav>
        </div>

        <div className="market-nav-right">
          {currentUserName ? (
            <>
              <span className="market-user-pill">● {currentUserName}</span>
              <button type="button" className="market-ghost-btn" onClick={handleSignOut}>
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="market-ghost-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              Masuk / Register
            </button>
          )}
        </div>
      </header>

      <section className="market-container">
        <div className="market-hero">
          <div>
            <span className="market-eyebrow">MODULE 06 · COMPANY PRODUCTS, REQUESTS &amp; LIVE CHAT</span>
            <h1>
              v-<span>market.</span>
            </h1>
            <p>
              Browse products and feature photos posted by companies, see who requested info and when, reply in chat, and comment on listings.
            </p>
          </div>

          <div className="market-hero-actions">
            <button
              type="button"
              className="market-btn-primary"
              onClick={() => setShowCreateForm((prev) => !prev)}
            >
              {showCreateForm ? "Tutup Form Produk ✕" : "+ Posting Produk Company"}
            </button>
            <Link href="/business-feed" className="market-secondary-btn">
              Publish Launch di Feed -&gt;
            </Link>
          </div>
        </div>

        {showCreateForm && (
          <form className="market-create-card" onSubmit={handleCreateCompanyListing}>
            <div className="market-create-head">
              <div>
                <span className="market-eyebrow">COMPANY PRODUCT &amp; FEATURE BUILDER</span>
                <h2>Tambah Produk, Foto Fitur &amp; Keterangan Company</h2>
              </div>
            </div>

            <div className="market-form-grid">
              <label>
                Nama Company
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Contoh: PT Nusantara Digital"
                  required
                />
              </label>

              <label>
                Nama Produk / Layanan
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Contoh: Smart POS & Inventory Suite"
                  required
                />
              </label>

              <label>
                Kategori
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as "Products" | "Services" | "Suppliers")
                  }
                >
                  <option value="Products">Products</option>
                  <option value="Services">Services</option>
                  <option value="Suppliers">Suppliers</option>
                </select>
              </label>

              <label>
                Wilayah / Market
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Contoh: Indonesia & Singapore"
                />
              </label>

              <label>
                Harga / Skema Penawaran
                <input
                  type="text"
                  value={newPriceLabel}
                  onChange={(e) => setNewPriceLabel(e.target.value)}
                  placeholder="Contoh: Mulai Rp 1.500.000 / bulan"
                />
              </label>

              <label>
                URL Foto Fitur Produk (opsional)
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... atau upload file di bawah"
                />
              </label>
            </div>

            <label>
              Upload Foto Fitur Produk dari Perangkat (opsional)
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
              />
            </label>

            <label>
              Penjelasan / Keterangan Produk
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Jelaskan kegunaan utama produk atau layanan perusahaan Anda..."
                required
              />
            </label>

            <label>
              Detail Fitur &amp; Keunggulan Produk (Teks Penjelasan Fitur)
              <textarea
                rows={2}
                value={newFeatureNotes}
                onChange={(e) => setNewFeatureNotes(e.target.value)}
                placeholder="Contoh: Sinkronisasi stok real-time, laporan multi-cabang, dan integrasi pembayaran..."
              />
            </label>

            <div className="market-form-submit-row">
              <button
                type="submit"
                className="market-btn-primary"
                disabled={savingListing}
              >
                {savingListing ? "Menyimpan..." : "Simpan & Tampilkan di v-market"}
              </button>
            </div>
          </form>
        )}

        {inquiryBanner && (
          <div className="market-banner">
            <span>✓ {inquiryBanner}</span>
            <button type="button" onClick={() => setInquiryBanner("")}>
              ✕
            </button>
          </div>
        )}

        <div className="market-toolbar">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk, fitur, perusahaan/supplier, atau wilayah..."
            className="market-search-input"
          />

          <div className="market-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={selectedCategory === cat ? "market-chip active" : "market-chip"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="market-grid">
          {filteredListings.map((item) => {
            const itemInquiries = inquiriesByListing[item.id] || [];
            const requested = itemInquiries.length > 0;
            const itemChats = chatsByListing[item.id] || [];
            const isChatOpen = openChatForId === item.id;
            const itemComments = commentsByListing[item.id] || [];
            const isCommentsOpen = openCommentsForId === item.id;

            return (
              <article className="market-card" key={item.id}>
                {item.imageUrl && (
                  <div className="market-media-box">
                    <img
                      src={item.imageUrl}
                      alt={`Foto fitur ${item.name}`}
                      className="market-card-media"
                      onClick={() =>
                        setPreviewPhoto({
                          title: item.name,
                          supplier: item.supplier,
                          featureNotes: item.featureNotes || item.description,
                          imageUrl: item.imageUrl!,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="market-media-expand"
                      onClick={() =>
                        setPreviewPhoto({
                          title: item.name,
                          supplier: item.supplier,
                          featureNotes: item.featureNotes || item.description,
                          imageUrl: item.imageUrl!,
                        })
                      }
                    >
                      Klik Lihat Foto Fitur
                    </button>
                  </div>
                )}

                <div className="market-card-top">
                  <span className="market-cat-badge">{item.category}</span>
                  <small>{item.region}</small>
                </div>

                <h3>
                  {item.name} {item.verified && <span className="market-ver">✓</span>}
                </h3>
                <div className="market-supplier">Posted by {item.supplier}</div>
                <p className="market-desc">{item.description}</p>

                {item.featureNotes && (
                  <div className="market-feature-box">
                    <strong>Keterangan Fitur Produk:</strong>
                    <p>{item.featureNotes}</p>
                  </div>
                )}

                {itemInquiries.length > 0 && (
                  <div className="market-inquiry-info">
                    <strong>Info Request Masuk ({itemInquiries.length}):</strong>
                    {itemInquiries.slice(0, 3).map((inq) => (
                      <div key={inq.id} className="market-inquiry-item">
                        <span>Dari: <b>{inq.requester_name}</b></span>
                        <small>{formatTimestamp(inq.created_at)}</small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="market-card-divider" />

                <div className="market-card-foot">
                  <strong className="market-price">{item.priceLabel}</strong>

                  <div className="market-action-row">
                    {item.imageUrl && (
                      <button
                        type="button"
                        className="market-secondary-btn"
                        onClick={() =>
                          setPreviewPhoto({
                            title: item.name,
                            supplier: item.supplier,
                            featureNotes: item.featureNotes || item.description,
                            imageUrl: item.imageUrl!,
                          })
                        }
                      >
                        Lihat Foto
                      </button>
                    )}

                    <button
                      type="button"
                      className="market-secondary-btn"
                      onClick={() =>
                        setOpenChatForId(isChatOpen ? null : item.id)
                      }
                    >
                      Chat ({itemChats.length})
                    </button>

                    <button
                      type="button"
                      className="market-secondary-btn"
                      onClick={() =>
                        setOpenCommentsForId(isCommentsOpen ? null : item.id)
                      }
                    >
                      Komentar ({itemComments.length})
                    </button>

                    <button
                      type="button"
                      className={requested ? "market-btn-done" : "market-btn-primary"}
                      onClick={() => handleRequestQuote(item)}
                    >
                      {requested ? `Requested (${itemInquiries.length}) ✓` : "Request Info"}
                    </button>
                  </div>

                  <div className="market-sub-link-row">
                    <Link href={item.connectHref} className="market-connect-link">
                      {item.connectLabel}
                    </Link>
                  </div>
                </div>

                {isChatOpen && (
                  <div className="market-chat-panel">
                    <div className="market-chat-title">
                      Request &amp; Chat Bisnis — {item.supplier}
                    </div>

                    {itemInquiries.length > 0 && (
                      <div className="market-chat-reqs">
                        {itemInquiries.map((inq) => (
                          <div key={inq.id}>
                            Request dari <b>{inq.requester_name}</b> · {formatTimestamp(inq.created_at)}
                          </div>
                        ))}
                      </div>
                    )}

                    {itemChats.length === 0 ? (
                      <p className="market-comments-empty">
                        Belum ada pesan chat. Kirim atau balas pesan untuk diskusi detail produk ini.
                      </p>
                    ) : (
                      <ul className="market-chat-list">
                        {itemChats.map((msg) => (
                          <li key={msg.id}>
                            <div className="market-chat-meta">
                              <strong>{msg.sender_name}</strong>
                              <small>{formatTimestamp(msg.created_at)}</small>
                            </div>
                            <span>{msg.message_text}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form
                      className="market-comment-form"
                      onSubmit={(e) => handleSendChatMessage(e, item)}
                    >
                      <input
                        type="text"
                        value={chatDrafts[item.id] || ""}
                        onChange={(e) =>
                          setChatDrafts((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Balas atau tulis chat ke pemilik / pengirim request..."
                        maxLength={400}
                      />
                      <button
                        type="submit"
                        className="market-btn-primary"
                        disabled={sendingChatId === item.id}
                      >
                        {sendingChatId === item.id ? "..." : "Kirim Chat"}
                      </button>
                    </form>
                  </div>
                )}

                {isCommentsOpen && (
                  <div className="market-comments-panel">
                    <div className="market-comments-title">
                      Diskusi Antar-Company ({itemComments.length})
                    </div>

                    {itemComments.length === 0 ? (
                      <p className="market-comments-empty">
                        Belum ada komentar. Mulai diskusi bisnis untuk produk ini.
                      </p>
                    ) : (
                      <ul className="market-comments-list">
                        {itemComments.map((c) => (
                          <li key={c.id}>
                            <strong>{c.author_name}</strong>
                            <span>{c.comment_text}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <form
                      className="market-comment-form"
                      onSubmit={(e) => handleAddComment(e, item)}
                    >
                      <input
                        type="text"
                        value={commentDrafts[item.id] || ""}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Tulis komentar atau pertanyaan bisnis sebagai company..."
                        maxLength={300}
                      />
                      <button
                        type="submit"
                        className="market-btn-primary"
                        disabled={submittingCommentId === item.id}
                      >
                        {submittingCommentId === item.id ? "..." : "Kirim"}
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {previewPhoto && (
        <div
          className="market-modal-backdrop"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="market-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="market-modal-head">
              <div>
                <strong>{previewPhoto.title}</strong>
                <small>by {previewPhoto.supplier}</small>
              </div>
              <button
                type="button"
                className="market-ghost-btn"
                onClick={() => setPreviewPhoto(null)}
              >
                Tutup ✕
              </button>
            </div>

            <img
              src={previewPhoto.imageUrl}
              alt={previewPhoto.title}
              className="market-modal-media"
            />

            {previewPhoto.featureNotes && (
              <p className="market-modal-notes">{previewPhoto.featureNotes}</p>
            )}
          </div>
        </div>
      )}

      <footer className="market-footer">
        v-nect v-market ·{" "}
        {currentUserId
          ? `Signed in as ${currentUserName}${dbSyncActive ? " (Supabase Sync Active)" : " (Local Sync)"}`
          : "Public Marketplace Preview"}{" "}
        · © {new Date().getFullYear()} v-nect
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => syncMarketData()}
      />

      <style jsx>{`
        .market-page {
          min-height: 100vh;
          background: #07111f;
          color: #eef4fb;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .market-navbar {
          min-height: 74px;
          padding: 12px 7%;
          background: #07111f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .market-nav-left,
        .market-nav-right {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }

        .market-brand {
          color: #ffffff;
          text-decoration: none;
          font-size: 21px;
          font-weight: 800;
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }

        .market-brand span,
        .market-hero h1 span {
          color: #13c8b5;
        }

        .market-brand small {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          color: #9cb0c9;
        }

        .market-nav-links {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .market-nav-links a {
          color: #d2deed;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }

        .market-nav-links a:hover {
          color: #13c8b5;
        }

        .market-user-pill {
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(19, 200, 181, 0.16);
          border: 1px solid rgba(19, 200, 181, 0.45);
          color: #7ee8dc;
          font-size: 12px;
          font-weight: 700;
        }

        .market-ghost-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #eef4fb;
          padding: 7px 13px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .market-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 72px;
        }

        .market-hero {
          background: linear-gradient(125deg, #102b4d, #134a66);
          border: 1px solid rgba(126, 232, 220, 0.2);
          border-radius: 18px;
          padding: 34px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .market-eyebrow {
          display: inline-block;
          color: #13c8b5;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .market-hero h1 {
          margin: 8px 0;
          font-size: 42px;
          font-weight: 800;
        }

        .market-hero p {
          margin: 0;
          color: #d2e2f3;
          font-size: 15px;
          line-height: 1.65;
          max-width: 600px;
        }

        .market-hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .market-create-card {
          margin-top: 20px;
          background: #0d1e34;
          border: 1px solid rgba(126, 232, 220, 0.28);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .market-create-head h2 {
          margin: 4px 0 0;
          font-size: 20px;
        }

        .market-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .market-create-card label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #c5d5e8;
        }

        .market-create-card input,
        .market-create-card select,
        .market-create-card textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: #081526;
          color: #ffffff;
          font: inherit;
          font-size: 13px;
          outline: none;
        }

        .market-form-submit-row {
          display: flex;
          justify-content: flex-end;
        }

        .market-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .market-secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(126, 232, 220, 0.35);
          background: rgba(255, 255, 255, 0.05);
          color: #dcebfa;
          padding: 7px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .market-secondary-btn:hover {
          border-color: #13c8b5;
          color: #7ee8dc;
        }

        .market-btn-done {
          border: 1px solid rgba(19, 200, 181, 0.45);
          background: rgba(19, 200, 181, 0.16);
          color: #7ee8dc;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .market-banner {
          margin-top: 18px;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(19, 200, 181, 0.14);
          border: 1px solid rgba(19, 200, 181, 0.4);
          color: #9ff5eb;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .market-banner button {
          border: none;
          background: transparent;
          color: #9ff5eb;
          cursor: pointer;
        }

        .market-toolbar {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .market-search-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 15px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: #0d1e34;
          color: #ffffff;
          font-size: 14px;
          outline: none;
        }

        .market-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .market-chip {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: #0d1e34;
          color: #c8d7ea;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .market-chip.active {
          background: rgba(19, 200, 181, 0.2);
          border-color: #13c8b5;
          color: #7ee8dc;
        }

        .market-grid {
          margin-top: 20px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .market-card {
          background: #0d1e34;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .market-media-box {
          margin-bottom: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .market-card-media {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 10px;
          background: #07111f;
          cursor: pointer;
        }

        .market-media-expand {
          align-self: flex-start;
          border: 1px solid rgba(126, 232, 220, 0.3);
          background: rgba(19, 200, 181, 0.12);
          color: #7ee8dc;
          padding: 5px 11px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .market-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .market-cat-badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(52, 124, 240, 0.2);
          color: #8cc0ff;
        }

        .market-card-top small {
          color: #9cb2cc;
          font-size: 12px;
        }

        .market-card h3 {
          margin: 10px 0 0;
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.35;
        }

        .market-ver {
          color: #13c8b5;
          font-size: 14px;
        }

        .market-supplier {
          margin-top: 4px;
          font-size: 12px;
          font-weight: 700;
          color: #7ee8dc;
        }

        .market-desc {
          margin: 10px 0 10px;
          font-size: 13px;
          color: #b7c8dd;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .market-feature-box {
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.04);
          border-left: 3px solid #13c8b5;
          font-size: 12px;
        }

        .market-feature-box strong {
          display: block;
          color: #7ee8dc;
          margin-bottom: 4px;
        }

        .market-feature-box p {
          margin: 0;
          color: #dce8f7;
          line-height: 1.55;
        }

        .market-inquiry-info {
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 9px;
          background: rgba(19, 200, 181, 0.09);
          border: 1px solid rgba(19, 200, 181, 0.28);
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .market-inquiry-info strong {
          color: #7ee8dc;
        }

        .market-inquiry-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          color: #e6f2ff;
        }

        .market-inquiry-item small {
          color: #9cb2cc;
          font-size: 11px;
        }

        .market-card-divider {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 14px;
        }

        .market-card-foot {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }

        .market-price {
          font-size: 14px;
          color: #ffffff;
        }

        .market-action-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .market-sub-link-row {
          display: flex;
          justify-content: flex-start;
        }

        .market-connect-link {
          color: #7ee8dc;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .market-connect-link:hover {
          text-decoration: underline;
        }

        .market-chat-panel,
        .market-comments-panel {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed rgba(255, 255, 255, 0.14);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .market-chat-title,
        .market-comments-title {
          font-size: 12px;
          font-weight: 800;
          color: #7ee8dc;
        }

        .market-chat-reqs {
          background: rgba(52, 124, 240, 0.12);
          border: 1px solid rgba(52, 124, 240, 0.3);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 11px;
          color: #cfe4ff;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .market-comments-empty {
          margin: 0;
          font-size: 12px;
          color: #9cb2cc;
        }

        .market-chat-list,
        .market-comments-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .market-chat-list li,
        .market-comments-list li {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 12px;
        }

        .market-chat-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .market-chat-meta strong,
        .market-comments-list strong {
          color: #8cc0ff;
          font-size: 11px;
        }

        .market-chat-meta small {
          color: #9cb2cc;
          font-size: 10px;
        }

        .market-chat-list span,
        .market-comments-list span {
          color: #e6effa;
          line-height: 1.5;
        }

        .market-comment-form {
          display: flex;
          gap: 8px;
        }

        .market-comment-form input {
          flex: 1;
          min-width: 0;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: #081526;
          color: #ffffff;
          font-size: 12px;
          outline: none;
        }

        .market-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 9, 18, 0.82);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 999;
        }

        .market-modal-card {
          width: 100%;
          max-width: 720px;
          background: #0d1e34;
          border: 1px solid rgba(126, 232, 220, 0.28);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .market-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .market-modal-head strong {
          display: block;
          font-size: 16px;
        }

        .market-modal-head small {
          color: #7ee8dc;
          font-size: 12px;
        }

        .market-modal-media {
          width: 100%;
          max-height: 440px;
          object-fit: contain;
          border-radius: 10px;
          background: #07111f;
        }

        .market-modal-notes {
          margin: 0;
          font-size: 13px;
          color: #dce8f7;
          line-height: 1.6;
        }

        .market-footer {
          text-align: center;
          padding: 26px 20px;
          background: #050d18;
          color: #8fa4bf;
          font-size: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        @media (max-width: 900px) {
          .market-form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 820px) {
          .market-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
