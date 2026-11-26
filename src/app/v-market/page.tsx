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
  imageUrl?: string | null;
  videoUrl?: string | null;
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

type LaunchPostRow = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
  companies: {
    company_name: string;
  } | null;
};

const MARKET_INQUIRIES_STORAGE_KEY = "v-nect_v_market_inquiries_v1";
const MARKET_COMMENTS_STORAGE_KEY = "v-nect_v_market_comments_v1";

const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: "mkt-1",
    name: "Orbiss Promo Showcase & Video Kit",
    supplier: "Orbiss Commerce",
    category: "Products",
    region: "Singapore & APAC",
    priceLabel: "From $290 / batch",
    description:
      "Short-form product highlight clips and commercial launch assets ready for multi-channel campaign deployment.",
    imageUrl: null,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
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
    imageUrl: null,
    videoUrl: null,
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
    imageUrl: null,
    videoUrl: null,
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
    imageUrl: null,
    videoUrl: null,
    verified: false,
    connectHref: "/v-hub",
    connectLabel: "Buka v-hub ->",
  },
];

const CATEGORIES = ["All", "Products", "Services", "Suppliers"] as const;

function extractVideoUrl(rawContent: string, explicitVideo?: string | null): string | null {
  if (explicitVideo && explicitVideo.trim()) {
    return explicitVideo.trim();
  }
  const match = rawContent.match(/Link Video:\s*(https?:\/\/\S+)/i);
  return match ? match[1].trim() : null;
}

export default function VMarketPage() {
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbSyncActive, setDbSyncActive] = useState(false);

  const [liveLaunchListings, setLiveLaunchListings] = useState<MarketplaceListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [inquiryBanner, setInquiryBanner] = useState("");

  // Media preview modal (foto / video)
  const [previewMedia, setPreviewMedia] = useState<{
    title: string;
    supplier: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
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
        if (Array.isArray(parsed)) {
          setRequestedIds(parsed.filter((item): item is string => typeof item === "string"));
        }
      }

      const rawCom = window.localStorage.getItem(MARKET_COMMENTS_STORAGE_KEY);
      if (rawCom) {
        const parsedCom = JSON.parse(rawCom);
        if (parsedCom && typeof parsedCom === "object") {
          setCommentsByListing(parsedCom as Record<string, MarketComment[]>);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  async function loadUserInquiriesFromDb(uid: string) {
    const { data, error } = await supabase
      .from("v_market_inquiries")
      .select("listing_key")
      .eq("user_id", uid);

    if (!error && Array.isArray(data)) {
      setDbSyncActive(true);
      if (data.length > 0) {
        setRequestedIds(data.map((row) => row.listing_key));
      }
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
        }
      }

      setCurrentUserName(displayName);
      await loadUserInquiriesFromDb(user.id);
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
        video_url,
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
        const vid = extractVideoUrl(row.content || "", row.video_url);
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
          imageUrl: img,
          videoUrl: vid,
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

  const allListings = useMemo(
    () => [...liveLaunchListings, ...INITIAL_LISTINGS],
    [liveLaunchListings]
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
        item.description.toLowerCase().includes(q)
      );
    });
  }, [allListings, searchQuery, selectedCategory]);

  async function handleRequestQuote(item: MarketplaceListing) {
    const nextIds = requestedIds.includes(item.id)
      ? requestedIds
      : [...requestedIds, item.id];
    setRequestedIds(nextIds);

    try {
      window.localStorage.setItem(MARKET_INQUIRIES_STORAGE_KEY, JSON.stringify(nextIds));
    } catch {
      // Ignore storage errors
    }

    if (currentUserId) {
      const { error } = await supabase.from("v_market_inquiries").upsert(
        {
          user_id: currentUserId,
          listing_key: item.id,
          listing_name: item.name,
          supplier_name: item.supplier,
        },
        { onConflict: "user_id,listing_key" }
      );

      if (!error) {
        setDbSyncActive(true);
        setInquiryBanner(
          `Interaksi bisnis & permintaan info untuk "${item.name}" (${item.supplier}) tersimpan ke Supabase.`
        );
        return;
      }
    }

    setInquiryBanner(
      `Interaksi bisnis / permintaan info untuk "${item.name}" (${item.supplier}) telah dicatat.`
    );
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
            <span className="market-eyebrow">MODULE 06 · COMPANY PRODUCTS, MEDIA &amp; B2B DISCUSSION</span>
            <h1>
              v-<span>market.</span>
            </h1>
            <p>
              Explore products posted by companies, inspect photos or videos, comment as another company, and initiate business inquiries.
            </p>
          </div>

          <div className="market-hero-actions">
            <Link href="/business-feed" className="market-btn-primary">
              Publish Product Launch -&gt;
            </Link>
          </div>
        </div>

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
            placeholder="Cari produk, layanan, perusahaan/supplier, atau wilayah..."
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
            const requested = requestedIds.includes(item.id);
            const itemComments = commentsByListing[item.id] || [];
            const isCommentsOpen = openCommentsForId === item.id;
            const hasMedia = Boolean(item.imageUrl || item.videoUrl);

            return (
              <article className="market-card" key={item.id}>
                {item.videoUrl ? (
                  <div className="market-media-box">
                    <video
                      src={item.videoUrl}
                      controls
                      preload="metadata"
                      className="market-card-media"
                    />
                    <button
                      type="button"
                      className="market-media-expand"
                      onClick={() =>
                        setPreviewMedia({
                          title: item.name,
                          supplier: item.supplier,
                          imageUrl: item.imageUrl,
                          videoUrl: item.videoUrl,
                        })
                      }
                    >
                      Lihat Video Penuh
                    </button>
                  </div>
                ) : item.imageUrl ? (
                  <div className="market-media-box">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="market-card-media"
                      onClick={() =>
                        setPreviewMedia({
                          title: item.name,
                          supplier: item.supplier,
                          imageUrl: item.imageUrl,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="market-media-expand"
                      onClick={() =>
                        setPreviewMedia({
                          title: item.name,
                          supplier: item.supplier,
                          imageUrl: item.imageUrl,
                        })
                      }
                    >
                      Klik Lihat Foto
                    </button>
                  </div>
                ) : null}

                <div className="market-card-top">
                  <span className="market-cat-badge">{item.category}</span>
                  <small>{item.region}</small>
                </div>

                <h3>
                  {item.name} {item.verified && <span className="market-ver">✓</span>}
                </h3>
                <div className="market-supplier">Posted by {item.supplier}</div>
                <p className="market-desc">{item.description}</p>

                <div className="market-card-divider" />

                <div className="market-card-foot">
                  <strong className="market-price">{item.priceLabel}</strong>

                  <div className="market-action-row">
                    {hasMedia && (
                      <button
                        type="button"
                        className="market-secondary-btn"
                        onClick={() =>
                          setPreviewMedia({
                            title: item.name,
                            supplier: item.supplier,
                            imageUrl: item.imageUrl,
                            videoUrl: item.videoUrl,
                          })
                        }
                      >
                        {item.videoUrl ? "Buka Video" : "Lihat Foto"}
                      </button>
                    )}

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
                      {requested ? "Requested ✓" : "Request Info"}
                    </button>
                  </div>

                  <div className="market-sub-link-row">
                    <Link href={item.connectHref} className="market-connect-link">
                      {item.connectLabel}
                    </Link>
                  </div>
                </div>

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

      {previewMedia && (
        <div
          className="market-modal-backdrop"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="market-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="market-modal-head">
              <div>
                <strong>{previewMedia.title}</strong>
                <small>by {previewMedia.supplier}</small>
              </div>
              <button
                type="button"
                className="market-ghost-btn"
                onClick={() => setPreviewMedia(null)}
              >
                Tutup ✕
              </button>
            </div>

            {previewMedia.videoUrl ? (
              <video
                src={previewMedia.videoUrl}
                controls
                autoPlay
                className="market-modal-media"
              />
            ) : previewMedia.imageUrl ? (
              <img
                src={previewMedia.imageUrl}
                alt={previewMedia.title}
                className="market-modal-media"
              />
            ) : null}
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
          max-width: 580px;
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
          border: 1px solid rgba(126, 232, 220, 0.35);
          background: rgba(255, 255, 255, 0.05);
          color: #dcebfa;
          padding: 7px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
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
          max-height: 220px;
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
          margin: 10px 0 16px;
          font-size: 13px;
          color: #b7c8dd;
          line-height: 1.65;
          overflow-wrap: anywhere;
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

        .market-comments-panel {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed rgba(255, 255, 255, 0.14);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .market-comments-title {
          font-size: 12px;
          font-weight: 800;
          color: #7ee8dc;
        }

        .market-comments-empty {
          margin: 0;
          font-size: 12px;
          color: #9cb2cc;
        }

        .market-comments-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .market-comments-list li {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
        }

        .market-comments-list strong {
          color: #8cc0ff;
          font-size: 11px;
        }

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

        .market-footer {
          text-align: center;
          padding: 26px 20px;
          background: #050d18;
          color: #8fa4bf;
          font-size: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
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
