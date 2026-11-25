
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
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

const BUCKET_NAME = "business-posts";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
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
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [userId, setUserId] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("announcement");
  const [imageUrl, setImageUrl] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  // ==========================================
  // LOAD BUSINESS FEED AND ACTIVE COMPANY
  // ==========================================

  async function loadFeed() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication: ${authError.message}`);
      }

      if (!user) {
        setUserId("");
        setCompany(null);
      } else {
        setUserId(user.id);

        const { data: settings, error: settingsError } = await supabase
          .from("account_settings")
          .select("active_profile_type, active_company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (settingsError) {
          throw new Error(`Account Settings: ${settingsError.message}`);
        }

        if (!settings) {
          setCompany(null);
          throw new Error(
            "Account settings were not found for this account."
          );
        }

        if (
          settings.active_profile_type === "company" &&
          settings.active_company_id
        ) {
          const { data: companyData, error: companyError } = await supabase
            .from("companies")
            .select("id, company_name, logo_url")
            .eq("id", settings.active_company_id)
            .eq("owner_id", user.id)
            .maybeSingle();

          if (companyError) {
            throw new Error(`Company Lookup: ${companyError.message}`);
          }

          if (!companyData) {
            setCompany(null);
            throw new Error(
              "Company profile could not be found. Please check company access permissions."
            );
          }

          setCompany(companyData as Company);
        } else {
          setCompany(null);
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
        throw new Error(`Business Feed: ${feedError.message}`);
      }

      setPosts((data || []) as unknown as Post[]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      console.error("VOINNECT Business Feed Error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // RESET COMPOSER
  // ==========================================

  function resetComposer() {
    setTitle("");
    setContent("");
    setPostType("announcement");
    setImageUrl("");
    setImageFile(null);
    setRemoveCurrentImage(false);
    setEditingPostId(null);
    setShowComposer(false);
  }

  // ==========================================
  // IMAGE VALIDATION
  // ==========================================

  function getSupportedImageType(file: File): string | null {
    if (ALLOWED_IMAGE_TYPES[file.type]) {
      return file.type;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "jpg" || extension === "jpeg") {
      return "image/jpeg";
    }

    if (extension === "png") {
      return "image/png";
    }

    if (extension === "webp") {
      return "image/webp";
    }

    return null;
  }

  function validateImage(file: File): string | null {
    if (file.size > MAX_IMAGE_SIZE) {
      return "Ukuran gambar maksimal 5 MB.";
    }

    if (!getSupportedImageType(file)) {
      return "Format gambar belum didukung. Gunakan JPG, PNG, atau WebP.";
    }

    return null;
  }

  // ==========================================
  // STORAGE HELPERS
  // ==========================================

  function getStoragePath(publicUrl: string | null) {
    if (!publicUrl) return null;

    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const markerIndex = publicUrl.indexOf(marker);

    if (markerIndex === -1) return null;

    const path = publicUrl
      .slice(markerIndex + marker.length)
      .split("?")[0];

    if (!path || path.startsWith("/")) return null;

    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  async function uploadImage(file: File) {
    if (!company) {
      throw new Error("Company profile is not available.");
    }

    const validationError = validateImage(file);

    if (validationError) {
      throw new Error(validationError);
    }

    const contentType = getSupportedImageType(file);

    if (!contentType) {
      throw new Error("Unsupported image format.");
    }

    const extension = ALLOWED_IMAGE_TYPES[contentType];

    const uniqueName =
      `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

    const filePath = `${company.id}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType,
      });

    if (uploadError) {
      throw new Error(`Image upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      throw new Error("Could not generate the public image URL.");
    }

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  }

  async function removeStoredImage(publicUrl: string | null) {
    const path = getStoragePath(publicUrl);

    if (!path) return;

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (storageError) {
      console.error("Image cleanup failed:", storageError.message);
    }
  }

  // ==========================================
  // IMAGE SELECTION
  // ==========================================

  function handleImageChange(file: File | null) {
    setError("");

    if (!file) {
      setImageFile(null);
      return;
    }

    const validationError = validateImage(file);

    if (validationError) {
      setImageFile(null);
      setError(validationError);
      return;
    }

    setImageFile(file);
    setRemoveCurrentImage(false);
  }

  // ==========================================
  // CREATE AND EDIT POST
  // ==========================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    let uploadedUrl: string | null = null;
    let uploadedPath: string | null = null;

    try {
      const oldPost = editingPostId
        ? posts.find((post) => post.id === editingPostId)
        : null;

      if (editingPostId && !oldPost) {
        throw new Error("The post could not be found. Please refresh.");
      }

      if (
        oldPost &&
        (oldPost.author_id !== userId || oldPost.company_id !== company.id)
      ) {
        throw new Error(
          "You cannot edit this post from the current company."
        );
      }

      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        uploadedUrl = uploaded.publicUrl;
        uploadedPath = uploaded.filePath;
      }

      const finalImageUrl = uploadedUrl
        ? uploadedUrl
        : removeCurrentImage
          ? null
          : imageUrl.trim() || null;

      if (editingPostId) {
        const { error: updateError } = await supabase
          .from("business_posts")
          .update({
            title: title.trim(),
            content: content.trim(),
            post_type: postType,
            image_url: finalImageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPostId)
          .eq("author_id", userId)
          .eq("company_id", company.id);

        if (updateError) {
          if (uploadedPath) {
            await supabase.storage.from(BUCKET_NAME).remove([uploadedPath]);
          }

          throw new Error(updateError.message);
        }

        if (oldPost?.image_url && oldPost.image_url !== finalImageUrl) {
          await removeStoredImage(oldPost.image_url);
        }

        setSuccess("Your post has been updated successfully!");
      } else {
        const { error: insertError } = await supabase
          .from("business_posts")
          .insert({
            company_id: company.id,
            author_id: userId,
            title: title.trim(),
            content: content.trim(),
            post_type: postType,
            image_url: finalImageUrl,
            status: "published",
          });

        if (insertError) {
          if (uploadedPath) {
            await supabase.storage.from(BUCKET_NAME).remove([uploadedPath]);
          }

          throw new Error(insertError.message);
        }

        setSuccess("Your post has been published successfully!");
      }

      resetComposer();
      await loadFeed();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";

      console.error("VOINNECT post submission error:", err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // ==========================================
  // START EDITING
  // ==========================================

  function startEditing(post: Post) {
    if (!company || post.company_id !== company.id) {
      setError("Please switch to the correct company profile first.");
      return;
    }

    setEditingPostId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setPostType(post.post_type);
    setImageUrl(post.image_url || "");
    setImageFile(null);
    setRemoveCurrentImage(false);
    setShowComposer(true);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================
  // DELETE POST
  // ==========================================

  async function deletePost(post: Post) {
    if (
      !userId ||
      !company ||
      post.author_id !== userId ||
      post.company_id !== company.id
    ) {
      setError("You cannot delete this post from the current company.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("business_posts")
      .delete()
      .eq("id", post.id)
      .eq("author_id", userId)
      .eq("company_id", company.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await removeStoredImage(post.image_url);

    setPosts((current) =>
      current.filter((item) => item.id !== post.id)
    );

    setSuccess("Post deleted successfully.");
  }

  // ==========================================
  // FILTER AND DATE
  // ==========================================

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

  // ==========================================
  // PAGE UI
  // ==========================================

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

            <h1>
              Business <span>Feed.</span>
            </h1>

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

              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={
                    filter === item.value ? "category active" : "category"
                  }
                  onClick={() => setFilter(item.value)}
                >
                  <span>
                    {item.value === "all"
                      ? "🌐"
                      : categoryIcons[item.value]}
                  </span>

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
                    type="button"
                    className="create-button"
                    onClick={() => {
                      if (showComposer) {
                        resetComposer();
                      } else {
                        setEditingPostId(null);
                        setTitle("");
                        setContent("");
                        setPostType("announcement");
                        setImageUrl("");
                        setImageFile(null);
                        setRemoveCurrentImage(false);
                        setShowComposer(true);
                        setError("");
                      }
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
                    <span className="eyebrow">
                      {editingPostId ? "UPDATE YOUR POST" : "PUBLISH UPDATE"}
                    </span>

                    <h2>{editingPostId ? "Edit Post" : "Create a Post"}</h2>
                  </div>

                  <button
                    type="button"
                    className="close-button"
                    onClick={resetComposer}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
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

                  <label>Upload Image</label>

                  <div className="upload-area">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        handleImageChange(e.target.files?.[0] || null);
                        e.currentTarget.value = "";
                      }}
                    />

                    <small>
                      JPG, PNG, or WebP · Maximum size 5 MB
                    </small>
                  </div>

                  {(previewUrl ||
                    (!imageFile && imageUrl && !removeCurrentImage)) && (
                    <div className="image-preview">
                      <span>IMAGE PREVIEW</span>

                      <img
                        src={previewUrl || imageUrl}
                        alt="Selected image preview"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />

                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => {
                          setImageFile(null);
                          setImageUrl("");
                          setRemoveCurrentImage(true);
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}

                  <label>Or use an Image URL (optional)</label>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setRemoveCurrentImage(false);
                    }}
                    placeholder="https://example.com/image.jpg"
                  />

                  <button
                    type="submit"
                    className="publish-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Please wait..."
                      : editingPostId
                        ? "Save Changes →"
                        : "Publish Post →"}
                  </button>

                  {editingPostId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={resetComposer}
                    >
                      Cancel Editing
                    </button>
                  )}
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
                  Business updates will appear here when companies publish
                  their posts.
                </p>

                {company && (
                  <button
                    type="button"
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
                  Boolean(company) &&
                  post.author_id === userId &&
                  company?.id === post.company_id;

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
                        <div className="post-image-container">
                          <img
                            className="post-image"
                            src={post.image_url}
                            alt={post.title}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              console.error(
                                "Business Feed image failed:",
                                post.image_url
                              );

                              e.currentTarget.style.display = "none";

                              const fallback =
                                e.currentTarget.nextElementSibling as
                                  | HTMLElement
                                  | null;

                              if (fallback) {
                                fallback.style.display = "block";
                              }
                            }}
                          />

                          <div className="image-error">
                            Image could not be displayed. Please check the
                            image format or upload a new JPG, PNG, or WebP image.
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="post-footer">
                      <span>◈ VOIN Business Feed</span>

                      {isOwner && (
                        <div className="post-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => startEditing(post)}
                          >
                            Edit Post
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => deletePost(post)}
                          >
                            Delete Post
                          </button>
                        </div>
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
          min-height: 70px;
          padding: 0 7%;
          background: #07111f;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .brand {
          color: white;
          font-size: 23px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: 1px;
          white-space: nowrap;
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
          box-sizing: border-box;
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
          gap: 10px;
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
          white-space: nowrap;
        }

        .composer-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          gap: 10px;
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

        .upload-area {
          padding: 14px;
          background: #f7faff;
          border: 1px dashed #b9cce6;
          border-radius: 9px;
        }

        .upload-area input {
          border: none;
          background: transparent;
          padding: 5px 0;
        }

        .upload-area small {
          display: block;
          color: #8b9bb0;
          font-size: 10px;
          margin-top: 7px;
        }

        .image-preview {
          padding: 13px;
          border: 1px solid #e4eaf2;
          border-radius: 10px;
          background: #fbfcfe;
          min-width: 0;
        }

        .image-preview span {
          display: block;
          color: #8291a5;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 10px;
        }

        .image-preview img {
          display: block;
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: contain;
          object-position: center;
          border-radius: 8px;
          background: #edf1f6;
        }

        .remove-image-button {
          display: block;
          margin-top: 10px;
          border: none;
          background: transparent;
          color: #d95353;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .publish-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-button {
          width: 100%;
          padding: 11px;
          border: 1px solid #dfe6ef;
          border-radius: 9px;
          background: white;
          color: #64758a;
          font-size: 12px;
          cursor: pointer;
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
          min-width: 0;
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

        .post-image-container {
          width: 100%;
          margin-top: 18px;
          overflow: hidden;
          border-radius: 11px;
          background: #edf1f6;
        }

        .post-image {
          display: block;
          width: 100%;
          height: auto;
          max-height: 450px;
          object-fit: contain;
          object-position: center;
          border-radius: 11px;
        }

        .image-error {
          display: none;
          padding: 30px 15px;
          text-align: center;
          color: #bd3d3d;
          font-size: 12px;
          line-height: 1.6;
        }

        .post-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          border-top: 1px solid #edf0f5;
          padding-top: 15px;
          color: #96a4b5;
          font-size: 10px;
        }

        .post-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .edit-button,
        .delete-button {
          background: transparent;
          border: none;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .edit-button {
          color: #347cf0;
        }

        .delete-button {
          color: #d95353;
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
            min-height: 62px;
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

          .post-image {
            max-height: 350px;
          }

          .post-actions {
            gap: 10px;
          }
        }
      `}</style>
    </main>
  );
}
