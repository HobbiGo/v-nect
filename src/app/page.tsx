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

type EcosystemModule = {
  icon: string;
  tag: string;
  accent: string;
  border: string;
  name: string;
  description: string;
  href: string;
};

const MAX_IMAGES = 5;
const LOCAL_CAPTIONS_STORAGE_KEY =
  "v-nect_business_post_image_captions_v1";

const BRAND_LOGO_SRC = "/images/V-NECT-logo.png";
const HERO_NETWORK_IMG_SRC = "/images/logonew-v-nect.png";

const modules: EcosystemModule[] = [
  {
    icon: "💬",
    tag: "CHAT & MESSAGING",
    accent: "#36b9ff",
    border: "rgba(54, 185, 255, 0.34)",
    name: "v-chat",
    description: "Connect and communicate.",
    href: "/business-feed",
  },
  {
    icon: "🎥",
    tag: "LIVE MEETINGS",
    accent: "#bd78ff",
    border: "rgba(189, 120, 255, 0.34)",
    name: "v-meet",
    description: "Voice & video meetings.",
    href: "/v-meet",
  },
  {
    icon: "✣",
    tag: "IDENTITY HUB",
    accent: "#32dce9",
    border: "rgba(50, 220, 233, 0.34)",
    name: "v-hub",
    description: "Build your professional identity.",
    href: "/v-hub",
  },
  {
    icon: "▤",
    tag: "BUSINESS FEED",
    accent: "#559fff",
    border: "rgba(85, 159, 255, 0.34)",
    name: "v-business feed",
    description: "Business updates & opportunities.",
    href: "/business-feed",
  },
  {
    icon: "👥",
    tag: "NETWORK CIRCLE",
    accent: "#f472b6",
    border: "rgba(244, 114, 182, 0.34)",
    name: "v-circle",
    description: "Grow your network.",
    href: "/v-circle",
  },
  {
    icon: "🛒",
    tag: "MARKETPLACE",
    accent: "#fbbf24",
    border: "rgba(251, 191, 36, 0.34)",
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
  const linkVideoMatch = text.match(/Link Video:\s*(https?:\/\/\S+)/i);

  if (linkVideoMatch?.[1]) return linkVideoMatch[1].trim();

  const mediaMatch = text.match(
    /(https?:\/\/\S+\.(?:mp4|webm|mov|m4v)(?:\?\S*)?)/i
  );

  return mediaMatch?.[1] ? mediaMatch[1].trim() : null;
}

function extractVideoCaptionFromPost(post: HomePost): string {
  const match = (post.content || "").match(/\(VideoCaption:\s*([^)]+)\)/i);
  return match?.[1] ? match[1].trim() : "";
}

function cleanPostContentForDisplay(post: HomePost): string {
  return (post.content || "")
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

  if (list.length === 0 && post.image_url?.trim()) {
    list.push(post.image_url.trim());
  }

  return list.slice(0, MAX_IMAGES);
}

function readLocalCaptionMap(): LocalCaptionMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LOCAL_CAPTIONS_STORAGE_KEY);
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

    return dbCaption || (localMap[url] || "").trim();
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
      if (active) syncActiveUser();
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

  function handleFocusImageComment(postId: string, imageIndex: number) {
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
  const featuredLeadImage = featuredImages[0] || HERO_NETWORK_IMG_SRC;

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
        <div className="ecosystem-shell">
          <div className="ecosystem-topbar">
            <div className="ecosystem-heading">
              <span className="ecosystem-eyebrow">THE V-NECT PLATFORM</span>

              <div className="ecosystem-title">
                <span className="ecosystem-bar" aria-hidden="true" />
                <h2>One Ecosystem. Every Connection.</h2>
              </div>

              <p className="ecosystem-subtitle">
                Everything you need to communicate, collaborate, build
                communities, and grow your business — all connected in one
                platform.
              </p>
            </div>

            <Link href="/business-feed" className="ecosystem-link">
              Explore the ecosystem
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="ecosystem-grid">
            {modules.map((module, idx) => (
              <Link
                href={module.href}
                className={`eco-card eco-tone-${idx % 6}`}
                key={module.name}
                style={{ borderColor: module.border }}
              >
                <div className="eco-card-top">
                  <div className="eco-icon-box" aria-hidden="true">
                    {module.icon}
                  </div>
                </div>

                <div className="eco-card-content">
                  <span
                    className="eco-module-tag"
                    style={{ color: module.accent }}
                  >
                    {module.tag}
                  </span>
                  <h3>{module.name}</h3>
                  <p>{module.description}</p>
                </div>

                <div className="eco-card-bottom">
                  <span>Explore module</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="ecosystem-footer">
            <span className="ecosystem-footer-dot" />
            <span>ONE PLATFORM. CONNECTED POSSIBILITIES.</span>
          </div>
        </div>
      </section>

      <section className="home-posts-section" id="community-posts">
        <div className="home-posts-inner">
          <div className="home-posts-header">
            <div className="home-posts-heading-copy">
              <span className="home-posts-kicker">✦ LIVE COMMUNITY</span>
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
              {featuredPost && (
                <article className="hub-featured-card">
                  <img
                    src={featuredLeadImage}
                    alt={formatCleanPostTitle(featuredPost.title)}
                    className="hub-featured-bg"
                  />
                  <div className="hub-featured-scrim" />

                  <div className="hub-featured-content">
                    <span className="hub-featured-pill">★ Featured</span>
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

              {spotlightPost &&
                (() => {
                  const postImages = getPostImages(spotlightPost);
                  const postImageCaptions = getPostImageCaptions(
                    spotlightPost,
                    postImages
                  );
                  const videoUrl = extractVideoUrlFromPost(spotlightPost);
                  const videoCaption =
                    extractVideoCaptionFromPost(spotlightPost);
                  const displayContent =
                    cleanPostContentForDisplay(spotlightPost);
                  const displayTitle =
                    formatCleanPostTitle(spotlightPost.title);
                  const isFocusedPost =
                    focusTarget?.postId === spotlightPost.id;

                  return (
                    <article className="hub-spotlight-card">
                      <div className="home-post-top">
                        <div className="home-company-info">
                          {spotlightPost.companies?.logo_url ? (
                            <img
                              src={spotlightPost.companies.logo_url}
                              alt={
                                spotlightPost.companies.company_name ||
                                "Company"
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
                            <small>
                              {formatDate(spotlightPost.created_at)}
                            </small>
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
                              const captionText =
                                postImageCaptions[idx] || "";

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
                          isFocusedPost
                            ? focusTarget?.imageIndex ?? null
                            : null
                        }
                        focusTrigger={
                          isFocusedPost ? focusTarget?.trigger ?? 0 : 0
                        }
                      />
                    </article>
                  );
                })()}

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
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
          background:
            radial-gradient(circle at 78% 14%, rgba(78,108,255,.3), transparent 36%),
            radial-gradient(circle at 22% 28%, rgba(28,63,184,.24), transparent 42%),
            linear-gradient(180deg, #060b24 0%, #091338 52%, #060b24 100%);
        }

        .navbar {
          min-height: 72px;
          padding: 10px 6%;
          background: rgba(6,11,34,.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(138,165,255,.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
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
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          overflow: hidden;
          flex-shrink: 0;
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
          font-weight: 850;
          letter-spacing: .3px;
          white-space: nowrap;
          line-height: 1.05;
        }

        .logo-main span,
        .footer-logo span {
          color: #8ab4ff;
        }

        .logo small {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #9cb0d9;
          margin-top: 4px;
          white-space: nowrap;
        }

        .navbar nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .navbar nav a {
          color: #d9e4ff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          transition: color .2s ease;
        }

        .navbar nav a:hover {
          color: #8ab4ff;
        }

        .navbar nav a.nav-button {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #fff;
          padding: 10px 16px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 750;
          box-shadow: 0 7px 20px rgba(75,107,255,.22);
        }

        .nav-right-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .nav-account-badge {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(91,124,255,.18);
          border: 1px solid rgba(138,165,255,.42);
          color: #b7ccff;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .nav-ghost-btn {
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(154,178,255,.28);
          color: #eef3ff;
          padding: 9px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: .2s ease;
        }

        .nav-ghost-btn:hover {
          border-color: #8ab4ff;
          background: rgba(138,180,255,.14);
        }

        /* HERO */

        .hero {
          max-width: 1220px;
          margin: 0 auto;
          padding: 52px 24px 42px;
          display: grid;
          grid-template-columns: minmax(0,1fr) minmax(0,1.25fr);
          gap: 30px;
          align-items: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #a4c3ff;
          background: rgba(52,79,196,.24);
          border: 1px solid rgba(136,166,255,.28);
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #5eead4;
          box-shadow: 0 0 10px #5eead4;
        }

        .hero h1 {
          font-size: clamp(38px,4.4vw,58px);
          font-weight: 850;
          line-height: 1.08;
          letter-spacing: -1.4px;
          margin: 17px 0 14px;
          color: #fff;
        }

        .hero h1 span {
          display: block;
          background: linear-gradient(100deg,#8bb4ff,#a99aff 55%,#5eead4);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .hero p {
          color: #c2d1f0;
          font-size: 15px;
          line-height: 1.75;
          max-width: 530px;
          margin: 0;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 25px;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 18px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
          transition: transform .2s ease, background .2s ease;
        }

        .primary-button {
          background: linear-gradient(110deg,#4b6bff,#7357ff);
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(75,107,255,.35);
        }

        .primary-button:hover {
          transform: translateY(-2px);
        }

        .secondary-button {
          background: rgba(16,29,78,.72);
          border: 1px solid rgba(145,173,255,.34);
          color: #e6eeff;
        }

        .secondary-button:hover {
          background: rgba(34,57,134,.78);
        }

        .hero-stats-strip {
          display: flex;
          align-items: center;
          gap: 28px;
          flex-wrap: wrap;
          margin-top: 27px;
          padding-top: 19px;
          border-top: 1px solid rgba(145,173,255,.16);
        }

        .hero-stat-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .hero-stat-item strong {
          font-size: 20px;
          font-weight: 850;
          color: #fff;
        }

        .hero-stat-item span {
          font-size: 11px;
          color: #9cb2dc;
        }

        .hero-visual {
          position: relative;
          min-height: 380px;
          width: 100%;
          display: grid;
          place-items: center;
          padding: 16px 8px;
        }

        .hero-ambient-glow {
          position: absolute;
          width: 420px;
          height: 280px;
          border-radius: 999px;
          background: radial-gradient(circle,rgba(88,124,255,.34),rgba(19,200,181,.16) 55%,transparent 80%);
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
          stroke: rgba(145,173,255,.24);
          stroke-width: 1.4;
          stroke-linecap: round;
        }

        .connector-pulse {
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-dasharray: 10 14;
          filter: drop-shadow(0 0 6px rgba(114,154,255,.65));
          animation: voinFlowDash 2.2s linear infinite;
        }

        .pulse-two { animation-delay: -.55s; }
        .pulse-three { animation-delay: -1.1s; }
        .pulse-four { animation-delay: -1.65s; }

        .connector-node {
          fill: #8bb4ff;
          transform-box: fill-box;
          transform-origin: center;
          filter: drop-shadow(0 0 7px rgba(114,154,255,.85));
          animation: voinNodePulse 2.4s ease-in-out infinite;
        }

        @keyframes voinFlowDash {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -48; }
        }

        @keyframes voinNodePulse {
          0%,100% { opacity: .65; transform: scale(.95); }
          50% { opacity: 1; transform: scale(1.22); }
        }

        .hero-network-img {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 580px;
          max-height: 340px;
          object-fit: contain;
          filter: drop-shadow(0 14px 32px rgba(59,99,246,.28));
        }

        .orbit-label {
          position: absolute;
          z-index: 3;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.1px;
          color: #b7ceff;
          background: rgba(13,25,68,.92);
          border: 1px solid rgba(138,165,255,.36);
          padding: 6px 11px;
          border-radius: 999px;
        }

        .label-one { top: 10px; left: 3%; }
        .label-two { top: 10px; right: 3%; }
        .label-three { bottom: 10px; left: 3%; }
        .label-four { bottom: 10px; right: 3%; }

        /* ECOSYSTEM SECTION */

        .platform-section {
          max-width: 1320px;
          margin: 10px auto 0;
          padding: 28px 24px 58px;
          color: #f8fafc;
        }

        .ecosystem-shell {
          position: relative;
          overflow: hidden;
          padding: 36px;
          border-radius: 26px;
          border: 1px solid rgba(130, 184, 255, 0.24);
          background:
            radial-gradient(
              circle at 12% 0%,
              rgba(56, 189, 248, 0.22),
              transparent 44%
            ),
            radial-gradient(
              circle at 92% 100%,
              rgba(99, 102, 241, 0.2),
              transparent 44%
            ),
            linear-gradient(150deg, #1a2f63 0%, #12224a 52%, #0e1a3a 100%);
          box-shadow:
            0 24px 64px rgba(2, 8, 26, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .ecosystem-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(148, 190, 255, 0.18);
        }

        .ecosystem-heading {
          max-width: 690px;
        }

        .ecosystem-eyebrow {
          display: inline-block;
          margin-bottom: 10px;
          color: #7dd3fc;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2.6px;
        }

        .ecosystem-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ecosystem-bar {
          flex-shrink: 0;
          width: 4px;
          height: 30px;
          border-radius: 99px;
          background: linear-gradient(180deg, #67e8f9, #a78bfa);
          box-shadow: 0 0 16px rgba(103, 232, 249, 0.5);
        }

        .ecosystem-title h2 {
          margin: 0;
          font-size: clamp(23px, 3vw, 34px);
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -0.8px;
          background: linear-gradient(105deg, #67e8f9 0%, #93c5fd 45%, #e879f9 100%);
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }

        .ecosystem-subtitle {
          max-width: 620px;
          margin: 12px 0 0 16px;
          color: #c2d3f0;
          font-size: 13.5px;
          line-height: 1.75;
        }

        .ecosystem-link {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 18px;
          border: 1px solid rgba(125, 211, 252, 0.42);
          border-radius: 12px;
          color: #eef6ff;
          background: rgba(56, 130, 246, 0.22);
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .ecosystem-link span {
          font-size: 16px;
          color: #7dd3fc;
        }

        .ecosystem-link:hover {
          background: rgba(56, 130, 246, 0.34);
          border-color: rgba(125, 211, 252, 0.8);
          transform: translateY(-2px);
        }

        .ecosystem-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .eco-card {
          position: relative;
          min-height: 204px;
          display: flex;
          flex-direction: column;
          padding: 22px;
          overflow: hidden;
          border: 1px solid rgba(148, 184, 255, 0.26);
          border-radius: 18px;
          background: linear-gradient(
            155deg,
            rgba(38, 66, 122, 0.92),
            rgba(18, 33, 68, 0.98)
          );
          color: inherit;
          text-decoration: none;
          box-shadow: 0 12px 26px rgba(2, 8, 24, 0.3);
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }

        .eco-card:hover {
          transform: translateY(-5px);
          background: linear-gradient(
            155deg,
            rgba(48, 82, 148, 0.97),
            rgba(22, 40, 82, 0.99)
          );
          box-shadow: 0 18px 36px rgba(2, 8, 24, 0.42);
        }

        .eco-card-top {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 18px;
        }

        .eco-icon-box {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1;
          border: 1px solid rgba(255, 255, 255, 0.28);
        }

        .eco-tone-0 .eco-icon-box {
          background: linear-gradient(145deg, #36b9ff, #1763e9);
          box-shadow: 0 8px 22px rgba(34, 134, 255, 0.34);
        }

        .eco-tone-1 .eco-icon-box {
          background: linear-gradient(145deg, #bd78ff, #7041e9);
          box-shadow: 0 8px 22px rgba(145, 72, 255, 0.34);
        }

        .eco-tone-2 .eco-icon-box {
          background: linear-gradient(145deg, #32dce9, #137dbd);
          box-shadow: 0 8px 22px rgba(24, 188, 224, 0.32);
        }

        .eco-tone-3 .eco-icon-box {
          background: linear-gradient(145deg, #559fff, #2458d8);
          box-shadow: 0 8px 22px rgba(42, 122, 255, 0.32);
        }

        .eco-tone-4 .eco-icon-box {
          background: linear-gradient(145deg, #f472b6, #9d174d);
          box-shadow: 0 8px 22px rgba(244, 114, 182, 0.32);
        }

        .eco-tone-5 .eco-icon-box {
          background: linear-gradient(145deg, #fbbf24, #b45309);
          box-shadow: 0 8px 22px rgba(251, 191, 36, 0.32);
        }

        .eco-card-content {
          flex: 1;
        }

        .eco-module-tag {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.4px;
          margin-bottom: 6px;
        }

        .eco-card h3 {
          margin: 0 0 8px;
          color: #ffffff;
          font-size: 19px;
          font-weight: 750;
          letter-spacing: -0.4px;
        }

        .eco-card p {
          max-width: 300px;
          margin: 0;
          color: #c2d2ec;
          font-size: 13px;
          line-height: 1.65;
        }

        .eco-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          padding-top: 12px;
          border-top: 1px solid rgba(160, 192, 240, 0.16);
          color: #b8cef0;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .ecosystem-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 9px;
          margin-top: 26px;
          color: #93abd2;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2.5px;
        }

        .ecosystem-footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #39c7ed;
          box-shadow: 0 0 10px rgba(57, 199, 237, 0.85);
        }

        /* LATEST POSTS */

        .home-posts-section {
          position: relative;
          background: linear-gradient(180deg,#eef2fb 0%,#e8eefb 62%,#dfe7f8 100%);
          color: #131c36;
          padding: 48px 24px 44px;
          border-radius: 26px 26px 0 0;
          box-shadow: 0 -16px 40px rgba(4,9,28,.35);
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
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.5px;
          display: inline-block;
        }

        .home-posts-header h2 {
          color: #0e1733;
          font-size: clamp(28px,3.4vw,39px);
          font-weight: 850;
          letter-spacing: -.8px;
          line-height: 1.15;
          margin: 7px 0;
        }

        .home-posts-header h2 span {
          color: #4f63ff;
        }

        .home-posts-header p {
          color: #526080;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .view-all-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #1a264a;
          font-size: 12px;
          font-weight: 750;
          text-decoration: none;
          padding: 10px 15px;
          background: #fff;
          border: 1px solid #cfd8ee;
          border-radius: 11px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(18,30,74,.06);
          transition: transform .2s ease, border-color .2s ease;
        }

        .view-all-link:hover {
          border-color: #4f63ff;
          transform: translateY(-2px);
        }

        .hub-bento-grid {
          display: grid;
          grid-template-columns: minmax(0,1.05fr) minmax(0,1.15fr) minmax(0,1fr);
          gap: 18px;
          align-items: start;
        }

        .hub-featured-card {
          position: relative;
          min-height: 360px;
          border-radius: 18px;
          overflow: hidden;
          background: #0d1a40;
          border: 1px solid #d2dcf0;
          box-shadow: 0 12px 28px rgba(17,29,69,.12);
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
            rgba(8,16,44,.25) 0%,
            rgba(8,16,44,.72) 55%,
            rgba(7,13,36,.94) 100%
          );
        }

        .hub-featured-content {
          position: relative;
          z-index: 2;
          padding: 20px;
          color: #fff;
        }

        .hub-featured-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(114,92,255,.92);
          color: #fff;
          font-size: 11px;
          font-weight: 750;
          padding: 5px 10px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .hub-featured-content h3 {
          margin: 0 0 8px;
          font-size: 22px;
          font-weight: 850;
          line-height: 1.25;
          color: #fff;
          overflow-wrap: anywhere;
        }

        .hub-featured-content p {
          margin: 0 0 14px;
          font-size: 12px;
          line-height: 1.6;
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
          font-weight: 750;
          color: #eef3ff;
        }

        .hub-mini-mark {
          width: 21px;
          height: 21px;
          border-radius: 6px;
          background: linear-gradient(135deg,#4b6bff,#13c8b5);
          color: #fff;
          font-size: 11px;
          font-weight: 850;
          display: grid;
          place-items: center;
        }

        .hub-spotlight-card {
          min-width: 0;
          background: #fff;
          border: 1px solid #d8e1f3;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 24px rgba(17,29,69,.07);
          color: #15203d;
        }

        .home-post-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding-bottom: 12px;
          border-bottom: 1px solid #eaeff9;
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
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .home-company-avatar {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg,#1b2f6e,#4f63ff);
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
          font-weight: 750;
        }

        .verified-check {
          display: inline-grid;
          place-items: center;
          width: 15px;
          height: 15px;
          border-radius: 50%;
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
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 750;
        }

        .home-post-body {
          padding: 14px 0 6px;
        }

        .home-post-body h3 {
          margin: 0 0 8px;
          font-size: 17px;
          font-weight: 850;
          line-height: 1.4;
          color: #101935;
          overflow-wrap: anywhere;
        }

        .home-post-body p {
          margin: 0;
          color: #4d5b7a;
          font-size: 12px;
          line-height: 1.7;
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
          padding: 9px 12px;
          background: #14224a;
          color: #eef3ff;
          font-size: 11px;
          font-weight: 650;
        }

        .home-video-caption {
          overflow-wrap: anywhere;
        }

        .home-video-footer a {
          color: #8ab4ff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 750;
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
          grid-template-columns: repeat(2,minmax(0,1fr));
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
          padding: 7px 10px;
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
          background: #fff;
          color: #1b284d;
          border-radius: 7px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .home-image-comment-btn:hover {
          background: #eef2ff;
          border-color: #4f63ff;
        }

        .hub-side-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hub-side-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          border: 1px solid #d8e1f3;
          border-radius: 14px;
          padding: 10px 12px;
          text-decoration: none;
          color: #131d38;
          box-shadow: 0 6px 18px rgba(17,29,69,.05);
          transition: transform .2s ease, border-color .2s ease;
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
          font-weight: 750;
          line-height: 1.4;
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
          font-size: 10px;
          color: #687694;
          font-weight: 650;
        }

        .hub-side-tag {
          font-size: 10px;
          font-weight: 750;
          padding: 3px 8px;
          border-radius: 6px;
          background: #e9f7ef;
          color: #1f7a4c;
        }

        .hub-side-chevron {
          color: #8a97b5;
          font-size: 19px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .join-cta-banner {
          margin-top: 25px;
          background: linear-gradient(110deg,#1b2d7a,#3c349c 60%,#1c3d82);
          border: 1px solid rgba(138,165,255,.35);
          border-radius: 18px;
          padding: 21px 26px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          color: #fff;
          box-shadow: 0 12px 28px rgba(14,24,66,.16);
        }

        .join-cta-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .join-cta-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: rgba(255,255,255,.14);
          display: grid;
          place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .join-cta-banner h3 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 850;
          color: #fff;
        }

        .join-cta-banner p {
          margin: 0;
          font-size: 12px;
          color: #cdd8f8;
        }

        .join-cta-btn {
          background: linear-gradient(110deg,#5677ff,#7c58ff);
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 750;
          padding: 11px 18px;
          border-radius: 10px;
          white-space: nowrap;
          transition: transform .2s ease;
        }

        .join-cta-btn:hover {
          transform: translateY(-2px);
        }

        .home-posts-empty {
          background: #fff;
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
          border: 3px solid rgba(79,99,255,.2);
          border-top-color: #4f63ff;
          border-radius: 50%;
          animation: loadingSpin .8s linear infinite;
        }

        @keyframes loadingSpin {
          to { transform: rotate(360deg); }
        }

        .footer {
          text-align: center;
          padding: 30px 20px;
          background: #050a20;
          color: #96a8d0;
          border-top: 1px solid rgba(138,165,255,.14);
        }

        .footer-logo {
          color: #fff;
          font-size: 23px;
          font-weight: 850;
          letter-spacing: .4px;
        }

        .footer p {
          margin: 7px 0 5px;
          font-size: 13px;
          color: #d9e4ff;
        }

        .footer small {
          font-size: 11px;
        }

        /* RESPONSIVE */

        @media (max-width: 1024px) {
          .hub-bento-grid {
            grid-template-columns: 1fr;
          }

          .hub-side-stack {
            display: grid;
            grid-template-columns: repeat(2,minmax(0,1fr));
          }
        }

        @media (max-width: 900px) {
          .navbar {
            flex-wrap: wrap;
            justify-content: center;
          }

          .hero {
            grid-template-columns: 1fr;
            padding-top: 36px;
          }

          .hero-content {
            text-align: center;
          }

          .hero-content > p {
            margin-left: auto;
            margin-right: auto;
          }

          .hero-actions,
          .hero-stats-strip {
            justify-content: center;
          }

          .hero-visual {
            min-height: 340px;
          }

          .ecosystem-shell {
            padding: 28px;
          }

          .ecosystem-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ecosystem-topbar {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 540px) {
          .navbar {
            padding: 12px 16px;
          }

          .navbar nav {
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
          }

          .navbar nav a {
            font-size: 11px;
          }

          .nav-right-actions {
            flex-wrap: wrap;
            justify-content: center;
          }

          .hero {
            padding: 32px 17px 30px;
          }

          .hero h1 {
            font-size: 39px;
          }

          .hero p {
            font-size: 13px;
          }

          .hero-visual {
            min-height: 265px;
          }

          .hero-ambient-glow {
            width: 280px;
            height: 210px;
          }

          .orbit-label {
            font-size: 8px;
            padding: 5px 8px;
          }

          .platform-section {
            padding: 18px 14px 40px;
          }

          .ecosystem-shell {
            padding: 21px 15px;
            border-radius: 20px;
          }

          .ecosystem-title h2 {
            font-size: 23px;
          }

          .ecosystem-subtitle {
            margin-left: 16px;
            font-size: 12px;
          }

          .ecosystem-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .eco-card {
            min-height: 180px;
            padding: 20px;
          }

          .eco-card-top {
            margin-bottom: 16px;
          }

          .eco-card h3 {
            font-size: 18px;
          }

          .ecosystem-link {
            width: 100%;
            justify-content: center;
          }

          .ecosystem-footer {
            font-size: 8px;
            letter-spacing: 1.5px;
          }

          .home-posts-section {
            padding: 36px 14px;
            border-radius: 20px 20px 0 0;
          }

          .home-posts-header h2 {
            font-size: 28px;
          }

          .hub-side-stack {
            grid-template-columns: 1fr;
          }

          .hub-featured-card {
            min-height: 300px;
          }

          .hub-spotlight-card {
            padding: 14px;
          }

          .home-images-grid.multi {
            grid-template-columns: repeat(2,minmax(0,1fr));
          }

          .join-cta-banner {
            padding: 18px 16px;
          }

          .join-cta-left {
            align-items: flex-start;
          }
        }

        @media (max-width: 380px) {
          .hero-stats-strip {
            gap: 18px;
          }

          .hero-stat-item strong {
            font-size: 17px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .home-page *,
          .home-page *::before,
          .home-page *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
