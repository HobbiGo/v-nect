"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { PostThreadComments } from "@/components/PostThreadComments";

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
const LOCAL_CAPTIONS_STORAGE_KEY = "voinnect_business_post_image_captions_v1";

const modules = [
  {
    number: "01",
    name: "VOIN Chat",
    description: "Connect and communicate with people and businesses.",
  },
  {
    number: "02",
    name: "VOIN Connect",
    description: "Voice, video meetings and global collaboration.",
  },
  {
    number: "03",
    name: "VOIN Business",
    description: "Build your professional and company identity.",
  },
  {
    number: "04",
    name: "Business Feed",
    description: "Discover business updates, news and opportunities.",
  },
  {
    number: "05",
    name: "VOIN Community",
    description: "Meet professionals and grow your network.",
  },
  {
    number: "06",
    name: "VOIN Marketplace",
    description: "Discover products, services and suppliers.",
  },
];

const categoryLabels: Record<string, string> = {
  announcement: "Announcement",
  company_news: "Company News",
  news: "Company News",
  product_launch: "Product Launch",
  presentation: "Presentation",
};

function getPostImages(post: HomePost): string[] {
  const list: string[] = [];

  if (Array.isArray(post.image_urls)) {
    for (const item of post.image_urls) {
      if (typeof item === "string" && item.trim()) {
        list.push(item.trim());
      }
    }
  }

  if (list.length === 0 && post.image_url && post.image_url.trim()) {
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

function getPostImageCaptions(post: HomePost, images: string[]): string[] {
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

export default function Home() {
  const supabase = createClient();

  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  useEffect(() => {
    let active = true;

    async function loadHomeData() {
      setLoadingPosts(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active && user) {
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
          active &&
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
      }

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

    return () => {
      active = false;
    };
  }, [supabase]);

  function handleFocusImageComment(postId: string, imageIndex: number) {
    setFocusTarget((prev) => ({
      postId,
      imageIndex,
      trigger: (prev?.trigger || 0) + 1,
    }));
  }

  return (
    <main className="home-page">
      <header className="navbar">
        <a className="logo" href="#">
          <div className="logo-main">
            VOIN<span>NECT</span>
          </div>
          <small>GLOBAL BUSINESS ECOSYSTEM</small>
        </a>

        <nav>
          <a href="#platform">Platform</a>
          <a href="#business">Business</a>
          <a href="#community-posts">Community</a>
          <a href="#about">About</a>
        </nav>

        <Link className="nav-button" href="/business-feed">
          Business Feed ↗
        </Link>
      </header>

      <section className="hero" id="about">
        <div className="hero-content">
          <div className="eyebrow">
            GLOBAL BUSINESS COMMUNICATION PLATFORM
          </div>

          <h1>
            Connect Beyond
            <span> Boundaries.</span>
          </h1>

          <p>
            One connected ecosystem for communication,
            collaboration, business networking and global
            opportunities.
          </p>

          <div className="hero-actions" id="get-started">
            <a className="primary-button" href="#platform">
              Explore Platform ↗
            </a>
            <Link className="secondary-button" href="/business-feed">
              Open Business Feed
            </Link>
          </div>

          <div className="hero-caption">
            ONE ACCOUNT. ONE ECOSYSTEM. GLOBAL CONNECTIONS.
          </div>
        </div>

        <div className="hero-visual">
          <div className="orbit-ring" />
          <div className="core">
            <span>V</span>
          </div>

          <div className="orbit-label label-one">BUSINESS</div>
          <div className="orbit-label label-two">CONNECT</div>
          <div className="orbit-label label-three">COMMUNITY</div>
          <div className="orbit-label label-four">GLOBAL</div>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-heading">
          <span>THE VOINNECT ECOSYSTEM</span>
          <h2>Everything Connected.</h2>
          <p>
            A unified digital environment designed to
            bring businesses and people closer.
          </p>
        </div>

        <div className="module-grid">
          {modules.map((module) => (
            <article className="module-card" key={module.number}>
              <span className="module-number">{module.number}</span>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <span className="module-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="business-section" id="business">
        <div className="business-inner">
          <span>BUILT FOR A CONNECTED WORLD</span>
          <h2>
            Your Business.
            <br />
            Your Network.
            <br />
            Your Opportunities.
          </h2>
          <p>
            VOINNECT — Building a More Connected Business World.
          </p>
        </div>
      </section>

      <section className="home-posts-section" id="community-posts">
        <div className="home-posts-inner">
          <div className="home-posts-header">
            <div>
              <span>LIVE COMMUNITY &amp; BUSINESS UPDATES</span>
              <h2>Latest Posts &amp; Discussion</h2>
              <p>
                Explore published business updates and join the live comment thread directly from the main page.
              </p>
            </div>

            <Link href="/business-feed" className="view-all-link">
              View Full Feed →
            </Link>
          </div>

          {loadingPosts ? (
            <div className="home-posts-empty">
              <p>Loading latest posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="home-posts-empty">
              <p>No published posts yet.</p>
              <Link href="/business-feed" className="primary-button">
                Go to Business Feed ↗
              </Link>
            </div>
          ) : (
            <div className="home-posts-list">
              {posts.map((post) => {
                const postImages = getPostImages(post);
                const postImageCaptions = getPostImageCaptions(post, postImages);
                const isFocusedPost = focusTarget?.postId === post.id;

                return (
                  <article className="home-post-card" key={post.id}>
                    <div className="home-post-top">
                      <div className="home-company-info">
                        {post.companies?.logo_url ? (
                          <img
                            src={post.companies.logo_url}
                            alt={post.companies.company_name || "Company"}
                          />
                        ) : (
                          <div className="home-company-avatar">
                            {post.companies?.company_name
                              ?.charAt(0)
                              .toUpperCase() || "C"}
                          </div>
                        )}
                        <div>
                          <strong>
                            {post.companies?.company_name || "Company"}
                          </strong>
                          <small>{formatDate(post.created_at)}</small>
                        </div>
                      </div>

                      <span className="home-post-badge">
                        {categoryLabels[post.post_type] || post.post_type}
                      </span>
                    </div>

                    <div className="home-post-body">
                      <h3>{post.title}</h3>
                      <p>{post.content}</p>

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
                                key={`${post.id}-home-img-${idx}`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`${post.title} (${idx + 1})`}
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
                                      handleFocusImageComment(post.id, idx)
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
                      postId={post.id}
                      currentUserId={currentUserId}
                      currentUserName={currentUserName}
                      imageLabels={postImages.map(
                        (_, idx) => postImageCaptions[idx] || `Image ${idx + 1}`
                      )}
                      focusedImageIndex={
                        isFocusedPost ? focusTarget.imageIndex : null
                      }
                      focusTrigger={isFocusedPost ? focusTarget.trigger : 0}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="logo footer-logo">
          <div className="logo-main">
            VOIN<span>NECT</span>
          </div>
        </div>
        <p>Connect Beyond Boundaries.</p>
        <small>© 2026 VOINNECT. All rights reserved.</small>
      </footer>

      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: #07111f;
          color: #eef4fb;
          font-family: Arial, sans-serif;
        }

        .navbar {
          min-height: 76px;
          padding: 12px 7%;
          background: #07111f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .logo {
          color: #ffffff;
          text-decoration: none;
          display: inline-flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .logo-main {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1px;
          white-space: nowrap;
          line-height: 1.1;
        }

        .footer-logo {
          align-items: center;
        }

        .logo span,
        .hero h1 span {
          color: #13c8b5;
        }

        .logo small {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.8px;
          color: #8fa3bd;
          margin-top: 3px;
          white-space: nowrap;
        }

        .navbar nav {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .navbar nav a {
          color: #c5d2e4;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }

        .navbar nav a:hover {
          color: #13c8b5;
        }

        .nav-button {
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          text-decoration: none;
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 64px 24px 52px;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr);
          gap: 36px;
          align-items: center;
        }

        .eyebrow {
          color: #13c8b5;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero h1 {
          font-size: 46px;
          line-height: 1.15;
          margin: 14px 0;
        }

        .hero p {
          color: #b7c8dd;
          font-size: 15px;
          line-height: 1.75;
          max-width: 560px;
          margin: 0;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          text-decoration: none;
          padding: 11px 18px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.24);
          color: #e6effa;
          text-decoration: none;
          padding: 11px 18px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
        }

        .secondary-button:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: #13c8b5;
        }

        .hero-caption {
          margin-top: 20px;
          font-size: 10px;
          letter-spacing: 1.6px;
          color: #7f95b0;
          font-weight: 700;
        }

        .hero-visual {
          position: relative;
          min-height: 240px;
          display: grid;
          place-items: center;
          background: radial-gradient(
            circle,
            rgba(19, 200, 181, 0.12) 0%,
            rgba(7, 17, 31, 0) 70%
          );
          border-radius: 20px;
          padding: 20px;
        }

        .orbit-ring {
          position: absolute;
          width: 170px;
          height: 170px;
          border-radius: 999px;
          border: 1px dashed rgba(126, 232, 220, 0.3);
        }

        .core {
          position: relative;
          z-index: 2;
          width: 82px;
          height: 82px;
          border-radius: 999px;
          background: linear-gradient(135deg, #347cf0, #13bcae);
          display: grid;
          place-items: center;
          font-size: 32px;
          font-weight: 900;
          color: #ffffff;
          box-shadow: 0 10px 28px rgba(19, 200, 181, 0.25);
        }

        .orbit-label {
          position: absolute;
          z-index: 3;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: #7ee8dc;
          background: #0d213a;
          border: 1px solid rgba(126, 232, 220, 0.28);
          padding: 5px 10px;
          border-radius: 999px;
        }

        .label-one {
          top: 18px;
          left: 12%;
        }

        .label-two {
          top: 18px;
          right: 12%;
        }

        .label-three {
          bottom: 18px;
          left: 12%;
        }

        .label-four {
          bottom: 18px;
          right: 12%;
        }

        .platform-section,
        .business-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 44px 24px;
        }

        .section-heading span,
        .business-section span,
        .home-posts-header span {
          color: #13c8b5;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .section-heading h2,
        .home-posts-header h2 {
          font-size: 30px;
          margin: 8px 0;
        }

        .section-heading p,
        .home-posts-header p {
          color: #a9bcd3;
          font-size: 14px;
          line-height: 1.65;
          margin: 0;
        }

        .module-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .module-card {
          background: #0e1e34;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .module-number {
          font-size: 11px;
          font-weight: 800;
          color: #13c8b5;
        }

        .module-card h3 {
          margin: 2px 0 0;
          font-size: 17px;
          color: #ffffff;
        }

        .module-card p {
          margin: 0;
          color: #9fb2c9;
          font-size: 13px;
          line-height: 1.6;
        }

        .module-arrow {
          margin-top: auto;
          padding-top: 8px;
          font-size: 13px;
          color: #7ee8dc;
          font-weight: 700;
        }

        .business-section {
          padding-bottom: 56px;
        }

        .business-inner {
          background: linear-gradient(125deg, #102b4d, #124663);
          border: 1px solid rgba(126, 232, 220, 0.16);
          border-radius: 18px;
          padding: 36px 32px;
        }

        .business-section h2 {
          font-size: 34px;
          line-height: 1.25;
          margin: 12px 0;
        }

        .business-section p {
          color: #c5d6ea;
          font-size: 14px;
          margin: 0;
        }

        .home-posts-section {
          background: #f3f6fb;
          color: #15243a;
          padding: 56px 24px 72px;
        }

        .home-posts-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .home-posts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .home-posts-header p {
          color: #5b6d84;
          margin-top: 6px;
        }

        .view-all-link {
          color: #2874db;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          padding: 9px 14px;
          background: #e6efff;
          border-radius: 8px;
          white-space: nowrap;
        }

        .home-posts-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .home-post-card {
          background: #ffffff;
          border: 1px solid #e4eaf2;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 5px 18px rgba(20, 42, 70, 0.04);
        }

        .home-post-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-bottom: 14px;
          border-bottom: 1px solid #edf0f5;
        }

        .home-company-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .home-company-info img,
        .home-company-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .home-company-avatar {
          display: grid;
          place-items: center;
          background: #e8f1ff;
          color: #2874db;
          font-weight: 800;
        }

        .home-company-info strong {
          display: block;
          font-size: 13px;
          color: #1d3048;
        }

        .home-company-info small {
          display: block;
          font-size: 11px;
          color: #8b9bb0;
        }

        .home-post-badge {
          background: #edf5ff;
          color: #397bd2;
          padding: 6px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .home-post-body {
          padding: 16px 0 6px;
        }

        .home-post-body h3 {
          margin: 0 0 8px;
          font-size: 18px;
          color: #1d3048;
        }

        .home-post-body p {
          margin: 0;
          color: #5b6d84;
          font-size: 13px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .home-images-grid {
          margin-top: 14px;
          display: grid;
          gap: 10px;
        }

        .home-images-grid.single {
          grid-template-columns: 1fr;
        }

        .home-images-grid.multi {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .home-image-card {
          border-radius: 10px;
          overflow: hidden;
          background: #0d1d31;
          border: 1px solid #e4eaf2;
        }

        .home-image-card img {
          display: block;
          width: 100%;
          max-height: 360px;
          object-fit: contain;
          object-position: center;
          background: #0d1d31;
        }

        .home-image-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 8px 12px;
          background: #10243d;
          color: #e6eef8;
          border-top: 1px solid #1d3656;
        }

        .home-image-caption {
          font-size: 12px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .home-image-comment-btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 12px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .home-image-comment-btn:hover {
          background: rgba(19, 188, 174, 0.35);
          border-color: #13bcae;
        }

        .home-posts-empty {
          background: #ffffff;
          border: 1px solid #e4eaf2;
          border-radius: 12px;
          padding: 28px;
          text-align: center;
          color: #5b6d84;
        }

        .footer {
          text-align: center;
          padding: 32px 20px;
          background: #050d18;
          color: #8494aa;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .footer p {
          margin: 8px 0 4px;
          font-size: 13px;
          color: #c5d2e4;
        }

        .footer small {
          font-size: 11px;
        }

        @media (max-width: 800px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 40px;
          }

          .module-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 540px) {
          .navbar {
            padding: 12px 16px;
          }

          .navbar nav {
            gap: 14px;
          }

          .navbar nav a {
            font-size: 12px;
          }

          .hero h1 {
            font-size: 32px;
          }

          .business-inner {
            padding: 24px 20px;
          }

          .business-section h2 {
            font-size: 26px;
          }

          .module-grid,
          .home-images-grid.multi {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
