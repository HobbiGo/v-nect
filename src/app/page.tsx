"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { AccountAuthModal } from "@/components/AccountAuthModal";
import { PostThreadComments } from "@/components/PostThreadComments";

interface BusinessPost {
  id: string;
  company_id: string;
  author_id: string;
  title: string;
  content: string;
  post_type: string;
  image_url: string | null;
  image_urls?: string[] | null;
  status: string;
  created_at: string;
  companies: {
    company_name: string;
    logo_url: string | null;
  } | null;
}

interface CommentCountRow {
  post_id: string;
}

const BRAND_LOGO_SRC = "/images/V-NECT-logo.png";
const HERO_GLOBE_SRC = "/images/globe-network-transparent.png";

function getPostImages(post: BusinessPost): string[] {
  const list: string[] = [];
  if (Array.isArray(post.image_urls)) {
    for (const url of post.image_urls) {
      if (typeof url === "string" && url.trim() && !list.includes(url.trim())) {
        list.push(url.trim());
      }
    }
  }
  if (
    post.image_url &&
    post.image_url.trim() &&
    !list.includes(post.image_url.trim())
  ) {
    list.push(post.image_url.trim());
  }
  return list;
}

function isVideoUrl(url: string): boolean {
  const clean = (url || "").split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".m4v") ||
    clean.endsWith(".avi") ||
    clean.endsWith(".mkv") ||
    clean.includes("/video/upload/")
  );
}

function extractVideoCaption(content: string): string {
  const match = (content || "").match(/\(VideoCaption:\s*([^)]*)\)/i);
  return match ? match[1].trim() : "";
}

function extractExternalVideoLink(content: string): string {
  const match = (content || "").match(
    /^\s*Link Video:\s*(https?:\/\/\S+)\s*$/im
  );
  return match ? match[1].trim() : "";
}

function getEmbedVideoUrl(url: string): string | null {
  const raw = (url || "").trim();
  if (!raw) return null;
  const ytMatch = raw.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i
  );
  if (ytMatch?.[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

function formatCleanTitle(rawTitle: string): string {
  const clean = (rawTitle || "")
    .trim()
    .replace(/^Video:\s*/i, "")
    .replace(/\.(mp4|webm|mov|m4v|avi|mkv)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return rawTitle || "Untitled";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function formatCleanExcerpt(rawContent: string): string {
  return (rawContent || "")
    .replace(/\(VideoCaption:\s*[^)]*\)/gi, "")
    .replace(/^\s*Link Video:\s*https?:\/\/\S+\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function HomePage() {
  const [supabase] = useState(() => createClient());
  const [posts, setPosts] = useState<BusinessPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeFeedFilter, setActiveFeedFilter] = useState<string>("all");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [openCommentsPostIds, setOpenCommentsPostIds] = useState<string[]>([]);
  const [commentFocusTriggerByPost, setCommentFocusTriggerByPost] = useState<Record<string, number>>({});
  const [activeVideoPost, setActiveVideoPost] = useState<BusinessPost | null>(null);

  useEffect(() => {
    fetchPublishedPosts();
    loadCurrentUserAndLikes();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadCurrentUserAndLikes();
    });
    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function loadCurrentUserAndLikes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCurrentUserId(null);
      setCurrentUserName(null);
      setLikedPostIds([]);
      return;
    }
    setCurrentUserId(user.id);
    const metaName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      user.email?.split("@")[0] ||
      "Member";
    setCurrentUserName(metaName);
    const { data: likeRows } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id);
    if (likeRows) {
      setLikedPostIds(likeRows.map((r) => r.post_id));
    }
  }

  async function fetchPublishedPosts() {
    setLoadingPosts(true);
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
    if (error) {
      console.error("Error loading home posts:", error);
      setPosts([]);
      setLoadingPosts(false);
      return;
    }
    const postList = (data || []) as unknown as BusinessPost[];
    setPosts(postList);
    if (postList.length > 0) {
      const postIds = postList.map((p) => p.id);
      const { data: allLikes } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);
      const countMap: Record<string, number> = {};
      for (const id of postIds) countMap[id] = 0;
      for (const row of allLikes || []) {
        countMap[row.post_id] = (countMap[row.post_id] || 0) + 1;
      }
      setLikeCounts(countMap);
      const { data: allComments } = await supabase
        .from("post_comments")
        .select("post_id")
        .in("post_id", postIds);
      const cMap: Record<string, number> = {};
      for (const id of postIds) cMap[id] = 0;
      for (const row of (allComments || []) as CommentCountRow[]) {
        cMap[row.post_id] = (cMap[row.post_id] || 0) + 1;
      }
      setCommentCounts(cMap);
    }
    setLoadingPosts(false);
  }

  async function handleToggleLike(postId: string) {
    if (!currentUserId) {
      setAuthModalOpen(true);
      return;
    }
    const alreadyLiked = likedPostIds.includes(postId);
    if (alreadyLiked) {
      setLikedPostIds((prev) => prev.filter((id) => id !== postId));
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 0) - 1),
      }));
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
    } else {
      setLikedPostIds((prev) => [...prev, postId]);
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: currentUserId,
      });
    }
  }

  function handleToggleComments(postId: string) {
    setOpenCommentsPostIds((prev) => {
      const exists = prev.includes(postId);
      if (exists) {
        return prev.filter((id) => id !== postId);
      }
      return [...prev, postId];
    });
    setCommentFocusTriggerByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1,
    }));
  }

  function formatPostDate(dateStr: string) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getBadgeLabel(postType: string) {
    switch (postType) {
      case "announcement":
        return "Official Update";
      case "product_launch":
        return "Trending";
      case "company_news":
      case "news":
        return "Business";
      case "presentation":
        return "Community";
      default:
        return "Business Update";
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (activeFeedFilter === "all") return true;
    if (activeFeedFilter === "company_news") {
      return post.post_type === "company_news" || post.post_type === "news";
    }
    return post.post_type === activeFeedFilter;
  });

  const videoPosts = posts.filter((post) => {
    const mediaList = getPostImages(post);
    const hasUploadedVideo = mediaList.some((url) => isVideoUrl(url));
    const hasLinkVideo = Boolean(extractExternalVideoLink(post.content));
    return hasUploadedVideo || hasLinkVideo;
  });

  const activeModalVideoUrl = activeVideoPost
    ? getPostImages(activeVideoPost).find((u) => isVideoUrl(u)) || null
    : null;
  const activeModalExternalLink = activeVideoPost
    ? extractExternalVideoLink(activeVideoPost.content)
    : "";
  const activeModalEmbedUrl = activeModalExternalLink
    ? getEmbedVideoUrl(activeModalExternalLink)
    : null;
  const activeModalCaption = activeVideoPost
    ? extractVideoCaption(activeVideoPost.content)
    : "";

  return (
    <main className="vnect-home">
      <header className="top-nav">
        <Link href="/" className="brand-logo">
          <span className="brand-logo-mark">
            <img src={BRAND_LOGO_SRC} alt="v-nect logo" />
          </span>
          <span className="brand-text-group">
            <span className="brand-wordmark">
              v<span>-nect</span>
            </span>
            <small className="brand-tagline">GLOBAL BUSINESS ECOSYSTEM</small>
          </span>
        </Link>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <Link href="/explore">Explore</Link>
          <a href="#ecosystem">Ecosystem</a>
          <Link href="/v-circle?tab=discussions">Community</Link>
          <a href="#about">About</a>
          <Link href="/business-feed" className="nav-cta">
            Business Feed →
          </Link>
        </nav>
        <div className="nav-actions">
          {currentUserName ? (
            <span className="user-chip">● {currentUserName}</span>
          ) : (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setAuthModalOpen(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="eyebrow">THE V-NECT PLATFORM</span>
            <h1>
              Connect Beyond <span>Boundaries.</span>
            </h1>
            <p className="hero-sub">
              v-nect is the next-generation business ecosystem for
              communication, video meetings, community engagement, and
              commercial growth.
            </p>
            <div className="hero-buttons">
              <Link href="/explore" className="btn-primary hero-explore-btn">
                Explore Platform →
              </Link>
              <Link href="/business-feed" className="btn-secondary">
                Open Business Feed
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div
              className="hero-globe-wrap"
              style={{
                background: "transparent",
                WebkitMaskImage:
                  "radial-gradient(ellipse 68% 66% at 50% 50%, #000 50%, rgba(0,0,0,0.35) 68%, transparent 86%)",
                maskImage:
                  "radial-gradient(ellipse 68% 66% at 50% 50%, #000 50%, rgba(0,0,0,0.35) 68%, transparent 86%)",
              }}
            >
              <img
                src={HERO_GLOBE_SRC}
                alt="v-nect global network globe"
                className="hero-globe-img"
                style={{
                  mixBlendMode: "screen",
                  background: "transparent",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stats-inner">
          <div><strong>6</strong><span>Integrated Modules</span></div>
          <div><strong>1</strong><span>Unified Platform</span></div>
          <div><strong>24/7</strong><span>Global Access</span></div>
          <div><strong>∞</strong><span>Connections Beyond Boundaries</span></div>
        </div>
      </section>

      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-eyebrow">CORE CAPABILITIES</span>
          <h2>Everything Your Business Needs to Connect</h2>
          <p>
            One unified ecosystem bringing together business updates, direct
            conversations, video meetings, and partner discovery.
          </p>
        </div>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Direct &amp; Group Messaging</h3>
            <p>
              Communicate seamlessly with partners, teams, and business contacts
              in real time.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🎥</div>
            <h3>Voice &amp; Video Meetings</h3>
            <p>
              Host live discussions, pitches, and cross-border partner meetings
              directly inside v-nect.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Business Network &amp; Feed</h3>
            <p>
              Share announcements, product launches, and insights with businesses
              and community members.
            </p>
          </article>
        </div>
      </section>

      <section id="ecosystem" className="ecosystem-section">
        <div className="ecosystem-header">
          <div>
            <span className="section-eyebrow">THE ECOSYSTEM</span>
            <h2>Explore the v-nect Suite</h2>
            <p>
              Six integrated modules designed to support every stage of
              connection, collaboration, and commerce.
            </p>
          </div>
          <Link href="/explore" className="eco-link">
            Explore the ecosystem <span>↗</span>
          </Link>
        </div>
        <div className="ecosystem-grid">
          <Link href="/business-feed" className="eco-card eco-tone-0">
            <div className="eco-icon">💬</div>
            <span className="eco-code">01 · CHAT &amp; MESSAGING</span>
            <h3>v-chat</h3>
            <p className="eco-tagline">Connect and communicate.</p>
            <p className="eco-desc">
              Real-time direct and group conversations for partners, teams, and
              business contacts.
            </p>
            <span className="eco-cta">Explore module <span>↗</span></span>
          </Link>
          <Link href="/v-meet" className="eco-card eco-tone-1">
            <div className="eco-icon">🎥</div>
            <span className="eco-code">02 · LIVE MEETINGS</span>
            <h3>v-meet</h3>
            <p className="eco-tagline">Voice &amp; video meetings.</p>
            <p className="eco-desc">
              Host live discussions, pitches, and cross-border partner meetings
              directly inside v-nect.
            </p>
            <span className="eco-cta">Explore module <span>↗</span></span>
          </Link>
          <Link href="/v-hub" className="eco-card eco-tone-2">
            <div className="eco-icon">✣</div>
            <span className="eco-code">03 · IDENTITY HUB</span>
            <h3>v-hub</h3>
            <p className="eco-tagline">Build your professional identity.</p>
            <p className="eco-desc">
              Central workspace dashboard to manage profile completion,
              positioning, and ecosystem activity.
            </p>
            <span className="eco-cta">Explore module <span>↗</span></span>
          </Link>
          <Link href="/business-feed" className="eco-card eco-tone-3">
            <div className="eco-icon">▤</div>
            <span className="eco-code">04 · BUSINESS FEED</span>
            <h3>v-business feed</h3>
            <p className="eco-tagline">Business updates &amp; opportunities.</p>
            <p className="eco-desc">
              Share announcements, product launches, and discussions with
              businesses and community members.
            </p>
            <span className="eco-cta">Explore module <span>↗</span></span>
          </Link>
          <Link href="/v-circle" className="eco-card eco-tone-4">
            <div className="eco-icon">👥</div>
            <span className="eco-code">05 · NETWORK CIRCLE</span>
            <h3>v-circle</h3>
            <p className="eco-tagline">Grow your network.</p>
            <p className="eco-desc">
              Discover founders, professionals, and companies to expand trusted
              business connections.
            </p>
            <span className="eco-cta">Explore module <span>↗</span></span>
          </Link>
          <Link href="/v-market" className="eco-card eco-tone-5">
            <div className="eco-icon">🛒</div>
            <span className="eco-code">06 · MARKETPLACE</span>
            <h3>v-market</h3>
            <p className="eco-tagline">Products &amp; suppliers.</p>
            <p className="eco-desc">
              Explore company products, services, and suppliers, inspect feature
              photos, and request info.
            </p>
            <span className="eco-cta">Explore module <span>↗</span></span>
          </Link>
        </div>
      </section>

      <section className="how-section">
        <div className="section-header">
          <span className="section-eyebrow">HOW IT WORKS</span>
          <h2>From First Chat to Global Deal in 3 Steps</h2>
          <p>No complicated setup. Just connect, collaborate, and grow.</p>
        </div>
        <div className="how-grid">
          <article className="how-card">
            <span className="how-num">01</span>
            <h3>Create Your Business Profile</h3>
            <p>Set up your company identity in v-hub and tell the world what you offer.</p>
          </article>
          <article className="how-card">
            <span className="how-num">02</span>
            <h3>Connect &amp; Meet</h3>
            <p>Chat, join communities, and host video meetings with founders and partners across borders.</p>
          </article>
          <article className="how-card">
            <span className="how-num">03</span>
            <h3>Grow &amp; Sell</h3>
            <p>Share updates in the Business Feed and showcase products in v-market to turn connections into customers.</p>
          </article>
        </div>
      </section>

      <section id="community-posts" className="posts-section">
        <div className="posts-header">
          <div>
            <span className="section-eyebrow">LIVE FROM THE COMMUNITY</span>
            <h2>Latest Posts &amp; Discussion</h2>
            <p>
              Fresh updates, announcements, and community conversations shared
              across v-nect.
            </p>
          </div>
          <Link href="/business-feed" className="eco-link">
            View all posts <span>↗</span>
          </Link>
        </div>
        <div className="home-filter-bar">
          {[
            { key: "all", label: "All Updates" },
            { key: "announcement", label: "Official Update" },
            { key: "company_news", label: "Business" },
            { key: "product_launch", label: "Trending" },
            { key: "presentation", label: "Community" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={
                activeFeedFilter === tab.key
                  ? "home-filter-pill active"
                  : "home-filter-pill"
              }
              onClick={() => setActiveFeedFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {loadingPosts ? (
          <div className="posts-empty">
            <p>Loading latest community posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="posts-empty">
            <p>No published posts yet in this category.</p>
            <Link href="/business-feed" className="btn-primary small-btn">
              Go to Business Feed
            </Link>
          </div>
        ) : (
          <div className="posts-grid">
            {filteredPosts.map((post) => {
              const isLiked = likedPostIds.includes(post.id);
              const likeTotal = likeCounts[post.id] ?? 0;
              const commentTotal = commentCounts[post.id] ?? 0;
              const isCommentsOpen = openCommentsPostIds.includes(post.id);
              const mediaList = getPostImages(post);
              const primaryMedia = mediaList[0] || null;
              const primaryIsVideo = primaryMedia
                ? isVideoUrl(primaryMedia)
                : false;
              const externalLink = extractExternalVideoLink(post.content);
              const videoCaption = extractVideoCaption(post.content);
              const cleanTitle = formatCleanTitle(post.title);
              const cleanExcerpt = formatCleanExcerpt(post.content);
              return (
                <article key={post.id} className="post-card">
                  {primaryMedia ? (
                    primaryIsVideo ? (
                      <div className="post-video-thumb">
                        <video
                          src={primaryMedia}
                          muted
                          playsInline
                          preload="metadata"
                          className="post-cover-video"
                        />
                        <div className="post-video-overlay">
                          <span className="post-video-tag">▶ VIDEO</span>
                          <button
                            type="button"
                            className="post-video-play-btn"
                            onClick={() => setActiveVideoPost(post)}
                          >
                            ▶ Putar Video
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="post-cover-wrap">
                        <img
                          src={primaryMedia}
                          alt={cleanTitle}
                          className="post-cover-img"
                        />
                        {mediaList.length > 1 && (
                          <span className="post-multi-badge">
                            +{mediaList.length - 1} foto
                          </span>
                        )}
                      </div>
                    )
                  ) : externalLink ? (
                    <div className="post-video-thumb external-only">
                      <div className="post-video-overlay">
                        <span className="post-video-tag">▶ VIDEO LINK</span>
                        <button
                          type="button"
                          className="post-video-play-btn"
                          onClick={() => setActiveVideoPost(post)}
                        >
                          ▶ Putar Video
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="post-card-body">
                    <div className="post-meta-top">
                      <span className="post-badge">
                        {getBadgeLabel(post.post_type)}
                      </span>
                      <span className="post-date">
                        {formatPostDate(post.created_at)}
                      </span>
                    </div>
                    <h3>{cleanTitle}</h3>
                    {videoCaption && (
                      <p className="post-video-caption-line">
                        🎬 {videoCaption}
                      </p>
                    )}
                    {cleanExcerpt && (
                      <p className="post-excerpt">{cleanExcerpt}</p>
                    )}
                    <div className="post-author-row">
                      <div className="post-author-avatar">
                        {post.companies?.company_name?.charAt(0).toUpperCase() ||
                          "V"}
                      </div>
                      <span className="post-author-name">
                        {post.companies?.company_name || "v-nect Official"}
                      </span>
                    </div>
                    <div className="post-actions-bar">
                      <button
                        type="button"
                        className={
                          isLiked ? "post-action-btn liked" : "post-action-btn"
                        }
                        onClick={() => handleToggleLike(post.id)}
                      >
                        {isLiked ? "♥" : "♡"} <span>{likeTotal}</span>
                      </button>
                      <button
                        type="button"
                        className="post-action-btn"
                        onClick={() => handleToggleComments(post.id)}
                      >
                        💬 <span>{commentTotal}</span>
                      </button>
                      <Link href="/business-feed" className="post-read-link">
                        Read more →
                      </Link>
                    </div>
                    {isCommentsOpen && (
                      <div className="home-thread-box">
                        <PostThreadComments
                          supabase={supabase}
                          postId={post.id}
                          currentUserId={currentUserId}
                          currentUserName={currentUserName}
                          focusTrigger={commentFocusTriggerByPost[post.id] || 0}
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {videoPosts.length > 0 && (
        <section id="video-showcase" className="video-showcase-section">
          <div className="posts-header">
            <div>
              <span className="section-eyebrow">VIDEO HIGHLIGHTS</span>
              <h2>Featured Business &amp; Community Videos</h2>
              <p>
                Watch product showcases, company stories, and highlights shared on
                v-nect.
              </p>
            </div>
            <Link href="/business-feed" className="eco-link">
              All videos in Feed <span>↗</span>
            </Link>
          </div>
          <div className="video-showcase-grid">
            {videoPosts.slice(0, 3).map((vPost) => {
              const vUrl =
                getPostImages(vPost).find((u) => isVideoUrl(u)) || null;
              const vLink = extractExternalVideoLink(vPost.content);
              const vCap = extractVideoCaption(vPost.content);
              return (
                <article key={vPost.id} className="video-showcase-card">
                  <div className="video-showcase-thumb">
                    {vUrl ? (
                      <video
                        src={vUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="post-cover-video"
                      />
                    ) : (
                      <div className="video-link-placeholder">
                        <span>▶ External Video</span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="video-center-play"
                      onClick={() => setActiveVideoPost(vPost)}
                      aria-label={`Putar video ${formatCleanTitle(vPost.title)}`}
                    >
                      ▶
                    </button>
                  </div>
                  <div className="video-showcase-body">
                    <span className="post-badge">
                      {vPost.companies?.company_name || "v-nect Creator"}
                    </span>
                    <h3>{formatCleanTitle(vPost.title)}</h3>
                    {vCap && <p className="video-cap-text">{vCap}</p>}
                    <div className="video-card-footer">
                      <span>{formatPostDate(vPost.created_at)}</span>
                      <button
                        type="button"
                        className="post-video-play-btn small"
                        onClick={() => setActiveVideoPost(vPost)}
                      >
                        {vUrl || vLink ? "▶ Putar Video" : "Buka"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="why-section">
        <div className="why-grid">
          <div>
            <span className="section-eyebrow">WHY V-NECT</span>
            <h2>Why Businesses Choose v-nect</h2>
            <ul className="why-list">
              <li><strong>All-in-one</strong> — chat, meetings, feed, and marketplace in one login.</li>
              <li><strong>Built for cross-border</strong> — designed for founders working across time zones.</li>
              <li><strong>Community-first</strong> — grow through real relationships, not cold ads.</li>
            </ul>
          </div>
          <div className="testi-card">
            <p>“Finally, one place to chat, meet, and grow our business — without jumping between five different apps.”</p>
            <span className="testi-name">Founder, Growing Business</span>
            <span className="testi-role">v-nect Community Member</span>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-card">
          <span className="section-eyebrow">ABOUT V-NECT</span>
          <h2>One Platform. Every Business Connection.</h2>
          <p>
            v-nect brings communication, live meetings, community, and commerce
            together in one global ecosystem — so founders, teams, and growing
            businesses can connect, collaborate, and grow beyond boundaries.
          </p>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="final-cta-card">
          <h2>Ready to Connect Beyond Boundaries?</h2>
          <p>Join founders, teams, and businesses building their global network on v-nect.</p>
          <div className="hero-buttons final-cta-buttons">
            <button type="button" className="btn-primary" onClick={() => setAuthModalOpen(true)}>
              Get Started Free →
            </button>
            <Link href="/explore" className="btn-secondary">Explore Platform</Link>
          </div>
          <small className="final-cta-note">No credit card required • Set up in minutes</small>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          v<span>-nect</span>
        </div>
        <p>Connect Beyond Boundaries.</p>
        <div className="footer-links">
          <Link href="/explore">Explore</Link>
          <Link href="/business-feed">Business Feed</Link>
          <Link href="/v-circle?tab=discussions">Community</Link>
          <a href="#about">About</a>
        </div>
        <small>© 2026 v-nect. All rights reserved.</small>
      </footer>

      {activeVideoPost && (
        <div
          className="video-modal-backdrop"
          onClick={() => setActiveVideoPost(null)}
        >
          <div
            className="video-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-top">
              <div>
                <span className="post-badge">
                  {activeVideoPost.companies?.company_name || "v-nect Video"}
                </span>
                <h3>{formatCleanTitle(activeVideoPost.title)}</h3>
              </div>
              <button
                type="button"
                className="video-modal-close"
                onClick={() => setActiveVideoPost(null)}
                aria-label="Tutup video"
              >
                ✕
              </button>
            </div>
            <div className="video-modal-player-wrap">
              {activeModalVideoUrl ? (
                <video
                  src={activeModalVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="video-modal-player"
                />
              ) : activeModalEmbedUrl ? (
                <iframe
                  src={activeModalEmbedUrl}
                  title={formatCleanTitle(activeVideoPost.title)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-modal-iframe"
                />
              ) : activeModalExternalLink ? (
                <div className="video-modal-external-box">
                  <p>Video ini tertaut ke sumber eksternal:</p>
                  <a
                    href={activeModalExternalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary small-btn"
                  >
                    Buka Video Eksternal ↗
                  </a>
                </div>
              ) : null}
            </div>
            {(activeModalCaption ||
              formatCleanExcerpt(activeVideoPost.content)) && (
              <p className="video-modal-caption">
                {activeModalCaption ||
                  formatCleanExcerpt(activeVideoPost.content)}
              </p>
            )}
          </div>
        </div>
      )}

      <AccountAuthModal
        open={authModalOpen}
        initialMode="login"
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => loadCurrentUserAndLikes()}
      />

      <style jsx>{`
        .vnect-home {
          min-height: 100vh;
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
          overflow-x: hidden;
          background:
            radial-gradient(circle at 78% 14%, rgba(78, 108, 255, 0.34), transparent 36%),
            radial-gradient(circle at 22% 32%, rgba(28, 63, 184, 0.24), transparent 42%),
            linear-gradient(180deg, #060b24 0%, #091338 55%, #060b24 100%);
        }
        .top-nav {
          min-height: 72px;
          padding: 12px 6%;
          background: rgba(6, 11, 34, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(138, 165, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .brand-logo { color: #ffffff; text-decoration: none; display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .brand-logo-mark { width: 36px; height: 36px; display: grid; place-items: center; flex-shrink: 0; overflow: hidden; }
        .brand-logo-mark img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .brand-text-group { display: inline-flex; flex-direction: column; justify-content: center; }
        .brand-wordmark { font-size: 21px; font-weight: 850; letter-spacing: -0.4px; line-height: 1.05; color: #ffffff; }
        .brand-wordmark span, .hero-content h1 span, .footer-brand span { color: #8ab4ff; }
        .brand-tagline { font-size: 9px; font-weight: 700; letter-spacing: 1.2px; color: #9cb0d9; text-transform: uppercase; line-height: 1.1; margin-top: 4px; }
        .nav-links { display: flex; align-items: center; gap: 22px; }
        .nav-links :global(a) { color: #d9e4ff; text-decoration: none; font-size: 13px; font-weight: 600; transition: color 0.2s ease; }
        .nav-links :global(a:hover) { color: #8ab4ff; }
        .nav-links :global(a.nav-cta), :global(.nav-cta) {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff; padding: 10px 16px; border-radius: 11px; font-size: 12px; font-weight: 750;
          text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
          box-shadow: 0 7px 20px rgba(75, 107, 255, 0.25);
        }
        .nav-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .user-chip { background: rgba(138, 180, 255, 0.14); border: 1px solid rgba(138, 180, 255, 0.35); color: #c7dcff; padding: 7px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
        .btn-ghost { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(154, 178, 255, 0.28); color: #eef3ff; padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease; }
        .btn-ghost:hover { background: rgba(255, 255, 255, 0.11); border-color: rgba(154, 178, 255, 0.45); }
        .hero-section {
          padding: 36px 7% 44px;
          display: flex; align-items: center;
          background:
            radial-gradient(circle at 76% 42%, rgba(92, 124, 255, 0.32), transparent 36%),
            radial-gradient(circle at 82% 24%, rgba(145, 92, 255, 0.22), transparent 34%);
        }
        .hero-grid { width: 100%; max-width: 1340px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr); align-items: center; gap: 28px 40px; }
        .hero-content { max-width: 560px; }
        .eyebrow, .section-eyebrow { display: inline-block; color: #79a6ff; font-size: 10.5px; font-weight: 800; letter-spacing: 2.6px; text-transform: uppercase; margin-bottom: 12px; }
        .hero-content h1 { margin: 0 0 18px; font-size: clamp(40px, 5.4vw, 62px); font-weight: 850; line-height: 1.05; letter-spacing: -1.6px; color: #ffffff; }
        .hero-sub { margin: 0 0 28px; color: #b8c7e6; font-size: 15.5px; line-height: 1.72; max-width: 520px; }
        .hero-buttons { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        :global(.btn-primary) {
          background: linear-gradient(110deg, #4b6bff, #7854ff); color: #ffffff; text-decoration: none;
          padding: 11px 18px; border-radius: 11px; font-size: 13px; font-weight: 750;
          display: inline-flex; align-items: center; gap: 8px; border: none; cursor: pointer;
          box-shadow: 0 10px 24px rgba(75, 107, 255, 0.28); width: auto; max-width: fit-content;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        :global(.btn-primary:hover) { transform: translateY(-1px); box-shadow: 0 12px 26px rgba(75, 107, 255, 0.36); }
        :global(.btn-secondary) {
          background: rgba(16, 26, 58, 0.72); border: 1px solid rgba(154, 178, 255, 0.32); color: #eef3ff;
          text-decoration: none; padding: 11px 18px; border-radius: 11px; font-size: 13px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 8px; width: auto; max-width: fit-content;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        :global(.btn-secondary:hover) { background: rgba(24, 38, 82, 0.85); border-color: rgba(154, 178, 255, 0.5); }
        .hero-visual {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 100%; min-height: 460px; background: transparent; border: none; box-shadow: none; overflow: visible;
        }
        .hero-globe-wrap {
          width: 100%; max-width: 860px;
          display: grid; place-items: center;
          background: transparent; overflow: visible;
        }
        .hero-globe-img {
          width: 100%; max-width: 860px; height: auto;
          object-fit: contain; object-position: center; display: block; background: transparent;
        }
        .small-btn { padding: 9px 15px; font-size: 12.5px; }
        .features-section, .ecosystem-section, .posts-section, .video-showcase-section, .about-section { padding: 48px 7%; }
        .section-header { max-width: 640px; margin-bottom: 28px; }
        .section-header h2, .ecosystem-header h2, .posts-header h2, .about-card h2 {
          margin: 0 0 10px; font-size: clamp(28px, 3.6vw, 40px); font-weight: 800; letter-spacing: -0.9px; line-height: 1.15; color: #ffffff;
        }
        .section-header p, .ecosystem-header p, .posts-header p, .about-card p { margin: 0; color: #a9b9da; font-size: 14.5px; line-height: 1.7; }
        .features-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        .feature-card { background: linear-gradient(160deg, rgba(20, 32, 72, 0.9), rgba(11, 19, 46, 0.95)); border: 1px solid rgba(138, 165, 255, 0.16); border-radius: 18px; padding: 26px; display: flex; flex-direction: column; }
        .feature-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(92, 124, 255, 0.16); border: 1px solid rgba(138, 165, 255, 0.25); display: grid; place-items: center; font-size: 20px; margin-bottom: 18px; }
        .feature-card h3 { margin: 0 0 8px; font-size: 18px; font-weight: 750; color: #ffffff; }
        .feature-card p { margin: 0; color: #a9b9da; font-size: 13.5px; line-height: 1.65; }
        .ecosystem-header, .posts-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin-bottom: 24px; }
        :global(.eco-link) { color: #9ec0ff; text-decoration: none; font-size: 13.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; transition: color 0.2s ease; }
        :global(.eco-link:hover) { color: #c5daff; }
        .ecosystem-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
        .eco-card { min-height: 228px; display: flex; flex-direction: column; text-decoration: none; padding: 22px; border: 1px solid rgba(148, 184, 255, 0.26); border-radius: 16px; background: linear-gradient(155deg, rgba(38, 66, 122, 0.92), rgba(18, 33, 68, 0.98)); box-shadow: 0 12px 26px rgba(2, 8, 24, 0.3); transition: transform 0.25s ease, border-color 0.25s ease; }
        .eco-card:hover { transform: translateY(-4px); border-color: rgba(148, 184, 255, 0.55); }
        .eco-icon { width: 48px; height: 48px; display: grid; place-items: center; margin-bottom: 16px; border-radius: 13px; color: #ffffff; font-size: 21px; border: 1px solid rgba(255, 255, 255, 0.28); }
        .eco-tone-0 .eco-icon { background: linear-gradient(145deg, #36b9ff, #1763e9); }
        .eco-tone-1 .eco-icon { background: linear-gradient(145deg, #bd78ff, #7041e9); }
        .eco-tone-2 .eco-icon { background: linear-gradient(145deg, #32dce9, #137dbd); }
        .eco-tone-3 .eco-icon { background: linear-gradient(145deg, #559fff, #2458d8); }
        .eco-tone-4 .eco-icon { background: linear-gradient(145deg, #f472b6, #9d174d); }
        .eco-tone-5 .eco-icon { background: linear-gradient(145deg, #fbbf24, #b45309); }
        .eco-code { font-size: 9.5px; font-weight: 800; letter-spacing: 1.4px; color: #82b4ff; margin-bottom: 6px; }
        .eco-card h3 { margin: 0 0 4px; color: #ffffff; font-size: 19px; font-weight: 800; }
        .eco-tagline { margin: 0 0 8px; color: #e2ecff; font-size: 13px; font-weight: 650; }
        .eco-desc { margin: 0; color: #b4c6e7; font-size: 12.5px; line-height: 1.58; flex: 1; }
        .eco-cta { margin-top: 16px; padding-top: 10px; border-top: 1px solid rgba(160, 192, 240, 0.16); display: inline-flex; align-items: center; gap: 6px; color: #7dd3fc; font-size: 12px; font-weight: 750; }
        .home-filter-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
        .home-filter-pill { border: 1px solid rgba(148, 184, 255, 0.24); background: rgba(15, 25, 58, 0.85); color: #c8d7f5; padding: 7px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
        .home-filter-pill:hover { border-color: rgba(148, 184, 255, 0.48); color: #ffffff; }
        .home-filter-pill.active { background: linear-gradient(110deg, #4b6bff, #7854ff); border-color: transparent; color: #ffffff; }
        .posts-grid, .video-showcase-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
        .post-card, .video-showcase-card { background: linear-gradient(160deg, rgba(20, 32, 72, 0.92), rgba(11, 19, 46, 0.96)); border: 1px solid rgba(138, 165, 255, 0.18); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; }
        .post-cover-wrap, .post-video-thumb, .video-showcase-thumb { position: relative; height: 192px; background: #070d24; overflow: hidden; }
        .post-cover-img, .post-cover-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .post-multi-badge { position: absolute; right: 10px; bottom: 10px; background: rgba(6, 11, 34, 0.85); color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; }
        .post-video-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(6, 11, 34, 0.2), rgba(6, 11, 34, 0.78)); display: flex; align-items: flex-end; justify-content: space-between; padding: 12px; }
        .post-video-tag { background: rgba(19, 200, 181, 0.22); border: 1px solid rgba(19, 200, 181, 0.5); color: #9ff5eb; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; }
        .post-video-play-btn { border: none; background: linear-gradient(110deg, #4b6bff, #7854ff); color: #ffffff; font-size: 11.5px; font-weight: 750; padding: 7px 12px; border-radius: 8px; cursor: pointer; }
        .post-video-play-btn.small { padding: 6px 10px; font-size: 11px; }
        .post-card-body, .video-showcase-body { padding: 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .post-meta-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .post-badge { background: rgba(92, 124, 255, 0.18); color: #9ec0ff; font-size: 11px; font-weight: 750; padding: 4px 10px; border-radius: 999px; }
        .post-date { color: #8ea3cc; font-size: 11.5px; }
        .post-card-body h3, .video-showcase-body h3 { margin: 0; font-size: 17px; font-weight: 750; color: #ffffff; line-height: 1.35; }
        .post-video-caption-line, .video-cap-text { margin: 0; font-size: 12px; color: #7dd3fc; font-weight: 600; }
        .post-excerpt { margin: 0; color: #b4c6e7; font-size: 13px; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .post-author-row { display: flex; align-items: center; gap: 9px; margin-top: auto; padding-top: 8px; }
        .post-author-avatar { width: 28px; height: 28px; border-radius: 8px; background: rgba(92, 124, 255, 0.25); color: #ffffff; font-size: 12px; font-weight: 800; display: grid; place-items: center; }
        .post-author-name { font-size: 12.5px; font-weight: 650; color: #dce7ff; }
        .post-actions-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 12px; border-top: 1px solid rgba(138, 165, 255, 0.14); }
        .post-action-btn { background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(138, 165, 255, 0.2); color: #dce7ff; padding: 6px 11px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
        .post-action-btn.liked { background: rgba(244, 63, 94, 0.18); border-color: rgba(244, 63, 94, 0.45); color: #fda4af; }
        :global(.post-read-link) { color: #8ab4ff; text-decoration: none; font-size: 12px; font-weight: 700; margin-left: auto; }
        .home-thread-box { margin-top: 8px; padding-top: 10px; border-top: 1px solid rgba(138, 165, 255, 0.14); color: #131c36; }
        .posts-empty { background: rgba(15, 25, 58, 0.72); border: 1px solid rgba(138, 165, 255, 0.16); border-radius: 16px; padding: 36px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .video-link-placeholder { width: 100%; height: 100%; display: grid; place-items: center; color: #9ec0ff; font-size: 13px; font-weight: 700; }
        .video-center-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; border-radius: 50%; border: none; background: rgba(75, 107, 255, 0.92); color: #ffffff; font-size: 16px; cursor: pointer; display: grid; place-items: center; }
        .video-card-footer { display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: #9cb0d9; margin-top: auto; }
        .about-card { background: linear-gradient(145deg, rgba(22, 36, 82, 0.92), rgba(11, 19, 46, 0.96)); border: 1px solid rgba(138, 165, 255, 0.2); border-radius: 22px; padding: 34px 36px; max-width: 960px; }
        .stats-strip { padding: 0 7% 10px; }
        .stats-inner { max-width: 1340px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; background: rgba(15, 25, 58, 0.6); border: 1px solid rgba(138, 165, 255, 0.16); border-radius: 16px; padding: 20px; }
        .stats-inner div { text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .stats-inner strong { font-size: 26px; font-weight: 850; color: #fff; }
        .stats-inner span { font-size: 11.5px; color: #9cb0d9; font-weight: 600; }
        .how-section, .why-section { padding: 48px 7%; }
        .how-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .how-card { background: linear-gradient(160deg, rgba(20, 32, 72, 0.9), rgba(11, 19, 46, 0.95)); border: 1px solid rgba(138, 165, 255, 0.16); border-radius: 18px; padding: 26px; }
        .how-num { font-size: 30px; font-weight: 850; color: #8ab4ff; }
        .how-card h3 { margin: 10px 0 8px; color: #fff; font-size: 17px; font-weight: 750; }
        .how-card p { margin: 0; color: #a9b9da; font-size: 13.5px; line-height: 1.65; }
        .why-grid { max-width: 1340px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: center; }
        .why-grid h2 { margin: 0 0 16px; font-size: clamp(28px, 3.6vw, 40px); font-weight: 800; letter-spacing: -0.9px; color: #fff; }
        .why-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .why-list li { color: #b4c6e7; font-size: 14px; line-height: 1.6; background: rgba(15, 25, 58, 0.6); border: 1px solid rgba(138, 165, 255, 0.14); border-radius: 12px; padding: 14px 16px; }
        .why-list strong { color: #fff; }
        .testi-card { background: linear-gradient(145deg, rgba(22, 36, 82, 0.92), rgba(11, 19, 46, 0.96)); border: 1px solid rgba(138, 165, 255, 0.2); border-radius: 18px; padding: 28px; }
        .testi-card p { margin: 0 0 16px; color: #fff; font-size: 16px; line-height: 1.6; font-weight: 650; }
        .testi-name { display: block; color: #9ec0ff; font-weight: 750; font-size: 13px; }
        .testi-role { display: block; color: #8ea3cc; font-size: 12px; margin-top: 2px; }
        .final-cta-section { padding: 12px 7% 44px; }
        .final-cta-card { max-width: 960px; margin: 0 auto; text-align: center; background: linear-gradient(110deg, rgba(75, 107, 255, 0.28), rgba(120, 84, 255, 0.28)); border: 1px solid rgba(138, 165, 255, 0.35); border-radius: 22px; padding: 36px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .final-cta-card h2 { margin: 0; font-size: clamp(26px, 3.4vw, 36px); font-weight: 850; letter-spacing: -0.8px; color: #fff; }
        .final-cta-card p { margin: 0 0 8px; color: #c7d6f5; font-size: 14.5px; line-height: 1.6; }
        .final-cta-buttons { justify-content: center; }
        .final-cta-note { color: #8ea3cc; font-size: 11.5px; }
        .site-footer { text-align: center; padding: 34px 20px; background: #050a20; color: #96a8d0; border-top: 1px solid rgba(138, 165, 255, 0.14); }
        .footer-brand { color: #ffffff; font-size: 24px; font-weight: 850; }
        .site-footer p { margin: 8px 0 6px; font-size: 13.5px; color: #d9e4ff; }
        .footer-links { display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; margin: 12px 0; }
        .footer-links :global(a) { color: #9cb0d9; text-decoration: none; font-size: 12.5px; font-weight: 600; }
        .footer-links :global(a:hover) { color: #fff; }
        .site-footer small { font-size: 11.5px; }
        .video-modal-backdrop { position: fixed; inset: 0; background: rgba(3, 7, 22, 0.84); backdrop-filter: blur(6px); z-index: 60; display: grid; place-items: center; padding: 20px; }
        .video-modal-box { width: 100%; max-width: 720px; background: #0d1838; border: 1px solid rgba(138, 165, 255, 0.28); border-radius: 18px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
        .video-modal-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .video-modal-top h3 { margin: 6px 0 0; font-size: 19px; color: #ffffff; }
        .video-modal-close { border: none; background: rgba(255, 255, 255, 0.08); color: #ffffff; width: 34px; height: 34px; border-radius: 9px; font-size: 15px; cursor: pointer; }
        .video-modal-player-wrap { border-radius: 12px; overflow: hidden; background: #050919; aspect-ratio: 16 / 9; }
        .video-modal-player, .video-modal-iframe { width: 100%; height: 100%; border: none; display: block; }
        .video-modal-external-box { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center; }
        .video-modal-caption { margin: 0; color: #c7d6f5; font-size: 13px; line-height: 1.6; }
        @media (max-width: 960px) {
          .hero-section { padding: 28px 6% 36px; }
          .hero-grid { grid-template-columns: 1fr; gap: 24px; }
          .hero-visual { min-height: 360px; }
          .hero-globe-img { width: 100%; max-width: 720px; height: auto; }
          .features-section, .ecosystem-section, .posts-section, .video-showcase-section, .about-section { padding: 40px 6%; }
          .features-grid, .ecosystem-grid, .posts-grid, .video-showcase-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .stats-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .how-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .why-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .top-nav { flex-wrap: wrap; justify-content: center; padding: 12px 5%; }
          .nav-links { flex-wrap: wrap; justify-content: center; gap: 10px 14px; }
          .hero-visual { min-height: 260px; }
          .hero-globe-img { max-width: 100%; height: auto; }
          .about-card { padding: 24px 20px; }
          .features-grid, .ecosystem-grid, .posts-grid, .video-showcase-grid { grid-template-columns: 1fr; }
          .how-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}
