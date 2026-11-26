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
  verified: boolean;
  connectHref: string;
  connectLabel: string;
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

const MARKET_INQUIRIES_STORAGE_KEY = "v-nect_v_market_inquiries_v1";

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
    verified: false,
    connectHref: "/v-hub",
    connectLabel: "Buka v-hub ->",
  },
];

const CATEGORIES = ["All", "Products", "Services", "Suppliers"] as const;

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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MARKET_INQUIRIES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRequestedIds(parsed.filter((item): item is string => typeof item === "string"));
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

  async function syncMarketData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setCurrentUserId(user.id);
      const fallbackName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "Member";
      setCurrentUserName(fallbackName);
      await loadUserInquiriesFromDb(user.id);
    } else {
      setCurrentUserId(null);
      setCurrentUserName(null);
      setDbSyncActive(false);
    }

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
      .limit(8);

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
          `Permintaan info untuk "${item.name}" (${item.supplier}) tersimpan ke Supabase.`
        );
        return;
      }
    }

    setInquiryBanner(
      `Permintaan penawaran / info untuk "${item.name}" (${item.supplier}) telah dicatat.`
    );
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
            <span className="market-eyebrow">MODULE 06 · PRODUCTS, SERVICES &amp; SUPPLIERS</span>
            <h1>
              v-<span>market.</span>
            </h1>
            <p>
              Discover business products, professional services, and regional suppliers across the v-nect ecosystem.
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
            placeholder="Cari produk, layanan, supplier, atau wilayah..."
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
            return (
              <article className="market-card" key={item.id}>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="market-card-img"
                  />
                )}

                <div className="market-card-top">
                  <span className="market-cat-badge">{item.category}</span>
                  <small>{item.region}</small>
                </div>

                <h3>
                  {item.name} {item.verified && <span className="market-ver">✓</span>}
                </h3>
                <div className="market-supplier">by {item.supplier}</div>
                <p className="market-desc">{item.description}</p>

                <div className="market-card-divider" />

                <div className="market-card-foot">
                  <strong className="market-price">{item.priceLabel}</strong>
                  <div className="market-action-row">
                    <Link href={item.connectHref} className="market-connect-link">
                      {item.connectLabel}
                    </Link>
                    <button
                      type="button"
                      className={requested ? "market-btn-done" : "market-btn-primary"}
                      onClick={() => handleRequestQuote(item)}
                    >
                      {requested ? "Requested ✓" : "Request Info"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

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
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 13px;
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
          max-width: 560px;
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

        .market-card-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 10px;
          background: #081424;
          margin-bottom: 12px;
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
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .market-connect-link {
          color: #7ee8dc;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .market-connect-link:hover {
          text-decoration: underline;
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
