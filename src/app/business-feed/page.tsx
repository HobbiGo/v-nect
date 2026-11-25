
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Post = {
  id: string;
  company_id: string;
  author_id: string;
  title: string;
  content: string;
  post_type: string;
  image_url: string | null;
  status: string;
  created_at: string;
  companies: {
    company_name: string;
    logo_url: string | null;
  } | null;
};

type Company = {
  id: string;
  company_name: string;
  logo_url: string | null;
};

const categories = [
  { value: "all", label: "All Posts" },
  { value: "announcement", label: "Announcements" },
  { value: "news", label: "Company News" },
  { value: "product_launch", label: "Product Launch" },
  { value: "presentation", label: "Presentations" },
];

const categoryLabels: Record<string, string> = {
  announcement: "Announcement",
  news: "Company News",
  product_launch: "Product Launch",
  presentation: "Presentation",
};

const categoryIcons: Record<string, string> = {
  announcement: "📢",
  news: "📰",
  product_launch: "🚀",
  presentation: "📊",
};

export default function BusinessFeedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [userId, setUserId] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("announcement");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);

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
          .select("id, company_name, logo_url")
          .eq("id", settings.active_company_id)
          .eq("owner_id", user.id)
          .maybeSingle();

        setCompany(companyData as Company | null);
      }
    }

    const { data, error: feedError } = await supabase
      .from("business_posts")
      .select(`
        id,
        company_id,
        author_id,
        title,
        content,
        post_type,
        image_url,
        status,
        created_at,
        companies (
          company_name,
          logo_url
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (feedError) {
      setError(feedError.message);
      setPosts([]);
    } else {
      setPosts((data || []) as unknown as Post[]);
    }

    setLoading(false);
  }

  async function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !company) {
      setError("Please switch to your company profile first.");
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError("Please complete the title and content.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const { error: insertError } = await supabase
      .from("business_posts")
      .insert({
        company_id: company.id,
        author_id: userId,
        title: title.trim(),
        content: content.trim(),
        post_type: postType,
        image_url: imageUrl.trim() || null,
        status: "published",
      });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setTitle("");
    setContent("");
    setImageUrl("");
    setPostType("announcement");
    setShowComposer(false);

    setSuccess("Your post has been published successfully!");
    await loadFeed();

    setSubmitting(false);
  }

  async function deletePost(postId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("business_posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setPosts((current) => current.filter((post) => post.id !== postId));
    setSuccess("Post deleted successfully.");
  }

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((post) => post.post_type === filter);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="feed-page">
      <header className="topbar">
        <Link href="/" className="brand">
          VOIN<span>NECT</span>
        </Link>

        <nav className="top-links">
          <Link href="/dashboard">Personal</Link>
          <Link href="/company">Company Dashboard</Link>
        </nav>
      </header>

      <section className="feed-container">
        <div className="hero">
          <div>
            <div className="eyebrow">VOIN NETWORK ECOSYSTEM</div>
            <h1>Business <span>Feed.</span></h1>
            <p>
              Discover company updates, business announcements,
              innovations, and new opportunities.
            </p>
          </div>

          <div className="hero-icon">◈</div>
        </div>

        <div className="feed-layout">
          <aside className="left-panel">
            <div className="panel-card">
              <div className="panel-heading">EXPLORE</div>

              <button
                className={filter === "all" ? "category active" : "category"}
                onClick={() => setFilter("all")}
              >
                <span>🌐</span> All Posts
              </button>

              {categories.slice(1).map((item) => (
                <button
                  key={item.value}
                  className={
                    filter === item.value ? "category active" : "category"
                  }
                  onClick={() => setFilter(item.value)}
                >
                  <span>{categoryIcons[item.value]}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="panel-card company-card">
              <div className="panel-heading">YOUR COMPANY</div>

              {company ? (
                <>
                  <div className="company-identity">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="Company logo" />
                    ) : (
                      <div className="company-avatar">
                        {company.company_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <strong>{company.company_name}</strong>
                      <small>Company Profile</small>
                    </div>
                  </div>

                  <button
                    className="create-button"
                    onClick={() => {
                      setShowComposer(!showComposer);
                      setError("");
                    }}
                  >
                    + Create Post
                  </button>

                  <Link href="/company" className="manage-link">
                    Manage Company →
                  </Link>
                </>
              ) : (
                <>
                  <p className="muted">
                    Switch to your company profile to publish business updates.
                  </p>
                  <Link href="/company" className="create-button">
                    Go to Company Dashboard
                  </Link>
                </>
              )}
            </div>
          </aside>

          <section className="timeline">
            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            {showComposer && company && (
              <div className="composer">
                <div className="composer-heading">
                  <div>
                    <span className="eyebrow">PUBLISH UPDATE</span>
                    <h2>Create a Post</h2>
                  </div>
                  <button
                    className="close-button"
                    onClick={() => setShowComposer(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={createPost}>
                  <label>Post Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your post title"
                    maxLength={150}
                    required
                  />

                  <label>Category</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                  >
                    {categories.slice(1).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <label>Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share something about your company..."
                    rows={5}
                    required
                  />

                  <label>Image URL (optional)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />

                  <button
                    type="submit"
                    className="publish-button"
                    disabled={submitting}
                  >
                    {submitting ? "Publishing..." : "Publish Post →"}
                  </button>
                </form>
              </div>
            )}

            <div className="timeline-heading">
              <div>
                <span className="eyebrow">COMMUNITY UPDATES</span>
                <h2>Latest Updates</h2>
              </div>

              <span className="post-count">
                {filteredPosts.length} Posts
              </span>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="loader" />
                <p>Loading business feed...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <h3>No posts yet</h3>
                <p>
                  Business updates will appear here when companies
                  publish their posts.
                </p>

                {company && (
                  <button
                    className="create-button"
                    onClick={() => setShowComposer(true)}
                  >
                    Create the First Post
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => {
                const isOwner =
                  Boolean(userId) &&
                  post.author_id === userId;

                return (
                  <article className="post-card" key={post.id}>
                    <div className="post-header">
                      <div className="company-identity">
                        {post.companies?.logo_url ? (
                          <img
                            src={post.companies.logo_url}
                            alt="Company logo"
                          />
                        ) : (
                          <div className="company-avatar">
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

                      <span className="post-category">
                        {categoryIcons[post.post_type]}{" "}
                        {categoryLabels[post.post_type] || post.post_type}
                      </span>
                    </div>

                    <div className="post-body">
                      <h3>{post.title}</h3>
                      <p>{post.content}</p>

                      {post.image_url && (
                        <img
                          className="post-image"
                          src={post.image_url}
                          alt={post.title}
                        />
                      )}
                    </div>

                    <div className="post-footer">
                      <span>◈ VOIN Business Feed</span>

                      {isOwner && (
                        <button
                          className="delete-button"
                          onClick={() => deletePost(post.id)}
                        >
                          Delete Post
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </section>

      <footer className="feed-footer">
        © {new Date().getFullYear()} VOINNECT · Connecting Beyond Boundaries
      </footer>

      <style jsx>{`
        .feed-page {
          min-height: 100vh;
          background: #f3f6fb;
          color: #15243a;
          font-family: Arial, sans-serif;
        }

        .topbar {
          height: 70px;
          padding: 0 7%;
          background: #07111f;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          color: white;
          font-size: 23px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: 1px;
        }

        .brand span,
        .hero h1 span {
          color: #13c8b5;
        }

        .top-links {
          display: flex;
          gap: 24px;
        }

        .top-links a {
          color: #c5d2e4;
          font-size: 13px;
          text-decoration: none;
        }

        .feed-container {
          max-width: 1200px;
          margin: auto;
          padding: 35px 24px 70px;
        }

        .hero {
          background: linear-gradient(120deg, #102b4d, #145b79);
          border-radius: 18px;
          padding: 42px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
        }

        .eyebrow {
          color: #13c8b5;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero h1 {
          font-size: 42px;
          margin: 12px 0;
        }

        .hero p {
          color: #d0deed;
          font-size: 14px;
          line-height: 1.7;
          max-width: 580px;
        }

        .hero-icon {
          font-size: 95px;
          color: #13c8b5;
          opacity: 0.8;
        }

        .feed-layout {
          display: grid;
          grid-template-columns: 270px minmax(0, 1fr);
          gap: 25px;
          margin-top: 28px;
          align-items: start;
        }

        .left-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .panel-card,
        .composer,
        .post-card,
        .empty-state {
          background: white;
          border: 1px solid #e4eaf2;
          border-radius: 14px;
          padding: 21px;
          box-shadow: 0 5px 18px rgba(20, 42, 70, 0.035);
        }

        .panel-heading {
          font-size: 10px;
          font-weight: 800;
          color: #8291a5;
          letter-spacing: 1.5px;
          margin-bottom: 15px;
        }

        .category {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          border: none;
          background: transparent;
          padding: 12px;
          border-radius: 9px;
          text-align: left;
          color: #596b82;
          font-size: 12px;
          cursor: pointer;
        }

        .category.active {
          background: #eaf2ff;
          color: #2874db;
          font-weight: 700;
        }

        .company-identity {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .company-identity img,
        .company-avatar {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .company-avatar {
          display: grid;
          place-items: center;
          background: #e8f1ff;
          color: #2874db;
          font-size: 18px;
          font-weight: 800;
        }

        .company-identity strong {
          display: block;
          font-size: 12px;
          color: #263a53;
          overflow-wrap: anywhere;
        }

        .company-identity small {
          display: block;
          margin-top: 5px;
          color: #91a0b2;
          font-size: 10px;
        }

        .create-button,
        .publish-button {
          display: block;
          width: 100%;
          padding: 12px;
          margin-top: 18px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: white;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .manage-link {
          display: block;
          margin-top: 15px;
          color: #347cf0;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
        }

        .muted {
          color: #8392a6;
          font-size: 12px;
          line-height: 1.7;
        }

        .timeline {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .timeline-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 2px;
        }

        .timeline-heading h2,
        .composer h2 {
          font-size: 21px;
          margin: 7px 0 0;
        }

        .post-count {
          background: #e6efff;
          color: #347cf0;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .composer-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .close-button {
          border: none;
          background: #f0f3f8;
          border-radius: 8px;
          padding: 9px 12px;
          cursor: pointer;
        }

        .composer form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .composer label {
          color: #53657b;
          font-size: 11px;
          font-weight: 700;
          margin-top: 8px;
        }

        .composer input,
        .composer select,
        .composer textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfe6ef;
          border-radius: 8px;
          padding: 12px;
          background: #fbfcfe;
          color: #24364d;
          font: inherit;
          font-size: 12px;
          outline: none;
        }

        .composer input:focus,
        .composer select:focus,
        .composer textarea:focus {
          border-color: #347cf0;
        }

        .composer textarea {
          resize: vertical;
        }

        .publish-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-bottom: 17px;
          border-bottom: 1px solid #edf0f5;
        }

        .post-category {
          background: #edf5ff;
          color: #397bd2;
          padding: 7px 10px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .post-body {
          padding: 20px 0;
        }

        .post-body h3 {
          font-size: 19px;
          margin: 0 0 12px;
          color: #1d3048;
          overflow-wrap: anywhere;
        }

        .post-body p {
          color: #64758a;
          font-size: 13px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .post-image {
          display: block;
          width: 100%;
          max-height: 380px;
          object-fit: cover;
          border-radius: 11px;
          margin-top: 18px;
        }

        .post-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #edf0f5;
          padding-top: 15px;
          color: #96a4b5;
          font-size: 10px;
        }

        .delete-button {
          background: transparent;
          border: none;
          color: #d95353;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 55px 25px;
        }

        .empty-icon {
          font-size: 38px;
          color: #347cf0;
        }

        .empty-state h3 {
          margin: 14px 0 8px;
        }

        .empty-state p {
          color: #8492a5;
          font-size: 12px;
          line-height: 1.7;
          max-width: 360px;
          margin: 0 auto;
        }

        .empty-state .create-button {
          max-width: 220px;
          margin-left: auto;
          margin-right: auto;
        }

        .loader {
          width: 28px;
          height: 28px;
          border: 3px solid #e4ebf5;
          border-top-color: #347cf0;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .alert {
          padding: 13px 15px;
          border-radius: 9px;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .alert.error {
          background: #fff0f0;
          color: #bd3d3d;
        }

        .alert.success {
          background: #eafaf3;
          color: #168457;
        }

        .feed-footer {
          text-align: center;
          padding: 25px;
          background: #07111f;
          color: #8494aa;
          font-size: 11px;
        }

        @media (max-width: 800px) {
          .feed-layout {
            grid-template-columns: 1fr;
          }

          .left-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .hero {
            padding: 30px;
          }

          .hero h1 {
            font-size: 34px;
          }

          .hero-icon {
            font-size: 65px;
          }
        }

        @media (max-width: 540px) {
          .topbar {
            padding: 0 18px;
            height: 62px;
          }

          .brand {
            font-size: 19px;
          }

          .top-links {
            gap: 12px;
          }

          .top-links a {
            font-size: 10px;
          }

          .feed-container {
            padding: 20px 14px 45px;
          }

          .hero {
            padding: 25px 20px;
            border-radius: 13px;
          }

          .hero h1 {
            font-size: 29px;
          }

          .hero p {
            font-size: 12px;
          }

          .hero-icon {
            font-size: 45px;
          }

          .left-panel {
            grid-template-columns: 1fr;
          }

          .post-card,
          .composer,
          .panel-card {
            padding: 16px;
          }

          .post-body h3 {
            font-size: 17px;
          }
        }
      `}</style>
    </main>
  );
}
