"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { PostThreadComments } from "@/components/PostThreadComments";
import { BusinessFeedNavbar } from "@/components/BusinessFeedNavbar";
import {
  LiveStoriesAndVideoComposer,
  type QueuedVideoItem,
} from "@/components/LiveStoriesAndVideoComposer";
import { VChatPanel } from "@/components/VChatPanel";
import {
  PostEngagementBar,
  ComposerActionToolbar,
  type ComposerToolKey,
} from "@/components/FeedPostActionsAndToolbar";

type Post = {
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

type Company = {
  id: string;
  company_name: string;
  logo_url: string | null;
};

type PreviewItem = {
  file: File;
  url: string;
};

type PublishedVideoClip = {
  id: string;
  fileName: string;
  startSec: number;
  endSec: number;
  playUrl: string;
  storageUploaded: boolean;
  caption: string;
};

type LocalCaptionMap = Record<string, Record<string, string>>;

type FocusTarget = {
  postId: string;
  imageIndex: number;
  trigger: number;
};

const BUCKET_NAME = "business-posts";
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const LOCAL_CAPTIONS_STORAGE_KEY = "v-nect_business_post_image_captions_v1";

const categories = [
  { value: "all", label: "All Posts" },
  { value: "announcement", label: "Announcements" },
  { value: "company_news", label: "Company News" },
  { value: "product_launch", label: "Product Launch" },
  { value: "presentation", label: "Presentations" },
];

const categoryLabels: Record<string, string> = {
  announcement: "Announcement",
  company_news: "Company News",
  news: "Company News",
  product_launch: "Product Launch",
  presentation: "Presentation",
};

const categoryIcons: Record<string, string> = {
  announcement: "📢",
  company_news: "📰",
  news: "📰",
  product_launch: "🚀",
  presentation: "📊",
};

function normalizePostTypeForDb(type: string): string {
  if (type === "company_news") return "news";
  return type;
}

function normalizePostTypeForSelect(type: string): string {
  if (type === "news") return "company_news";
  return type;
}

function extractVideoUrlFromPost(post: Post): string | null {
  const text = post.content || "";
  const linkVideoMatch = text.match(/Link Video:\s*(https?:\/\/\S+)/i);
  if (linkVideoMatch && linkVideoMatch[1]) {
    return linkVideoMatch[1].trim();
  }

  const mediaMatch = text.match(
    /(https?:\/\/\S+(?:\.mp4|\.webm|\.mov|\.m4v)(?:\?\S*)?)/i
  );
  if (mediaMatch && mediaMatch[1]) {
    return mediaMatch[1].trim();
  }

  return null;
}

function extractVideoCaptionFromPost(post: Post): string {
  const text = post.content || "";
  const match = text.match(/\[VideoCaption:\s*([^\]]+)\]/i);
  return match && match[1] ? match[1].trim() : "";
}

function cleanPostContentForDisplay(post: Post): string {
  const raw = post.content || "";
  return raw
    .replace(/\[VideoCaption:\s*[^\]]*\]/gi, "")
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
  const spaced = withoutExt.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return trimmed;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function getPostImages(post: Post): string[] {
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

function savePostCaptionsToLocal(postId: string, urls: string[], captions: string[]) {
  if (typeof window === "undefined" || !postId) return;
  try {
    const all = readLocalCaptionMap();
    const postEntry: Record<string, string> = {};
    urls.forEach((url, idx) => {
      const text = (captions[idx] || "").trim();
      if (url && text) {
        postEntry[url] = text;
      }
    });
    if (Object.keys(postEntry).length > 0) {
      all[postId] = postEntry;
    } else {
      delete all[postId];
    }
    window.localStorage.setItem(LOCAL_CAPTIONS_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Ignore storage quota errors
  }
}

function removePostCaptionsFromLocal(postId: string) {
  if (typeof window === "undefined" || !postId) return;
  try {
    const all = readLocalCaptionMap();
    if (all[postId]) {
      delete all[postId];
      window.localStorage.setItem(LOCAL_CAPTIONS_STORAGE_KEY, JSON.stringify(all));
    }
  } catch {
    // Ignore storage errors
  }
}

function getPostImageCaptions(post: Post, images: string[]): string[] {
  const localMap = readLocalCaptionMap()[post.id] || {};
  return images.map((url, idx) => {
    const dbCaption =
      Array.isArray(post.image_captions) && typeof post.image_captions[idx] === "string"
        ? post.image_captions[idx].trim()
        : "";
    if (dbCaption) return dbCaption;
    return (localMap[url] || "").trim();
  });
}

export default function BusinessFeedPage() {
  const supabase = createClient();
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const videoSectionRef = useRef<HTMLDivElement | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [userId, setUserId] = useState("");
  const [filter, setFilter] = useState("all");
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishingClipId, setPublishingClipId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showVChat, setShowVChat] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [activeComposerTool, setActiveComposerTool] = useState<ComposerToolKey | null>("image");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("announcement");

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [existingImageCaptions, setExistingImageCaptions] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newImageCaptions, setNewImageCaptions] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [publishedVideoClips, setPublishedVideoClips] = useState<PublishedVideoClip[]>([]);

  useEffect(() => {
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const generated = imageFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviewItems(generated);

    return () => {
      for (const item of generated) {
        URL.revokeObjectURL(item.url);
      }
    };
  }, [imageFiles]);

  useEffect(() => {
    if (error || success) {
      feedbackRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [error, success]);

  function handleFocusImageComment(postId: string, imageIndex: number) {
    setFocusTarget((prev) => ({
      postId,
      imageIndex,
      trigger: (prev?.trigger || 0) + 1,
    }));
  }

  function handleSelectComposerTool(tool: ComposerToolKey) {
    setActiveComposerTool(tool);
    if (tool === "video") {
      videoSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  async function handlePublishVideoBatch(items: QueuedVideoItem[], maxDurationSec: number) {
    const uploadedClips: PublishedVideoClip[] = [];
    let cloudSuccessCount = 0;

    for (const item of items) {
      let playUrl = item.previewUrl;
      let storageUploaded = false;

      if (userId) {
        const cleanExt =
          item.file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "mp4";
        const filePath = `video-clips/${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${cleanExt}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, item.file, {
            cacheControl: "3600",
            upsert: false,
            contentType: item.file.type || "video/mp4",
          });

        if (!uploadErr) {
          const { data: pub } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
          if (pub?.publicUrl) {
            playUrl = pub.publicUrl;
            storageUploaded = true;
            cloudSuccessCount += 1;
          }
        }
      }

      uploadedClips.push({
        id: item.id,
        fileName: item.file.name,
        startSec: item.startSec,
        endSec: item.endSec,
        playUrl,
        storageUploaded,
        caption: (item.caption || "").trim(),
      });
    }

    setPublishedVideoClips((prev) => [...uploadedClips, ...prev]);
    setSuccess(
      cloudSuccessCount > 0
        ? `${items.length} klip video (batas max ${maxDurationSec}s) diproses (${cloudSuccessCount} tersimpan ke Storage). Teks video sudah terbawa—klik Post ke Halaman Utama untuk menayangkan.`
        : `${items.length} klip video (batas max ${maxDurationSec}s) diproses ke daftar unggahan. Teks video sudah terbawa—klik Post ke Halaman Utama untuk menayangkan.`
    );
  }

  function updateClipCaption(clipId: string, nextCaption: string) {
    setPublishedVideoClips((prev) =>
      prev.map((item) =>
        item.id === clipId
          ? { ...item, caption: nextCaption.slice(0, 240) }
          : item
      )
    );
  }

  async function handlePublishClipToHome(clip: PublishedVideoClip) {
    if (!userId || !company) {
      setError(
        "Silakan masuk dan aktifkan profil perusahaan terlebih dahulu untuk memposting video ke halaman utama."
      );
      return;
    }

    if (publishingClipId) return;

    setPublishingClipId(clip.id);
    setError("");
    setSuccess("");

    try {
      const durationSec = Math.max(1, clip.endSec - clip.startSec);
      const cleanCaption = clip.caption.trim().replace(/\]/g, "");
      const captionMarker = cleanCaption ? `\n[VideoCaption: ${cleanCaption}]` : "";
      const videoLinkLine = clip.storageUploaded
        ? `\nLink Video: ${clip.playUrl}`
        : "";
      const descriptionLine = cleanCaption
        ? `${cleanCaption}\nHighlight (${clip.startSec}s – ${clip.endSec}s / ${durationSec} detik) dari ${company.company_name}.`
        : `Video highlight (${clip.startSec}s – ${clip.endSec}s / ${durationSec} detik) dari ${company.company_name}.`;

      const postContent = `${descriptionLine}${captionMarker}${videoLinkLine}`;
      const cleanTitle = formatCleanPostTitle(clip.fileName);

      const { error: insertError } = await supabase
        .from("business_posts")
        .insert({
          company_id: company.id,
          author_id: userId,
          title: cleanTitle,
          content: postContent,
          post_type: normalizePostTypeForDb("presentation"),
          image_url: null,
          image_urls: [],
          status: "published",
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(
        `Video "${cleanTitle}" beserta teksnya berhasil diposting ke halaman utama!`
      );
      await loadFeed();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal memposting video ke halaman utama.";
      setError(message);
    } finally {
      setPublishingClipId(null);
    }
  }

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

        const { data: settings, error: settingsError } =
          await supabase
            .from("account_settings")
            .select("active_profile_type, active_company_id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (settingsError) {
          throw new Error(
            `Account Settings: ${settingsError.message}`
          );
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
          const { data: companyData, error: companyError } =
            await supabase
              .from("companies")
              .select("id, company_name, logo_url")
              .eq("id", settings.active_company_id)
              .eq("owner_id", user.id)
              .maybeSingle();

          if (companyError) {
            throw new Error(
              `Company Lookup: ${companyError.message}`
            );
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
          image_urls,
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
        err instanceof Error
          ? err.message
          : "Something went wrong.";

      console.error("v-nect Business Feed Error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function resetComposer() {
    setTitle("");
    setContent("");
    setPostType("announcement");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setEventTitle("");
    setEventDate("");
    setExistingImages([]);
    setExistingImageCaptions([]);
    setImageFiles([]);
    setNewImageCaptions([]);
    setEditingPostId(null);
    setShowComposer(false);
  }

  function openCreateComposer() {
    setTitle("");
    setContent("");
    setPostType("announcement");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setEventTitle("");
    setEventDate("");
    setExistingImages([]);
    setExistingImageCaptions([]);
    setImageFiles([]);
    setNewImageCaptions([]);
    setEditingPostId(null);
    setShowComposer(true);
    setError("");
    setSuccess("");
  }

  function startEditPost(post: Post) {
    const imgs = getPostImages(post);
    setTitle(post.title);
    setContent(post.content);
    setPostType(normalizePostTypeForSelect(post.post_type));
    setExistingImages(imgs);
    setExistingImageCaptions(getPostImageCaptions(post, imgs));
    setImageFiles([]);
    setNewImageCaptions([]);
    setEditingPostId(post.id);
    setShowComposer(true);
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateImage(file: File): string | null {
    if (file.size <= 0) {
      return "The selected image is empty.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Ukuran gambar maksimal 5 MB per file.";
    }

    const hasImageMime = file.type.startsWith("image/");
    const hasImageExt =
      /\.(jpg|jpeg|png|webp|gif|heic|heif|avif|bmp|svg|tiff?)$/i.test(
        file.name
      );

    if (!hasImageMime && !hasImageExt) {
      return "File yang dipilih harus berupa gambar.";
    }

    return null;
  }

  function handleImagesChange(filesList: FileList | null) {
    setError("");

    if (!filesList || filesList.length === 0) {
      return;
    }

    const incoming = Array.from(filesList);
    const currentTotal = existingImages.length + imageFiles.length;
    const remainingSlots = MAX_IMAGES - currentTotal;

    if (remainingSlots <= 0) {
      setError(`Maksimal ${MAX_IMAGES} gambar per post.`);
      return;
    }

    let warning = "";
    const candidates = incoming.slice(0, remainingSlots);

    if (incoming.length > remainingSlots) {
      warning = `Maksimal ${MAX_IMAGES} gambar per post. Kelebihan gambar tidak ditambahkan.`;
    }

    const validNewFiles: File[] = [];

    for (const file of candidates) {
      const validationError = validateImage(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validNewFiles.push(file);
    }

    setImageFiles((prev) => [...prev, ...validNewFiles]);
    setNewImageCaptions((prev) => [
      ...prev,
      ...validNewFiles.map(() => ""),
    ]);

    if (warning) {
      setError(warning);
    }
  }

  function updateExistingImageCaption(index: number, value: string) {
    setExistingImageCaptions((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  }

  function updateNewImageCaption(index: number, value: string) {
    setNewImageCaptions((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  }

  function removeExistingImage(indexToRemove: number) {
    setError("");
    setExistingImages((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
    setExistingImageCaptions((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
  }

  function removeSelectedImage(indexToRemove: number) {
    setError("");
    setImageFiles((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
    setNewImageCaptions((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove)
    );
  }

  function buildFinalContent(): string {
    const parts: string[] = [content.trim()];

    if (pollQuestion.trim()) {
      const validOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOpts.length > 0) {
        parts.push(
          `\n\n📊 Poll: ${pollQuestion.trim()}\n${validOpts
            .map((opt, idx) => `• ${idx + 1}. ${opt}`)
            .join("\n")}`
        );
      }
    }

    if (eventTitle.trim()) {
      parts.push(
        `\n\n📅 Event: ${eventTitle.trim()}${
          eventDate ? ` (${eventDate})` : ""
        }`
      );
    }

    return parts.join("");
  }

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

    const finalContent = buildFinalContent();

    if (title.trim().length > 200) {
      setError("Title cannot exceed 200 characters.");
      return;
    }

    if (finalContent.length > 10000) {
      setError("Content cannot exceed 10,000 characters.");
      return;
    }

    if (existingImages.length + imageFiles.length > MAX_IMAGES) {
      setError(`Maksimal ${MAX_IMAGES} gambar per post.`);
      return;
    }

    for (const file of imageFiles) {
      const validationError = validateImage(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const isEditing = Boolean(editingPostId);
    const targetPostId = editingPostId;
    const keptImagesSnapshot = [...existingImages];
    const keptCaptionsSnapshot = existingImages.map((_, idx) =>
      (existingImageCaptions[idx] || "").trim().slice(0, 300)
    );
    const newCaptionsSnapshot = imageFiles.map((_, idx) =>
      (newImageCaptions[idx] || "").trim().slice(0, 300)
    );

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const formData = new FormData();

      if (editingPostId) {
        formData.append("post_id", editingPostId);
        formData.append(
          "keep_image_urls",
          JSON.stringify(keptImagesSnapshot)
        );
        formData.append(
          "existing_image_captions",
          JSON.stringify(keptCaptionsSnapshot)
        );
      }

      formData.append("company_id", company.id);
      formData.append("title", title.trim());
      formData.append("content", finalContent);
      formData.append(
        "post_type",
        normalizePostTypeForDb(postType)
      );
      formData.append(
        "new_image_captions",
        JSON.stringify(newCaptionsSnapshot)
      );

      for (const file of imageFiles) {
        formData.append("images", file);
      }

      const { data, error: functionError } =
        await supabase.functions.invoke(
          "moderate-business-post",
          {
            body: formData,
          }
        );

      if (functionError) {
        let message = functionError.message;

        const context = (
          functionError as unknown as {
            context?: unknown;
          }
        ).context;

        if (context instanceof Response) {
          try {
            const responseBody = await context.clone().json();

            if (
              typeof responseBody?.message === "string"
            ) {
              message = responseBody.message;
            } else if (
              typeof responseBody?.error === "string"
            ) {
              message = responseBody.error;
            }
          } catch {
            // Keep the original function error message.
          }
        }

        throw new Error(message);
      }

      if (!data || data.success !== true) {
        throw new Error(
          data?.message ||
          data?.error ||
          (isEditing
            ? "The post could not be updated."
            : "The post could not be published.")
        );
      }

      const savedPostId =
        targetPostId ||
        (typeof data?.post?.id === "string" ? data.post.id : "");
      const savedUrls: string[] = Array.isArray(data?.post?.image_urls)
        ? data.post.image_urls.filter((u: unknown): u is string => typeof u === "string")
        : keptImagesSnapshot;

      if (savedPostId && savedUrls.length > 0) {
        const mergedCaptions = savedUrls.map((url, idx) => {
          const keptIdx = keptImagesSnapshot.indexOf(url);
          if (keptIdx !== -1) {
            return keptCaptionsSnapshot[keptIdx] || "";
          }
          const newIdx = idx - keptImagesSnapshot.length;
          return newCaptionsSnapshot[newIdx] || "";
        });
        savePostCaptionsToLocal(savedPostId, savedUrls, mergedCaptions);
      }

      setSuccess(
        isEditing
          ? "Your post passed AI moderation and was updated successfully!"
          : "Your post passed AI moderation and was published successfully!"
      );

      resetComposer();
      await loadFeed();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong.";

      console.error(
        "v-nect moderated post submission error:",
        err
      );

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function getStoragePath(publicUrl: string | null) {
    if (!publicUrl) return null;

    const marker =
      `/storage/v1/object/public/${BUCKET_NAME}/`;

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

  async function removeStoredImages(urls: string[]) {
    const paths = urls
      .map((url) => getStoragePath(url))
      .filter((p): p is string => Boolean(p));

    if (paths.length === 0) return;

    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (storageError) {
      console.error(
        "Image cleanup failed:",
        storageError.message
      );
    }
  }

  async function deletePost(post: Post) {
    if (
      !userId ||
      !company ||
      post.author_id !== userId ||
      post.company_id !== company.id
    ) {
      setError(
        "You cannot delete this post from the current company."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const imagesToDelete = getPostImages(post);

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

    await removeStoredImages(imagesToDelete);
    removePostCaptionsFromLocal(post.id);

    if (editingPostId === post.id) {
      resetComposer();
    }

    setPosts((current) =>
      current.filter((item) => item.id !== post.id)
    );

    setSuccess("Post deleted successfully.");
  }

  const filteredPosts =
    filter === "all"
      ? posts
      : posts.filter((post) => {
          if (filter === "company_news") {
            return (
              post.post_type === "company_news" ||
              post.post_type === "news"
            );
          }

          return post.post_type === filter;
        });

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const totalComposerImages = existingImages.length + imageFiles.length;

  return (
    <main className="feed-page">
      <BusinessFeedNavbar activePath="/business-feed" />

      <section className="feed-container">
        <div className="top-action-strip">
          <div className="back-home-bar">
            <Link href="/" className="back-home-button">
              ← Back to Home
            </Link>
          </div>

          <button
            type="button"
            className={showVChat ? "vchat-toggle-btn active" : "vchat-toggle-btn"}
            onClick={() => setShowVChat((v) => !v)}
          >
            💬 {showVChat ? "Tutup v-chat" : "Buka v-chat Live"}
          </button>
        </div>

        <div className="hero">
          <div>
            <div className="eyebrow">
              v-nect BUSINESS ECOSYSTEM
            </div>

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

        {showVChat && (
          <div className="vchat-drawer">
            <VChatPanel currentUserName={company?.company_name || "Member"} />
          </div>
        )}

        <div className="feed-layout">
          <aside className="left-panel">
            <div className="panel-card">
              <div className="panel-heading">EXPLORE</div>

              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={
                    filter === item.value
                      ? "category active"
                      : "category"
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
              <div className="panel-heading">
                YOUR COMPANY
              </div>

              {company ? (
                <>
                  <div className="company-identity">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt="Company logo"
                      />
                    ) : (
                      <div className="company-avatar">
                        {company.company_name
                          .charAt(0)
                          .toUpperCase()}
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
                      if (showComposer && !editingPostId) {
                        resetComposer();
                      } else {
                        openCreateComposer();
                      }
                    }}
                  >
                    + Create Post
                  </button>

                  <Link
                    href="/company"
                    className="manage-link"
                  >
                    Manage Company →
                  </Link>
                </>
              ) : (
                <>
                  <p className="muted">
                    Switch to your company profile to publish
                    business updates.
                  </p>

                  <Link
                    href="/company"
                    className="create-button"
                  >
                    Go to Company Dashboard
                  </Link>
                </>
              )}
            </div>
          </aside>

          <section className="timeline">
            <div ref={feedbackRef}>
              {error && (
                <div className="alert error">{error}</div>
              )}

              {success && (
                <div className="alert success">{success}</div>
              )}
            </div>

            <div ref={videoSectionRef} className="video-composer-shell">
              <LiveStoriesAndVideoComposer
                currentAuthorName={company?.company_name || "Member"}
                onPublishVideos={handlePublishVideoBatch}
              />
            </div>

            {publishedVideoClips.length > 0 && (
              <div className="panel-card">
                <div className="panel-heading">
                  VIDEO CLIPS QUEUED ({publishedVideoClips.length})
                </div>
                <div className="video-clips-grid">
                  {publishedVideoClips.map((clip) => (
                    <div className="video-clip-card" key={clip.id}>
                      <video
                        src={clip.playUrl}
                        controls
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const box = e.currentTarget
                            .nextElementSibling as HTMLElement | null;
                          if (box) box.style.display = "flex";
                        }}
                      />
                      <div
                        className="video-fallback-box"
                        style={{ display: "none" }}
                      >
                        <span>🎬</span>
                        <strong>
                          Klip {clip.endSec - clip.startSec}s Siap
                        </strong>
                        <small>
                          {clip.storageUploaded
                            ? "Tersimpan di Storage"
                            : "Pratinjau lokal tidak didukung codec browser"}
                        </small>
                      </div>
                      <div className="video-clip-meta">
                        <strong>{formatCleanPostTitle(clip.fileName)}</strong>
                        <small>
                          Durasi klip: {clip.startSec}s – {clip.endSec}s (
                          {clip.endSec - clip.startSec} detik)
                        </small>
                        <input
                          type="text"
                          className="video-clip-caption-input"
                          value={clip.caption}
                          onChange={(e) =>
                            updateClipCaption(clip.id, e.target.value)
                          }
                          placeholder="Tulis teks / caption video..."
                          maxLength={240}
                        />
                        <button
                          type="button"
                          className="publish-clip-home-btn"
                          disabled={publishingClipId === clip.id}
                          onClick={() => handlePublishClipToHome(clip)}
                        >
                          {publishingClipId === clip.id
                            ? "Memposting..."
                            : "Post ke Halaman Utama →"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showComposer && company && (
              <div className="composer">
                <div className="composer-heading">
                  <div>
                    <span className="eyebrow">
                      {editingPostId ? "EDIT UPDATE" : "PUBLISH UPDATE"}
                    </span>

                    <h2>
                      {editingPostId ? "Edit Post" : "Create a Post"}
                    </h2>
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
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="Enter your post title"
                    maxLength={200}
                    required
                  />

                  <label>Category</label>

                  <select
                    value={postType}
                    onChange={(e) =>
                      setPostType(e.target.value)
                    }
                  >
                    {categories.slice(1).map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <label>Content</label>

                  <textarea
                    value={content}
                    onChange={(e) =>
                      setContent(e.target.value)
                    }
                    placeholder="What's on your mind? Share something about your company..."
                    rows={5}
                    maxLength={10000}
                    required
                  />

                  <ComposerActionToolbar
                    activeTool={activeComposerTool}
                    onSelectTool={handleSelectComposerTool}
                  />

                  {activeComposerTool === "poll" && (
                    <div className="extra-tool-box">
                      <label>Poll Question</label>
                      <input
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="Contoh: Fitur mana yang paling dibutuhkan tim Anda?"
                      />
                      <div className="poll-options-row">
                        {pollOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            value={opt}
                            onChange={(e) =>
                              setPollOptions((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? e.target.value : item
                                )
                              )
                            }
                            placeholder={`Opsi ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeComposerTool === "event" && (
                    <div className="extra-tool-box">
                      <label>Event Title &amp; Date</label>
                      <div className="poll-options-row">
                        <input
                          value={eventTitle}
                          onChange={(e) => setEventTitle(e.target.value)}
                          placeholder="Nama acara / webinar / product demo"
                        />
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {activeComposerTool === "more" && (
                    <div className="extra-tool-box">
                      <small>
                        Tips koneksi cepat: gunakan Video Upload di atas untuk unggah video multi-klip (otomatis potong max 30–60 detik) atau aktifkan v-chat Live untuk diskusi real-time.
                      </small>
                    </div>
                  )}

                  <label>
                    Images ({totalComposerImages}/{MAX_IMAGES})
                  </label>

                  {existingImages.length > 0 && (
                    <div className="image-preview">
                      <span>
                        CURRENT IMAGES ({existingImages.length})
                      </span>

                      <div className="preview-grid">
                        {existingImages.map((imgUrl, index) => (
                          <div className="preview-card" key={`${imgUrl}-${index}`}>
                            <img
                              src={imgUrl}
                              alt={`Current image ${index + 1}`}
                            />
                            <input
                              type="text"
                              className="image-caption-input"
                              value={existingImageCaptions[index] || ""}
                              onChange={(e) =>
                                updateExistingImageCaption(index, e.target.value)
                              }
                              placeholder={`Text for image ${index + 1}...`}
                              maxLength={300}
                            />
                            <button
                              type="button"
                              className="remove-image-button"
                              onClick={() => removeExistingImage(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="upload-area">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handleImagesChange(e.target.files);
                        e.currentTarget.value = "";
                      }}
                    />

                    <small>
                      All image formats supported · Max {MAX_IMAGES} images total · Max 5 MB each
                    </small>
                  </div>

                  {previewItems.length > 0 && (
                    <div className="image-preview">
                      <span>
                        NEW IMAGES TO UPLOAD ({previewItems.length})
                      </span>

                      <div className="preview-grid">
                        {previewItems.map((item, index) => (
                          <div className="preview-card" key={item.url}>
                            <img
                              src={item.url}
                              alt={`New image ${index + 1}`}
                            />
                            <input
                              type="text"
                              className="image-caption-input"
                              value={newImageCaptions[index] || ""}
                              onChange={(e) =>
                                updateNewImageCaption(index, e.target.value)
                              }
                              placeholder={`Text for image ${index + 1}...`}
                              maxLength={300}
                            />
                            <button
                              type="button"
                              className="remove-image-button"
                              onClick={() => removeSelectedImage(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="moderation-note">
                    <strong>AI Content Moderation</strong>
                    <p>
                      Your text and uploaded images will be
                      checked before the post is{" "}
                      {editingPostId ? "updated" : "published"}.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="publish-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Checking content..."
                      : editingPostId
                      ? "Save Changes →"
                      : "Publish Post →"}
                  </button>
                </form>
              </div>
            )}

            <div className="timeline-heading">
              <div>
                <span className="eyebrow">
                  COMMUNITY UPDATES
                </span>

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
                  Business updates will appear here when
                  companies publish their posts.
                </p>

                {company && (
                  <button
                    type="button"
                    className="create-button"
                    onClick={openCreateComposer}
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

                const postImages = getPostImages(post);
                const postImageCaptions = getPostImageCaptions(post, postImages);
                const videoUrl = extractVideoUrlFromPost(post);
                const videoCaption = extractVideoCaptionFromPost(post);
                const displayContent = cleanPostContentForDisplay(post);
                const displayTitle = formatCleanPostTitle(post.title);
                const isFocusedPost = focusTarget?.postId === post.id;

                return (
                  <article
                    className="post-card"
                    key={post.id}
                  >
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
                            {post.companies?.company_name ||
                              "Company"}
                          </strong>

                          <small>
                            {formatDate(post.created_at)}
                          </small>
                        </div>
                      </div>

                      <span className="post-category">
                        {categoryIcons[post.post_type] || "◈"}{" "}
                        {categoryLabels[post.post_type] ||
                          post.post_type}
                      </span>
                    </div>

                    <div className="post-body">
                      <h3>{displayTitle}</h3>
                      {displayContent && <p>{displayContent}</p>}

                      {videoUrl && (
                        <div className="feed-video-box">
                          <video
                            src={videoUrl}
                            controls
                            playsInline
                            preload="metadata"
                            className="feed-video-player"
                          />
                          {videoCaption && (
                            <div className="feed-video-caption-bar">
                              <span>{videoCaption}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {postImages.length > 0 && (
                        <div
                          className={
                            postImages.length === 1
                              ? "post-images-grid single"
                              : "post-images-grid multi"
                          }
                        >
                          {postImages.map((imgUrl, idx) => {
                            const captionText = postImageCaptions[idx] || "";
                            return (
                              <div
                                className="post-image-container"
                                key={`${post.id}-img-${idx}`}
                              >
                                <img
                                  className="post-image"
                                  src={imgUrl}
                                  alt={`${displayTitle} (${idx + 1})`}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(e) => {
                                    console.error(
                                      "Business Feed image failed:",
                                      imgUrl
                                    );

                                    e.currentTarget.style.display =
                                      "none";

                                    const fallback =
                                      e.currentTarget
                                        .nextElementSibling as
                                        | HTMLElement
                                        | null;

                                    if (fallback) {
                                      fallback.style.display =
                                        "block";
                                    }
                                  }}
                                />

                                <div className="image-error">
                                  Image could not be displayed.{" "}
                                  <a
                                    href={imgUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open image
                                  </a>
                                </div>

                                <div className="post-image-bar">
                                  <span className="post-image-caption">
                                    {captionText || `Image ${idx + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    className="post-image-comment-btn"
                                    onClick={() =>
                                      handleFocusImageComment(post.id, idx)
                                    }
                                    title={`Comment on ${captionText || `Image ${idx + 1}`}`}
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

                    <PostEngagementBar
                      postId={post.id}
                      currentUserId={userId || null}
                      onCommentClick={() => handleFocusImageComment(post.id, 0)}
                    />

                    <PostThreadComments
                      supabase={supabase}
                      postId={post.id}
                      currentUserId={userId || null}
                      currentUserName={company?.company_name || null}
                      imageLabels={postImages.map(
                        (_, idx) => postImageCaptions[idx] || `Image ${idx + 1}`
                      )}
                      focusedImageIndex={
                        isFocusedPost ? focusTarget.imageIndex : null
                      }
                      focusTrigger={isFocusedPost ? focusTarget.trigger : 0}
                    />

                    <div className="post-footer">
                      <span>◈ v-nect Business Feed</span>

                      {isOwner && (
                        <div className="post-actions">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => startEditPost(post)}
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
        © {new Date().getFullYear()} v-nect · Connecting Beyond Boundaries
      </footer>

      <style jsx>{`
        .feed-page {
          min-height: 100vh;
          color: #f3f7ff;
          font-family: var(--font-sans), Arial, sans-serif;
          background:
            radial-gradient(
              circle at 78% 14%,
              rgba(78, 108, 255, 0.34),
              transparent 38%
            ),
            radial-gradient(
              circle at 22% 32%,
              rgba(120, 84, 255, 0.24),
              transparent 44%
            ),
            linear-gradient(180deg, #060b24 0%, #091338 55%, #060b24 100%);
        }

        .feed-container {
          max-width: 1200px;
          margin: auto;
          padding: 24px 24px 70px;
        }

        .top-action-strip {
          margin-bottom: 18px;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(13, 22, 54, 0.78);
          border: 1px solid rgba(138, 165, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          box-shadow: 0 8px 20px rgba(3, 8, 24, 0.24);
        }

        .back-home-bar {
          display: inline-flex;
          align-items: center;
        }

        .back-home-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(154, 178, 255, 0.3);
          color: #eef3ff;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.18s ease, border-color 0.18s ease;
        }

        .back-home-button:hover {
          background: rgba(92, 124, 255, 0.2);
          border-color: rgba(168, 196, 255, 0.55);
          color: #ffffff;
        }

        .vchat-toggle-btn {
          border: 1px solid rgba(154, 178, 255, 0.34);
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          padding: 9px 16px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(75, 107, 255, 0.32);
          transition: transform 0.18s ease, box-shadow 0.18s ease,
            filter 0.18s ease;
        }

        .vchat-toggle-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }

        .vchat-toggle-btn.active {
          border-color: rgba(168, 196, 255, 0.65);
          background: rgba(92, 124, 255, 0.24);
          box-shadow: none;
        }

        .vchat-drawer {
          margin-top: 18px;
        }

        .hero {
          position: relative;
          background: linear-gradient(
            125deg,
            rgba(26, 42, 94, 0.96),
            rgba(13, 24, 62, 0.98)
          );
          border: 1px solid rgba(138, 165, 255, 0.28);
          border-radius: 20px;
          padding: 38px 40px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(3, 8, 24, 0.38);
        }

        .hero::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #4b6bff, #7854ff, #9ec0ff);
        }

        .eyebrow {
          color: #79a6ff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .hero h1 {
          font-size: 42px;
          font-weight: 850;
          margin: 10px 0;
          color: #ffffff;
          letter-spacing: -0.8px;
        }

        .hero h1 span {
          color: #8ab4ff;
        }

        .hero p {
          margin: 0;
          color: #b8c7e6;
          font-size: 15px;
          line-height: 1.7;
          max-width: 580px;
        }

        .hero-icon {
          font-size: 88px;
          color: #8ab4ff;
          opacity: 0.45;
          flex-shrink: 0;
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
          background: linear-gradient(
            160deg,
            rgba(22, 35, 78, 0.94),
            rgba(11, 19, 46, 0.98)
          );
          border: 1px solid rgba(138, 165, 255, 0.22);
          border-radius: 18px;
          padding: 21px;
          color: #f3f7ff;
          box-shadow: 0 12px 26px rgba(3, 8, 24, 0.28);
        }

        .video-composer-shell :global(> div) {
          border-radius: 18px;
          border-color: rgba(138, 165, 255, 0.26);
          box-shadow: 0 12px 26px rgba(3, 8, 24, 0.28);
        }

        .video-composer-shell :global(input[type="file"]::file-selector-button) {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          border: 1px solid rgba(176, 200, 255, 0.35);
          border-radius: 8px;
          padding: 7px 13px;
          margin-right: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .panel-heading {
          font-size: 11px;
          font-weight: 800;
          color: #96a8d0;
          letter-spacing: 1.4px;
          margin-bottom: 15px;
        }

        .category {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 11px;
          border: 1px solid transparent;
          background: transparent;
          padding: 11px 12px;
          border-radius: 11px;
          text-align: left;
          color: #c8d7f5;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }

        .category:hover {
          background: rgba(92, 124, 255, 0.14);
          border-color: rgba(138, 165, 255, 0.2);
          color: #ffffff;
        }

        .category.active {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          font-weight: 750;
          box-shadow: 0 6px 18px rgba(75, 107, 255, 0.32);
        }

        .company-identity {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .company-identity img,
        .company-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .company-avatar {
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(75, 107, 255, 0.35), rgba(120, 84, 255, 0.35));
          border: 1px solid rgba(138, 180, 255, 0.4);
          color: #ffffff;
          font-size: 18px;
          font-weight: 800;
        }

        .company-identity strong {
          display: block;
          font-size: 14px;
          font-weight: 750;
          color: #ffffff;
          overflow-wrap: anywhere;
        }

        .company-identity small {
          display: block;
          margin-top: 4px;
          color: #9cb0d9;
          font-size: 12px;
        }

        .create-button,
        .publish-button {
          display: block;
          width: 100%;
          padding: 12px;
          margin-top: 18px;
          border: none;
          border-radius: 11px;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          text-align: center;
          font-size: 13px;
          font-weight: 750;
          text-decoration: none;
          cursor: pointer;
          box-sizing: border-box;
          box-shadow: 0 8px 20px rgba(75, 107, 255, 0.32);
          transition: transform 0.18s ease, filter 0.18s ease;
        }

        .create-button:hover,
        .publish-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
        }

        .manage-link {
          display: inline-flex;
          align-items: center;
          margin-top: 15px;
          color: #8ab4ff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }

        .manage-link:hover {
          color: #c2d8ff;
        }

        .muted {
          color: #a9b9da;
          font-size: 13px;
          line-height: 1.7;
        }

        .timeline {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .video-clips-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 12px;
        }

        .video-clip-card {
          border: 1px solid rgba(138, 165, 255, 0.24);
          border-radius: 14px;
          overflow: hidden;
          background: #08112b;
          color: #eef4fb;
        }

        .video-clip-card video {
          width: 100%;
          height: 140px;
          object-fit: cover;
          display: block;
          background: #050a20;
        }

        .video-fallback-box {
          height: 140px;
          padding: 12px;
          background: linear-gradient(135deg, #10204c, #192f6b);
          color: #eef4fb;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 4px;
        }

        .video-fallback-box span {
          font-size: 22px;
        }

        .video-fallback-box strong {
          font-size: 13px;
          color: #9ec0ff;
        }

        .video-fallback-box small {
          font-size: 11px;
          color: #b8c7e6;
        }

        .video-clip-meta {
          padding: 11px 12px;
        }

        .video-clip-meta strong {
          display: block;
          font-size: 13px;
          color: #ffffff;
          overflow-wrap: anywhere;
        }

        .video-clip-meta small {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #8ab4ff;
        }

        .video-clip-caption-input {
          width: 100%;
          box-sizing: border-box;
          margin-top: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(138, 165, 255, 0.25);
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
          font-size: 12px;
          outline: none;
        }

        .video-clip-caption-input::placeholder {
          color: #96a8d0;
        }

        .video-clip-caption-input:focus {
          border-color: #7854ff;
          background: rgba(255, 255, 255, 0.1);
        }

        .publish-clip-home-btn {
          margin-top: 9px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
        }

        .publish-clip-home-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .feed-video-box {
          margin-top: 14px;
          border-radius: 14px;
          overflow: hidden;
          background: #060b24;
          border: 1px solid rgba(138, 165, 255, 0.22);
        }

        .feed-video-player {
          display: block;
          width: 100%;
          max-height: 420px;
          background: #050a20;
        }

        .feed-video-caption-bar {
          padding: 10px 14px;
          background: #0d1a40;
          color: #e2ecff;
          font-size: 13px;
          line-height: 1.45;
          border-top: 1px solid rgba(138, 165, 255, 0.16);
          overflow-wrap: anywhere;
        }

        .extra-tool-box {
          padding: 12px;
          border-radius: 10px;
          background: rgba(14, 24, 56, 0.85);
          border: 1px solid rgba(138, 165, 255, 0.22);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .extra-tool-box small {
          font-size: 12px;
          color: #b4c6e7;
          line-height: 1.5;
        }

        .poll-options-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .timeline-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 6px 4px;
        }

        .timeline-heading h2,
        .composer h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 7px 0 0;
          color: #ffffff;
        }

        .post-count {
          background: rgba(92, 124, 255, 0.22);
          border: 1px solid rgba(138, 180, 255, 0.34);
          color: #dce7ff;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 750;
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
          border: 1px solid rgba(138, 165, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          cursor: pointer;
        }

        .composer form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .composer label {
          color: #c8d7f5;
          font-size: 13px;
          font-weight: 700;
          margin-top: 8px;
        }

        .composer input,
        .composer select,
        .composer textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(138, 165, 255, 0.24);
          border-radius: 10px;
          padding: 12px;
          background: #081029;
          color: #f3f7ff;
          font: inherit;
          font-size: 14px;
          outline: none;
        }

        .composer input::placeholder,
        .composer textarea::placeholder {
          color: #889bc2;
        }

        .composer input:focus,
        .composer select:focus,
        .composer textarea:focus {
          border-color: #7854ff;
        }

        .composer textarea {
          resize: vertical;
        }

        .upload-area {
          padding: 14px;
          background: rgba(12, 22, 52, 0.78);
          border: 1px dashed rgba(138, 180, 255, 0.42);
          border-radius: 12px;
        }

        .upload-area input {
          border: none;
          background: transparent;
          padding: 5px 0;
          color: #dce7ff;
        }

        .upload-area small {
          display: block;
          color: #9cb0d9;
          font-size: 12px;
          margin-top: 7px;
        }

        .image-preview {
          padding: 13px;
          border: 1px solid rgba(138, 165, 255, 0.2);
          border-radius: 10px;
          background: rgba(8, 16, 41, 0.82);
          min-width: 0;
        }

        .image-preview span {
          display: block;
          color: #9cb0d9;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          margin-bottom: 10px;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
          gap: 10px;
        }

        .preview-card {
          border: 1px solid rgba(138, 165, 255, 0.2);
          border-radius: 9px;
          padding: 8px;
          background: #0d193d;
        }

        .preview-card img {
          display: block;
          width: 100%;
          height: 110px;
          object-fit: cover;
          border-radius: 6px;
          background: #060b24;
        }

        .image-caption-input {
          margin-top: 8px;
          padding: 8px 10px !important;
          font-size: 12px !important;
          border-radius: 7px !important;
        }

        .remove-image-button {
          display: block;
          margin-top: 8px;
          border: none;
          background: transparent;
          color: #fda4af;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .moderation-note {
          margin-top: 10px;
          padding: 13px;
          border: 1px solid rgba(138, 180, 255, 0.28);
          background: rgba(75, 107, 255, 0.14);
          border-radius: 10px;
        }

        .moderation-note strong {
          color: #9ec0ff;
          font-size: 13px;
        }

        .moderation-note p {
          margin: 6px 0 0;
          color: #c8d7f5;
          font-size: 12px;
          line-height: 1.6;
        }

        .publish-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .post-card {
          transition: transform 0.2s ease, border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .post-card:hover {
          transform: translateY(-2px);
          border-color: rgba(158, 186, 255, 0.36);
          box-shadow: 0 16px 32px rgba(3, 8, 24, 0.38);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-bottom: 17px;
          border-bottom: 1px solid rgba(138, 165, 255, 0.14);
        }

        .post-category {
          background: linear-gradient(110deg, rgba(75, 107, 255, 0.26), rgba(120, 84, 255, 0.26));
          border: 1px solid rgba(138, 180, 255, 0.34);
          color: #dce7ff;
          padding: 7px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .post-body {
          padding: 20px 0 10px;
          min-width: 0;
        }

        .post-body h3 {
          font-size: 20px;
          font-weight: 750;
          margin: 0 0 10px;
          color: #ffffff;
          overflow-wrap: anywhere;
        }

        .post-body p {
          margin: 0;
          color: #b8c7e6;
          font-size: 14px;
          line-height: 1.78;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .post-images-grid {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        .post-images-grid.single {
          grid-template-columns: 1fr;
        }

        .post-images-grid.multi {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .post-image-container {
          width: 100%;
          overflow: hidden;
          border-radius: 13px;
          background: #070d24;
          border: 1px solid rgba(138, 165, 255, 0.2);
        }

        .post-image {
          display: block;
          width: 100%;
          height: auto;
          max-height: 450px;
          object-fit: contain;
          object-position: center;
          border-radius: 12px 12px 0 0;
        }

        .post-images-grid.multi .post-image {
          height: 240px;
          max-height: 240px;
          object-fit: cover;
        }

        .post-image-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 13px;
          background: #0d1a40;
          color: #e6eef8;
          border-top: 1px solid rgba(138, 165, 255, 0.16);
        }

        .post-image-caption {
          padding: 0;
          background: transparent;
          border: none;
          color: #e6eef8;
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .post-image-comment-btn {
          border: 1px solid rgba(138, 180, 255, 0.28);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 13px;
          line-height: 1.3;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.18s ease;
        }

        .post-image-comment-btn:hover {
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          border-color: transparent;
        }

        .image-error {
          display: none;
          padding: 30px 15px;
          text-align: center;
          color: #fda4af;
          font-size: 13px;
          line-height: 1.6;
        }

        .image-error a {
          color: #8ab4ff;
          font-weight: 700;
        }

        .post-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
          padding-top: 15px;
          color: #8ea3cc;
          font-size: 12px;
        }

        .post-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .edit-button {
          background: transparent;
          border: none;
          color: #8ab4ff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .delete-button {
          background: transparent;
          border: none;
          color: #fda4af;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-state {
          text-align: center;
          padding: 55px 25px;
        }

        .empty-icon {
          font-size: 38px;
          color: #8ab4ff;
        }

        .empty-state h3 {
          margin: 14px 0 8px;
          font-size: 18px;
          color: #ffffff;
        }

        .empty-state p {
          color: #a9b9da;
          font-size: 13px;
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
          border: 3px solid rgba(138, 180, 255, 0.2);
          border-top-color: #7854ff;
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
          border-radius: 12px;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .alert.error {
          background: rgba(244, 63, 94, 0.16);
          border: 1px solid rgba(244, 63, 94, 0.42);
          color: #fda4af;
        }

        .alert.success {
          background: rgba(92, 124, 255, 0.18);
          border: 1px solid rgba(138, 180, 255, 0.42);
          color: #c7dcff;
        }

        .feed-footer {
          text-align: center;
          padding: 28px 20px;
          background: #050a20;
          color: #96a8d0;
          border-top: 1px solid rgba(138, 165, 255, 0.14);
          font-size: 12px;
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
            font-size: 35px;
          }

          .hero-icon {
            font-size: 65px;
          }
        }

        @media (max-width: 540px) {
          .feed-container {
            padding: 18px 14px 45px;
          }

          .back-home-button {
            padding: 8px 13px;
            font-size: 12px;
          }

          .hero {
            padding: 25px 20px;
            border-radius: 16px;
          }

          .hero h1 {
            font-size: 30px;
          }

          .hero p {
            font-size: 13px;
          }

          .hero-icon {
            font-size: 45px;
          }

          .left-panel,
          .poll-options-row {
            grid-template-columns: 1fr;
          }

          .post-card,
          .composer,
          .panel-card {
            padding: 16px;
          }

          .post-body h3 {
            font-size: 18px;
          }

          .post-images-grid.multi {
            grid-template-columns: 1fr;
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
