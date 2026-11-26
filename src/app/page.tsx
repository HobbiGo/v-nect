"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { PostThreadComments } from "@/components/PostThreadComments";
import { AccountAuthModal } from "@/components/AccountAuthModal";

type HomePost = {
  id: string;
  company_id: string;
  author_id: string;
  title: string;
  content: string;
  post_type: string;
  image_url: string | null;
  image_urls?: string[] | null;
  image_captions?: string[] | null;
  status: string;
  created_at: string;
  companies: {
    company_name: string;
    logo_url: string | null;
  } | null;
};

type LocalCaptionMap = Record<string, Record<string, string>>;

type FocusTarget = {
  postId: string;
  imageIndex: number;
  trigger: number;
};

const MAX_IMAGES = 5;
const LOCAL_CAPTIONS_STORAGE_KEY =
  "v-nect_business_post_image_captions_v1";

const BRAND_LOGO_SRC = "/images/V-NECT-logo.png";
const HERO_NETWORK_IMG_SRC = "/images/logonew-v-nect.png";

const modules = [
  {
    number: "01",
    name: "v-chat",
    description: "Connect and communicate.",
    href: "/business-feed",
  },
  {
    number: "02",
    name: "v-meet",
    description: "Voice & video meetings.",
    href: "/v-meet",
  },
  {
    number: "03",
    name: "v-hub",
    description: "Build your professional identity.",
    href: "/v-hub",
  },
  {
    number: "04",
    name: "v-business feed",
    description: "Business updates & opportunities.",
    href: "/business-feed",
  },
  {
    number: "05",
    name: "v-circle",
    description: "Grow your network.",
    href: "/v-circle",
  },
  {
    number: "06",
    name: "v-market",
    description: "Products & suppliers.",
    href: "/v-market",
  },
];

const categoryLabels: Record<string, string> = {
  announcement: "Official Update",
  company_news: "Business",
  news: "Business",
  product_launch: "Trending",
  presentation: "Community",
};

function extractVideoUrlFromPost(post: HomePost): string | null {
  const text = post.content || "";

  const linkVideoMatch = text.match(
    /Link Video:\s*(https?:\/\/\S+)/i
  );

  if (linkVideoMatch?.[1]) {
    return linkVideoMatch[1].trim();
  }

  const mediaMatch = text.match(
    /(https?:\/\/\S+\.(?:mp4|webm|mov|m4v)(?:\?\S*)?)/i
  );

  if (mediaMatch?.[1]) {
    return mediaMatch[1].trim();
  }

  return null;
}

function extractVideoCaptionFromPost(post: HomePost): string {
  const text = post.content || "";
  const match = text.match(/\(VideoCaption:\s*([^)]+)\)/i);

  return match?.[1] ? match[1].trim() : "";
}

function cleanPostContentForDisplay(post: HomePost): string {
  const raw = post.content || "";

  return raw
    .replace(/\(VideoCaption:\s*[^)]*\)/gi, "")
    .replace(/^\s*Link Video:\s*https?:\/\/\S+\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatCleanPostTitle(title: string): string {
  const trimmed = (title || "").trim();
  const withoutPrefix = trimmed.replace(/^Video:\s*/i, "");

  const withoutExt = withoutPrefix.replace(
    /\.(mp4|webm|mov|m4v|avi|mkv)$/i,
    ""
  );

  const spaced = withoutExt
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!spaced) return trimmed;

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function getPostImages(post: HomePost): string[] {
  const list: string[] = [];

  if (Array.isArray(post.image_urls)) {
    for (const item of post.image_urls) {
      if (typeof item === "string" && item.trim()) {
        list.push(item.trim());
      }
    }
  }

  if (
    list.length === 0 &&
    post.image_url &&
    post.image_url.trim()
  ) {
    list.push(post.image_url.trim());
  }

  return list.slice(0, MAX_IMAGES);
}

function readLocalCaptionMap(): LocalCaptionMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(
      LOCAL_CAPTIONS_STORAGE_KEY
    );

    if (!raw) return {};

    const parsed = JSON.parse(raw);

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getPostImageCaptions(
  post: HomePost,
  images: string[]
): string[] {
  const localMap = readLocalCaptionMap()[post.id] || {};

  return images.map((url, idx) => {
    const dbCaption =
      Array.isArray(post.image_captions) &&
      typeof post.image_captions[idx] === "string"
        ? post.image_captions[idx].trim()
        : "";

    if (dbCaption) return dbCaption;

    return (localMap[url] || "").trim();
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeOrShortDate(date: string) {
  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return formatDate(date);

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}

export default function Home() {
  const [supabase] = useState(() => createClient());

  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  async function syncActiveUser() {
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

      const { data: settings } = await supabase
        .from("account_settings")
        .select("active_profile_type, active_company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (
        settings?.active_profile_type === "company" &&
        settings.active_company_id
      ) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("company_name")
          .eq("id", settings.active_company_id)
          .maybeSingle();

        if (companyData?.company_name) {
          setCurrentUserName(companyData.company_name);
        }
      }
    } else {
      setCurrentUserId(null);
      setCurrentUserName(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      setLoadingPosts(true);

      await syncActiveUser();

      const { data, error } = await supabase
        .from("business_posts")
        .select(`
          id,
          company_id,
          author_id,
          title,
          content,
          post_type,
          image_url,
          image_urls,
          status,
          created_at,
          companies (
            company_name,
            logo_url
          )
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!active) return;

      if (error) {
        console.error("Home feed load error:", error);
        setPosts([]);
      } else {
        setPosts((data || []) as unknown as HomePost[]);
      }

      setLoadingPosts(false);
    }

    loadHomeData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      if (active) {
        syncActiveUser();
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
  }

  function handleFocusImageComment(
    postId: string,
    imageIndex: number
  ) {
    setFocusTarget((prev) => ({
      postId,
      imageIndex,
      trigger: (prev?.trigger || 0) + 1,
    }));
  }

  const featuredPost = posts[0] || null;
  const spotlightPost = posts[1] || posts[0] || null;
  const sideFeedPosts = posts.slice(2, 5);

  const featuredImages = featuredPost ? getPostImages(featuredPost) : [];
  const featuredLeadImage =
    featuredImages[0] || HERO_NETWORK_IMG_SRC;

  return (
    <main className="home-page">
      <header className="navbar">
        <Link className="logo" href="/">
          <span className="logo-mark-wrap">
            <img
              src={BRAND_LOGO_SRC}
              alt="v-nect logo"
              className="logo-mark"
            />
          </span>

          <span className="logo-text-wrap">
            <span className="logo-main">
              v<span>-nect</span>
            </span>
            <small>GLOBAL BUSINESS ECOSYSTEM</small>
          </span>
        </Link>

        <nav>
          <a href="#platform">Home</a>
          <a href="#community-posts">Explore</a>
          <a href="#community-posts">Community</a>
          <a href="#business">Business</a>
          <a href="#about">More</a>

          <Link className="nav-button" href="/business-feed">
            Business Feed →
          </Link>
        </nav>

        <div className="nav-right-actions">
          {currentUserName ? (
            <>
              <span className="nav-account-badge">
                ● {currentUserName}
              </span>

              <button
                type="button"
                className="nav-ghost-btn"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              className="nav-ghost-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      <section className="hero" id="about">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            THE v-NECT ECOSYSTEM
          </div>

          <h1>
            Everything
            <span> Connected.</span>
          </h1>

          <p>
            A unified digital environment designed to bring
            businesses and people closer, without boundaries.
          </p>

          <div className="hero-actions" id="get-started">
            <a className="primary-button" href="#platform">
              Explore Platform →
            </a>

            <Link className="secondary-button" href="/business-feed">
              Watch Overview
            </Link>
          </div>

          <div className="hero-stats-strip">
            <div className="hero-stat-item">
              <strong>1M+</strong>
              <span>Global Users</span>
            </div>
            <div className="hero-stat-item">
              <strong>100K+</strong>
              <span>Businesses</span>
            </div>
            <div className="hero-stat-item">
              <strong>150+</strong>
              <span>Countries</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-ambient-glow" />

          <svg
            className="hero-connector-svg"
            viewBox="0 0 600 400"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="voinBeamGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#347cf0" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#13c8b5" stopOpacity="0.95" />
              </linearGradient>
            </defs>

            <line x1="68" y1="42" x2="255" y2="165" className="connector-base" />
            <line x1="532" y1="42" x2="345" y2="165" className="connector-base" />
            <line x1="78" y1="358" x2="258" y2="236" className="connector-base" />
            <line x1="532" y1="358" x2="342" y2="236" className="connector-base" />

            <line x1="68" y1="42" x2="255" y2="165" stroke="url(#voinBeamGrad)" className="connector-pulse pulse-one" />
            <line x1="532" y1="42" x2="345" y2="165" stroke="url(#voinBeamGrad)" className="connector-pulse pulse-two" />
            <line x1="78" y1="358" x2="258" y2="236" stroke="url(#voinBeamGrad)" className="connector-pulse pulse-three" />
            <line x1="532" y1="358" x2="342" y2="236" stroke="url(#voinBeamGrad)" className="connector-pulse pulse-four" />

            <circle cx="255" cy="165" r="4" className="connector-node" />
            <circle cx="345" cy="165" r="4" className="connector-node" />
            <circle cx="258" cy="236" r="4" className="connector-node" />
            <circle cx="342" cy="236" r="4" className="connector-node" />
          </svg>

          <img
            src={HERO_NETWORK_IMG_SRC}
            alt="v-nect Global Business Network"
            className="hero-network-img"
          />

          <div className="orbit-label label-one">BUSINESS</div>
          <div className="orbit-label label-two">CONNECT</div>
          <div className="orbit-label label-three">COMMUNITY</div>
          <div className="orbit-label label-four">GLOBAL</div>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-top-bar">
          <div className="section-heading">
            <span className="section-bar-tag">v-nect Ecosystem</span>
          </div>

          <Link href="/business-feed" className="section-top-link">
            Discover all powerful features in one platform →
          </Link>
        </div>

        <div className="module-grid">
          {modules.map((module) => (
            <Link
              href={module.href}
              className="module-card module-card-link"
              key={module.number}
            >
              <span className="module-icon-badge">{module.number}</span>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <span className="module-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST POSTS & DISCUSSION (UNIFIED LIGHT HUB) */}

      <section className="home-posts-section" id="community-posts">
        <div className="home-posts-inner">
          <div className="home-posts-header">
            <div className="home-posts-heading-copy">
              <span className="home-posts-kicker">
                ✦ LIVE COMMUNITY
              </span>

              <h2>
                Latest Posts <span>&amp; Discussion</span>
              </h2>

              <p>
                Explore business insights, join the conversation, and be part
                of our growing community.
              </p>
            </div>

            <Link href="/business-feed" className="view-all-link">
              View Full Feed <span>→</span>
            </Link>
          </div>

          {loadingPosts ? (
            <div className="home-posts-empty">
              <div className="loading-orb" />
              <p>Loading latest posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="home-posts-empty">
              <div className="empty-icon">✦</div>
              <h3>Be the first to share.</h3>
              <p>Published business updates will appear here.</p>

              <Link href="/business-feed" className="primary-button">
                View Full Feed →
              </Link>
            </div>
          ) : (
            <div className="hub-bento-grid">
              {/* 1. FEATURED POST */}
              {featuredPost && (
                <article className="hub-featured-card">
                  <img
                    src={featuredLeadImage}
                    alt={formatCleanPostTitle(featuredPost.title)}
                    className="hub-featured-bg"
                  />
                  <div className="hub-featured-scrim" />

                  <div className="hub-featured-content">
                    <span className="hub-featured-pill">
                      ★ Featured
                    </span>

                    <h3>{formatCleanPostTitle(featuredPost.title)}</h3>

                    <p>
                      {cleanPostContentForDisplay(featuredPost) ||
                        "Connecting companies, professionals, and communities across v-nect."}
                    </p>

                    <div className="hub-featured-brand">
                      <span className="hub-mini-mark">v</span>
                      <span>
                        {featuredPost.companies?.company_name || "v-nect"}
                      </span>
                    </div>
                  </div>
                </article>
              )}

              {/* 2. OFFICIAL / SPOTLIGHT POST + FULL THREAD */}
              {spotlightPost && (() => {
                const postImages = getPostImages(spotlightPost);
                const postImageCaptions = getPostImageCaptions(
                  spotlightPost,
                  postImages
                );
                const videoUrl = extractVideoUrlFromPost(spotlightPost);
                const videoCaption = extractVideoCaptionFromPost(spotlightPost);
                const displayContent = cleanPostContentForDisplay(spotlightPost);
                const displayTitle = formatCleanPostTitle(spotlightPost.title);
                const isFocusedPost = focusTarget?.postId === spotlightPost.id;

                return (
                  <article className="hub-spotlight-card">
                    <div className="home-post-top">
                      <div className="home-company-info">
                        {spotlightPost.companies?.logo_url ? (
                          <img
                            src={spotlightPost.companies.logo_url}
                            alt={
                              spotlightPost.companies.company_name || "Company"
                            }
                          />
                        ) : (
                          <div className="home-company-avatar">
                            {spotlightPost.companies?.company_name
                              ?.charAt(0)
                              .toUpperCase() || "V"}
                          </div>
                        )}

                        <div>
                          <strong>
                            {spotlightPost.companies?.company_name ||
                              "v-nect Official"}{" "}
                            <span className="verified-check">✓</span>
                          </strong>
                          <small>{formatDate(spotlightPost.created_at)}</small>
                        </div>
                      </div>

                      <span className="home-post-badge">
                        {categoryLabels[spotlightPost.post_type] ||
                          spotlightPost.post_type ||
                          "Business"}
                      </span>
                    </div>

                    <div className="home-post-body">
                      <h3>{displayTitle}</h3>
                      {displayContent && <p>{displayContent}</p>}

                      {videoUrl && (
                        <div className="home-video-box">
                          <video
                            src={videoUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="home-video-player"
                          />
                          <div className="home-video-footer">
                            <span className="home-video-caption">
                              {videoCaption || "Video Clip"}
                            </span>
                            <a
                              href={videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open Video ↗
                            </a>
                          </div>
                        </div>
                      )}

                      {postImages.length > 0 && (
                        <div
                          className={
                            postImages.length === 1
                              ? "home-images-grid single"
                              : "home-images-grid multi"
                          }
                        >
                          {postImages.map((imgUrl, idx) => {
                            const captionText = postImageCaptions[idx] || "";
                            return (
                              <div
                                className="home-image-card"
                                key={`${spotlightPost.id}-spot-img-${idx}`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${displayTitle} (${idx + 1})`}
                                  loading="lazy"
                                />
                                <div className="home-image-bar">
                                  <span className="home-image-caption">
                                    {captionText || `Image ${idx + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    className="home-image-comment-btn"
                                    onClick={() =>
                                      handleFocusImageComment(
                                        spotlightPost.id,
                                        idx
                                      )
                                    }
                                    title={`Comment on ${
                                      captionText || `Image ${idx + 1}`
                                    }`}
                                  >
                                    💬
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <PostThreadComments
                      supabase={supabase}
                      postId={spotlightPost.id}
                      currentUserId={currentUserId}
                      currentUserName={currentUserName}
                      imageLabels={postImages.map(
                        (_, idx) =>
                          postImageCaptions[idx] || `Image ${idx + 1}`
                      )}
                      focusedImageIndex={
                        isFocusedPost ? focusTarget.imageIndex : null
                      }
                      focusTrigger={isFocusedPost ? focusTarget.trigger : 0}
                    />
                  </article>
                );
              })()}

              {/* 3. TRENDING DISCUSSIONS, BUSINESS INSIGHTS & COMMUNITY UPDATES */}
              <aside className="hub-side-stack">
                {sideFeedPosts.map((item, idx) => {
                  const itemImages = getPostImages(item);
                  const thumbSrc =
                    itemImages[0] ||
                    item.companies?.logo_url ||
                    HERO_NETWORK_IMG_SRC;
                  const badgeText =
                    categoryLabels[item.post_type] ||
                    (idx === 0
                      ? "Community"
                      : idx === 1
                      ? "Business"
                      : "Networking");

                  return (
                    <Link
                      href="/business-feed"
                      className="hub-side-item"
                      key={item.id}
                    >
                      <img
                        src={thumbSrc}
                        alt={formatCleanPostTitle(item.title)}
                        className="hub-side-thumb"
                        loading="lazy"
                      />

                      <div className="hub-side-body">
                        <h4>{formatCleanPostTitle(item.title)}</h4>
                        <div className="hub-side-meta">
                          <span className="hub-side-time">
                            🕒 {formatRelativeOrShortDate(item.created_at)}
                          </span>
                          <span className="hub-side-tag">{badgeText}</span>
                        </div>
                      </div>

                      <span className="hub-side-chevron">›</span>
                    </Link>
                  );
                })}
              </aside>
            </div>
          )}

          {/* JOIN V-NECT TODAY BANNER */}
          <div className="join-cta-banner" id="business">
            <div className="join-cta-left">
              <div className="join-cta-icon">📈</div>
              <div>
                <h3>Join v-nect Today</h3>
                <p>
                  Be part of a global ecosystem for endless opportunities.
                </p>
              </div>
            </div>

            <Link href="/business-feed" className="join-cta-btn">
              Get Started →
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          v<span>-nect</span>
        </div>
        <p>Connect Beyond Boundaries.</p>
        <small>© 2026 v-nect. All rights reserved.</small>
      </footer>

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => syncActiveUser()}
      />

      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 78% 14%, rgba(78, 108, 255, 0.34), transparent 36%),
            radial-gradient(circle at 22% 28%, rgba(28, 63, 184, 0.28), transparent 42%),
            linear-gradient(180deg, #060b24 0%, #091338 52%, #060b24 100%);
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
        }

        .navbar {
          min-height: 76px;
          padding: 12px 6%;
          background: rgba(6, 11, 34, 0.78);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(138, 165, 255, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .logo {
          color: #fff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .logo-mark-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f7cff, #7b5cff);
          display: grid;
          place-items: center;
          overflow: hidden;
          padding: 4px;
        }

        .logo-mark {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .logo-text-wrap {
          display: inline-flex;
          flex-direction: column;
        }

        .logo-main {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: 0.4px;
          white-space: nowrap;
          line-height: 1.1;
        }

        .logo-main span {
          color: #8ab4ff;
        }

        .logo small {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.3px;
          color: #9cb0d9;
          margin-top: 2px;
          white-space: nowrap;
        }

        .navbar nav {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .navbar nav a {
          color: #d9e4ff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .navbar nav a:hover {
          color: #8ab4ff;
        }

        .nav-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .nav-account-badge {
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(91, 124, 255, 0.18);
          border: 1px solid rgba(138, 165, 255, 0.42);
          color: #b7ccff;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .nav-ghost-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(154, 178, 255, 0.28);
          color: #eef3ff;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .nav-ghost-btn:hover {
          border-color: #8ab4ff;
          background: rgba(138, 180, 255, 0.14);
        }

        .navbar nav a.nav-button {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #fff;
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .hero {
          max-width: 1220px;
          margin: 0 auto;
          padding: 54px 24px 44px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
          gap: 28px;
          align-items: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #9ec0ff;
          background: rgba(63, 97, 232, 0.18);
          border: 1px solid rgba(136, 166, 255, 0.28);
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5eead4;
        }

        .hero h1 {
          font-size: clamp(38px, 4.6vw, 56px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.8px;
          margin: 16px 0 14px;
          color: #ffffff;
        }

        .hero h1 span {
          color: #7da6ff;
        }

        .hero p {
          color: #c2d1f0;
          font-size: 16px;
          line-height: 1.72;
          max-width: 540px;
          margin: 0;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .primary-button {
          background: linear-gradient(110deg, #4b6bff, #7357ff);
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(75, 107, 255, 0.35);
        }

        .primary-button:hover {
          transform: translateY(-2px);
        }

        .secondary-button {
          background: rgba(16, 29, 78, 0.72);
          border: 1px solid rgba(145, 173, 255, 0.34);
          color: #e6eeff;
        }

        .secondary-button:hover {
          background: rgba(34, 57, 134, 0.78);
        }

        .hero-stats-strip {
          display: flex;
          align-items: center;
          gap: 26px;
          flex-wrap: wrap;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(145, 173, 255, 0.16);
        }

        .hero-stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hero-stat-item strong {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
        }

        .hero-stat-item span {
          font-size: 12px;
          color: #9cb2dc;
        }

        .hero-visual {
          position: relative;
          min-height: 390px;
          width: 100%;
          display: grid;
          place-items: center;
          padding: 20px 8px;
        }

        .hero-ambient-glow {
          position: absolute;
          width: 430px;
          height: 290px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(88, 124, 255, 0.34),
            rgba(19, 200, 181, 0.16) 55%,
            transparent 80%
          );
          filter: blur(26px);
          pointer-events: none;
        }

        .hero-connector-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        }

        .connector-base {
          stroke: rgba(145, 173, 255, 0.24);
          stroke-width: 1.4;
          stroke-linecap: round;
        }

        .connector-pulse {
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-dasharray: 10 14;
          filter: drop-shadow(0 0 6px rgba(114, 154, 255, 0.65));
          animation: voinFlowDash 2.2s linear infinite;
        }

        .pulse-two {
          animation-delay: -0.55s;
        }
        .pulse-three {
          animation-delay: -1.1s;
        }
        .pulse-four {
          animation-delay: -1.65s;
        }

        .connector-node {
          fill: #8bb4ff;
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 7px rgba(114, 154, 255, 0.85));
          animation: voinNodePulse 2.4s ease-in-out infinite;
        }

        @keyframes voinFlowDash {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -48;
          }
        }

        @keyframes voinNodePulse {
          0%,
          100% {
            opacity: 0.65;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.22);
          }
        }

        .hero-network-img {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 600px;
          max-height: 360px;
          object-fit: contain;
          filter: drop-shadow(0 14px 32px rgba(59, 99, 246, 0.28));
        }

        .orbit-label {
          position: absolute;
          z-index: 3;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #b7ceff;
          background: rgba(13, 25, 68, 0.92);
          border: 1px solid rgba(138, 165, 255, 0.36);
          padding: 5px 11px;
          border-radius: 999px;
        }

        .label-one {
          top: 10px;
          left: 3%;
        }
        .label-two {
          top: 10px;
          right: 3%;
        }
        .label-three {
          bottom: 10px;
          left: 3%;
        }
        .label-four {
          bottom: 10px;
          right: 3%;
        }

        .platform-section {
          max-width: 1220px;
          margin: 0 auto;
          padding: 18px 24px 48px;
        }

        .section-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .section-bar-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #eef3ff;
          font-size: 15px;
          font-weight: 700;
        }

        .section-bar-tag::before {
          content: "";
          width: 4px;
          height: 16px;
          border-radius: 999px;
          background: linear-gradient(180deg, #5f85ff, #13c8b5);
        }

        .section-top-link {
          color: #9cb8ff;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }

        .section-top-link:hover {
          color: #ffffff;
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px;
        }

        .module-card {
          background: linear-gradient(
            165deg,
            rgba(23, 41, 102, 0.85),
            rgba(12, 22, 60, 0.92)
          );
          border: 1px solid rgba(145, 173, 255, 0.22);
          border-radius: 16px;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          color: inherit;
          text-decoration: none;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .module-card-link:hover {
          border-color: #8ab4ff;
          transform: translateY(-3px);
        }

        .module-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #5677ff, #7c58ff);
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          display: grid;
          place-items: center;
          margin-bottom: 4px;
        }

        .module-card h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }

        .module-card p {
          margin: 0;
          color: #a9bce2;
          font-size: 11.5px;
          line-height: 1.45;
        }

        .module-arrow {
          margin-top: auto;
          padding-top: 6px;
          font-size: 12px;
          color: #9cb8ff;
          font-weight: 700;
        }

        /* LATEST POSTS & DISCUSSION (UNIFIED LIGHT HUB) */

        .home-posts-section {
          position: relative;
          background: linear-gradient(
            180deg,
            #eef2fb 0%,
            #e8eefb 62%,
            #dfe7f8 100%
          );
          color: #131c36;
          padding: 46px 24px 44px;
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -16px 40px rgba(4, 9, 28, 0.35);
        }

        .home-posts-inner {
          max-width: 1220px;
          margin: 0 auto;
        }

        .home-posts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .home-posts-heading-copy {
          max-width: 680px;
        }

        .home-posts-kicker {
          color: #4b5ce6;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.6px;
          display: inline-block;
        }

        .home-posts-header h2 {
          color: #0e1733;
          font-size: clamp(28px, 3.6vw, 40px);
          font-weight: 800;
          letter-spacing: -0.8px;
          line-height: 1.15;
          margin: 8px 0 8px;
        }

        .home-posts-header h2 span {
          color: #4f63ff;
        }

        .home-posts-header p {
          color: #526080;
          font-size: 14px;
          line-height: 1.65;
          margin: 0;
        }

        .view-all-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #1a264a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          padding: 10px 16px;
          background: #ffffff;
          border: 1px solid #cfd8ee;
          border-radius: 10px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(18, 30, 74, 0.06);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .view-all-link:hover {
          border-color: #4f63ff;
          transform: translateY(-1px);
        }

        .hub-bento-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        /* 1. FEATURED CARD */
        .hub-featured-card {
          position: relative;
          min-height: 360px;
          border-radius: 18px;
          overflow: hidden;
          background: #0d1a40;
          border: 1px solid #d2dcf0;
          box-shadow: 0 12px 28px rgba(17, 29, 69, 0.12);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .hub-featured-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hub-featured-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(8, 16, 44, 0.28) 0%,
            rgba(8, 16, 44, 0.72) 55%,
            rgba(7, 13, 36, 0.94) 100%
          );
        }

        .hub-featured-content {
          position: relative;
          z-index: 2;
          padding: 20px;
          color: #ffffff;
        }

        .hub-featured-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(114, 92, 255, 0.92);
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .hub-featured-content h3 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 800;
          line-height: 1.25;
          color: #ffffff;
          overflow-wrap: anywhere;
        }

        .hub-featured-content p {
          margin: 0 0 14px;
          font-size: 12.5px;
          line-height: 1.55;
          color: #d6e0f7;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hub-featured-brand {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 700;
          color: #eef3ff;
        }

        .hub-mini-mark {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: linear-gradient(135deg, #4b6bff, #13c8b5);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          display: grid;
          place-items: center;
        }

        /* 2. SPOTLIGHT / OFFICIAL CARD */
        .hub-spotlight-card {
          min-width: 0;
          background: #ffffff;
          border: 1px solid #d8e1f3;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 24px rgba(17, 29, 69, 0.07);
          color: #15203d;
        }

        .home-post-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding-bottom: 12px;
          border-bottom: 1px solid #ea eff9;
        }

        .home-company-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .home-company-info img,
        .home-company-avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .home-company-avatar {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #1b2f6e, #4f63ff);
          color: #fff;
          font-size: 14px;
          font-weight: 800;
        }

        .home-company-info strong {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #111b38;
          font-size: 13px;
          font-weight: 700;
        }

        .verified-check {
          display: inline-grid;
          place-items: center;
          width: 15px;
          height: 15px;
          border-radius: 999px;
          background: #3b82f6;
          color: #fff;
          font-size: 9px;
        }

        .home-company-info small {
          display: block;
          color: #6b7896;
          font-size: 11px;
          margin-top: 2px;
        }

        .home-post-badge {
          background: #eef2ff;
          color: #3b5bdb;
          border: 1px solid #d4ddff;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
        }

        .home-post-body {
          padding: 14px 0 6px;
        }

        .home-post-body h3 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 800;
          line-height: 1.38;
          color: #101935;
          overflow-wrap: anywhere;
        }

        .home-post-body p {
          margin: 0;
          color: #4d5b7a;
          font-size: 12.5px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .home-video-box {
          margin-top: 12px;
          border-radius: 12px;
          overflow: hidden;
          background: #09132e;
          border: 1px solid #d6dfef;
        }

        .home-video-player {
          display: block;
          width: 100%;
          max-height: 280px;
          background: #09132e;
        }

        .home-video-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 12px;
          background: #14224a;
          color: #eef3ff;
          font-size: 11.5px;
          font-weight: 600;
        }

        .home-video-caption {
          overflow-wrap: anywhere;
        }

        .home-video-footer a {
          color: #8ab4ff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .home-images-grid {
          margin-top: 12px;
          display: grid;
          gap: 8px;
        }

        .home-images-grid.single {
          grid-template-columns: 1fr;
        }

        .home-images-grid.multi {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .home-image-card {
          min-width: 0;
          border-radius: 10px;
          overflow: hidden;
          background: #f5f8fe;
          border: 1px solid #dce4f4;
        }

        .home-image-card img {
          display: block;
          width: 100%;
          max-height: 220px;
          object-fit: cover;
        }

        .home-image-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 6px 10px;
          background: #f8faff;
          color: #263457;
          border-top: 1px solid #e4eaf7;
        }

        .home-image-caption {
          font-size: 11px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .home-image-comment-btn {
          border: 1px solid #cfd8ee;
          background: #ffffff;
          color: #1b284d;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 12px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .home-image-comment-btn:hover {
          background: #eef2ff;
          border-color: #4f63ff;
        }

        /* 3. SIDE FEED STACK */
        .hub-side-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hub-side-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #d8e1f3;
          border-radius: 14px;
          padding: 10px 12px;
          text-decoration: none;
          color: #131d38;
          box-shadow: 0 6px 18px rgba(17, 29, 69, 0.05);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .hub-side-item:hover {
          transform: translateY(-2px);
          border-color: #6b7cff;
        }

        .hub-side-thumb {
          width: 66px;
          height: 66px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          background: #e6ecf9;
        }

        .hub-side-body {
          flex: 1;
          min-width: 0;
        }

        .hub-side-body h4 {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.35;
          color: #121c38;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .hub-side-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .hub-side-time {
          font-size: 10.5px;
          color: #687694;
          font-weight: 600;
        }

        .hub-side-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: #e9f7ef;
          color: #1f7a4c;
        }

        .hub-side-chevron {
          color: #8a97b5;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* JOIN BANNER */
        .join-cta-banner {
          margin-top: 24px;
          background: linear-gradient(110deg, #1b2d7a, #3c349c 60%, #1c3d82);
          border: 1px solid rgba(138, 165, 255, 0.35);
          border-radius: 18px;
          padding: 20px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          color: #ffffff;
          box-shadow: 0 12px 28px rgba(14, 24, 66, 0.16);
        }

        .join-cta-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .join-cta-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.14);
          display: grid;
          place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .join-cta-banner h3 {
          margin: 0 0 3px;
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
        }

        .join-cta-banner p {
          margin: 0;
          font-size: 12.5px;
          color: #cdd8f8;
        }

        .join-cta-btn {
          background: linear-gradient(110deg, #5677ff, #7c58ff);
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 18px;
          border-radius: 10px;
          white-space: nowrap;
        }

        .home-posts-empty {
          background: #ffffff;
          border: 1px solid #d8e1f3;
          border-radius: 16px;
          padding: 38px 24px;
          text-align: center;
          color: #526080;
        }

        .home-posts-empty h3 {
          color: #121c38;
          margin: 10px 0 6px;
          font-size: 19px;
        }

        .home-posts-empty p {
          font-size: 13px;
          margin: 0 0 16px;
        }

        .empty-icon {
          font-size: 28px;
          color: #4f63ff;
        }

        .loading-orb {
          width: 28px;
          height: 28px;
          margin: 0 auto 12px;
          border: 3px solid rgba(79, 99, 255, 0.2);
          border-top-color: #4f63ff;
          border-radius: 50%;
          animation: loadingSpin 0.8s linear infinite;
        }

        @keyframes loadingSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .footer {
          text-align: center;
          padding: 28px 20px;
          background: #050a20;
          color: #96a8d0;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
        }

        .footer-logo {
          color: #fff;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0.4px;
        }

        .footer-logo span {
          color: #8ab4ff;
        }

        .footer p {
          margin: 6px 0 4px;
          font-size: 13.5px;
          color: #d9e4ff;
        }

        .footer small {
          font-size: 11.5px;
        }

        @media (max-width: 1024px) {
          .module-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .hub-bento-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .navbar {
            justify-content: center;
          }

          .hero {
            grid-template-columns: 1fr;
            padding-top: 34px;
          }
        }

        @media (max-width: 540px) {
          .navbar {
            padding: 12px 16px;
          }

          .navbar nav {
            justify-content: center;
            gap: 12px;
          }

          .navbar nav a {
            font-size: 12px;
          }

          .nav-right-actions {
            justify-content: center;
          }

          .hero-visual {
            min-height: 265px;
          }

          .module-grid,
          .home-images-grid.multi {
            grid-template-columns: 1fr;
          }

          .home-posts-section {
            padding: 36px 14px 36px;
            border-radius: 20px 20px 0 0;
          }

          .join-cta-banner {
            padding: 18px 16px;
          }
        }
      `}</style>
    </main>
  );
}
