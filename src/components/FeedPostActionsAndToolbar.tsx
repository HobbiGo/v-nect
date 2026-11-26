"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export type ComposerToolKey = "image" | "video" | "poll" | "event" | "more";

type PostEngagementBarProps = {
  postId: string;
  currentUserId?: string | null;
  initialLikes?: number;
  commentsCount?: number;
  initialReposts?: number;
  onCommentClick?: () => void;
  onRequireAuth?: () => void;
  onLikeToggle?: (liked: boolean, nextCount: number) => void;
  onRepostToggle?: (reposted: boolean, nextCount: number) => void;
};

export function PostEngagementBar({
  postId,
  currentUserId,
  initialLikes = 0,
  commentsCount = 0,
  initialReposts = 0,
  onCommentClick,
  onRequireAuth,
  onLikeToggle,
  onRepostToggle,
}: PostEngagementBarProps) {
  const supabase = createClient();

  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [reposts, setReposts] = useState(initialReposts);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInteractionCounts() {
      const { data, error } = await supabase
        .from("post_interactions")
        .select("user_id, interaction_type")
        .eq("post_id", postId)
        .in("interaction_type", ["like", "repost"]);

      if (!active || error || !data) return;

      let likeTotal = initialLikes;
      let repostTotal = initialReposts;
      let userLiked = false;
      let userReposted = false;

      const dbLikes = data.filter((r) => r.interaction_type === "like").length;
      const dbReposts = data.filter((r) => r.interaction_type === "repost").length;

      if (dbLikes > 0 || dbReposts > 0) {
        likeTotal = dbLikes;
        repostTotal = dbReposts;
      }

      if (currentUserId) {
        userLiked = data.some(
          (r) => r.interaction_type === "like" && r.user_id === currentUserId
        );
        userReposted = data.some(
          (r) => r.interaction_type === "repost" && r.user_id === currentUserId
        );
      }

      setLikes(likeTotal);
      setReposts(repostTotal);
      setLiked(userLiked);
      setReposted(userReposted);
    }

    loadInteractionCounts();

    return () => {
      active = false;
    };
  }, [supabase, postId, currentUserId, initialLikes, initialReposts]);

  async function toggleInteraction(type: "like" | "repost") {
    if (syncing) return;

    const isLike = type === "like";
    const currentlyActive = isLike ? liked : reposted;
    const nextActive = !currentlyActive;

    const nextLikes = isLike
      ? nextActive
        ? likes + 1
        : Math.max(0, likes - 1)
      : likes;

    const nextReposts = !isLike
      ? nextActive
        ? reposts + 1
        : Math.max(0, reposts - 1)
      : reposts;

    if (isLike) {
      setLiked(nextActive);
      setLikes(nextLikes);
      onLikeToggle?.(nextActive, nextLikes);
    } else {
      setReposted(nextActive);
      setReposts(nextReposts);
      onRepostToggle?.(nextActive, nextReposts);
    }

    if (!currentUserId) {
      onRequireAuth?.();
      return;
    }

    setSyncing(true);
    try {
      if (nextActive) {
        await supabase.from("post_interactions").upsert(
          {
            post_id: postId,
            user_id: currentUserId,
            interaction_type: type,
          },
          { onConflict: "post_id,user_id,interaction_type" }
        );
      } else {
        await supabase
          .from("post_interactions")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId)
          .eq("interaction_type", type);
      }
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="vn-engage-bar" role="group" aria-label="Post interactions">
      <button
        type="button"
        className={liked ? "vn-engage-btn liked" : "vn-engage-btn"}
        onClick={() => toggleInteraction("like")}
      >
        <span>{liked ? "♥" : "♡"}</span>
        <span>{likes}</span>
      </button>

      <button
        type="button"
        className="vn-engage-btn"
        onClick={onCommentClick}
      >
        <span>💬</span>
        <span>{commentsCount}</span>
      </button>

      <button
        type="button"
        className={reposted ? "vn-engage-btn reposted" : "vn-engage-btn"}
        onClick={() => toggleInteraction("repost")}
      >
        <span>🔁</span>
        <span>{reposts}</span>
      </button>

      <style jsx>{`
        .vn-engage-bar {
          font-family: var(--font-sans), Arial, sans-serif;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 10px 4px;
          flex-wrap: wrap;
        }

        .vn-engage-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: none;
          background: transparent;
          color: #6b7d94;
          font-size: 13px;
          font-weight: 700;
          padding: 5px 8px;
          border-radius: 8px;
          cursor: pointer;
        }

        .vn-engage-btn:hover {
          background: rgba(52, 124, 240, 0.08);
          color: #1d3048;
        }

        .vn-engage-btn.liked {
          color: #e11d48;
        }

        .vn-engage-btn.reposted {
          color: #0fa382;
        }
      `}</style>
    </div>
  );
}

type ComposerActionToolbarProps = {
  activeTool?: ComposerToolKey | null;
  onSelectTool: (tool: ComposerToolKey) => void;
  submitLabel?: string;
  submitting?: boolean;
  onSubmitClick?: () => void;
};

export function ComposerActionToolbar({
  activeTool = null,
  onSelectTool,
  submitLabel = "Post",
  submitting = false,
  onSubmitClick,
}: ComposerActionToolbarProps) {
  const tools: { key: ComposerToolKey; icon: string; label: string }[] = [
    { key: "image", icon: "🖼️", label: "Image" },
    { key: "video", icon: "🎬", label: "Video" },
    { key: "poll", icon: "📊", label: "Poll" },
    { key: "event", icon: "📅", label: "Event" },
    { key: "more", icon: "•••", label: "More" },
  ];

  return (
    <div className="vn-composer-bar" role="toolbar" aria-label="Post composer tools">
      <div className="vn-tools-group">
        {tools.map((tool) => (
          <button
            key={tool.key}
            type="button"
            className={activeTool === tool.key ? "vn-tool-item active" : "vn-tool-item"}
            onClick={() => onSelectTool(tool.key)}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {onSubmitClick && (
        <button
          type="button"
          className="vn-post-cta"
          disabled={submitting}
          onClick={onSubmitClick}
        >
          {submitting ? "Posting..." : submitLabel}
        </button>
      )}

      <style jsx>{`
        .vn-composer-bar {
          font-family: var(--font-sans), Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 10px;
        }

        .vn-tools-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vn-tool-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #dfe6ef;
          background: #f8fafd;
          color: #364961;
          font-size: 13px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 9px;
          cursor: pointer;
        }

        .vn-tool-item.active {
          border-color: #13c8b5;
          background: rgba(19, 200, 181, 0.14);
          color: #0e7c70;
        }

        .vn-post-cta {
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          padding: 9px 18px;
          border-radius: 999px;
          cursor: pointer;
        }

        .vn-post-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
