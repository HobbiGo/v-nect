"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BusinessPostComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

type PostThreadCommentsProps = {
  supabase: SupabaseClient;
  postId: string;
  currentUserId?: string | null;
  currentUserName?: string | null;
  imageLabels?: string[];
};

function formatCommentTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function PostThreadComments({
  supabase,
  postId,
  currentUserId,
  currentUserName,
  imageLabels = [],
}: PostThreadCommentsProps) {
  const [comments, setComments] = useState<BusinessPostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState<string>("");
  const [onlyMyHistory, setOnlyMyHistory] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadComments() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("business_post_comments")
        .select("id, post_id, author_id, author_name, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        console.error("Load comments error:", error);
        setErrorMsg("Failed to load discussion.");
      } else {
        setComments(data ?? []);
      }
      setLoading(false);
    }

    loadComments();

    const channel = supabase
      .channel(`business-post-comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "business_post_comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const incoming = payload.new as BusinessPostComment;
          setComments((prev) => {
            if (prev.some((item) => item.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "business_post_comments",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedId = String((payload.old as { id?: string })?.id || "");
          if (!deletedId) return;
          setComments((prev) => prev.filter((item) => item.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, postId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [comments.length]);

  async function handleSendComment(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || submitting) return;

    if (!currentUserId) {
      setErrorMsg("Please sign in to join the discussion.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    let resolvedName = currentUserName?.trim() || "";
    if (!resolvedName) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      resolvedName =
        (user?.user_metadata?.full_name as string | undefined)?.trim() ||
        user?.email?.split("@")[0] ||
        "Member";
    }

    const prefix =
      selectedImageIdx !== ""
        ? `[${imageLabels[Number(selectedImageIdx)] || `Image ${Number(selectedImageIdx) + 1}`}] `
        : "";
    const finalContent = `${prefix}${trimmed}`.slice(0, 2000);

    const { data, error } = await supabase
      .from("business_post_comments")
      .insert({
        post_id: postId,
        author_id: currentUserId,
        author_name: resolvedName,
        content: finalContent,
      })
      .select("id, post_id, author_id, author_name, content, created_at")
      .single();

    setSubmitting(false);

    if (error) {
      console.error("Send comment error:", error);
      setErrorMsg("Could not send comment. Please try again.");
      return;
    }

    setDraft("");
    if (data) {
      setComments((prev) => {
        if (prev.some((item) => item.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!currentUserId) return;
    const { error } = await supabase
      .from("business_post_comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", currentUserId);

    if (error) {
      console.error("Delete comment error:", error);
      return;
    }

    setComments((prev) => prev.filter((item) => item.id !== commentId));
  }

  const visibleComments =
    onlyMyHistory && currentUserId
      ? comments.filter((c) => c.author_id === currentUserId)
      : comments;

  const myCommentCount = currentUserId
    ? comments.filter((c) => c.author_id === currentUserId).length
    : 0;

  return (
    <div className="thread-box">
      <div className="thread-action-bar">
        <button
          type="button"
          className="thread-icon-btn"
          onClick={() => inputRef.current?.focus()}
        >
          <span>💬</span>
          <span>Comment ({comments.length})</span>
        </button>

        {currentUserId && (
          <button
            type="button"
            className={
              onlyMyHistory ? "thread-filter-btn active" : "thread-filter-btn"
            }
            onClick={() => setOnlyMyHistory((prev) => !prev)}
          >
            <span>🕘</span>
            <span>
              {onlyMyHistory
                ? `My History (${myCommentCount}) · Show All`
                : `My History (${myCommentCount})`}
            </span>
          </button>
        )}

        <span className="thread-live-badge">Live updates</span>
      </div>

      <div className="thread-list">
        {loading ? (
          <p className="thread-empty">Loading thread...</p>
        ) : visibleComments.length === 0 ? (
          <p className="thread-empty">
            {onlyMyHistory
              ? "You have no comment history on this post yet."
              : "No comments yet. Start the conversation below."}
          </p>
        ) : (
          visibleComments.map((item) => {
            const isOwner = Boolean(currentUserId && item.author_id === currentUserId);
            return (
              <div className="thread-item" key={item.id}>
                <div className="thread-avatar">
                  {item.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="thread-content">
                  <div className="thread-item-top">
                    <div className="thread-author-wrap">
                      <strong>{item.author_name}</strong>
                      {isOwner && (
                        <span className="thread-you-tag">Active Account</span>
                      )}
                    </div>
                    <div className="thread-item-right">
                      <span>{formatCommentTime(item.created_at)}</span>
                      {isOwner && (
                        <button
                          type="button"
                          className="thread-delete"
                          onClick={() => handleDeleteComment(item.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p>{item.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      {errorMsg && <p className="thread-error">{errorMsg}</p>}

      {imageLabels.length > 0 && (
        <div className="thread-image-tag">
          <label htmlFor={`img-tag-${postId}`}>Tag image (optional):</label>
          <select
            id={`img-tag-${postId}`}
            value={selectedImageIdx}
            onChange={(e) => setSelectedImageIdx(e.target.value)}
            disabled={!currentUserId || submitting}
          >
            <option value="">General post discussion</option>
            {imageLabels.map((lbl, idx) => (
              <option key={idx} value={String(idx)}>
                {lbl || `Image ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <form onSubmit={handleSendComment} className="thread-form">
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendComment();
            }
          }}
          placeholder={
            currentUserId
              ? "Write a comment in this thread..."
              : "Sign in to write a comment..."
          }
          disabled={!currentUserId || submitting}
        />
        <button
          type="submit"
          disabled={!currentUserId || submitting || !draft.trim()}
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>

      <style jsx>{`
        .thread-box {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #edf0f5;
        }

        .thread-action-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
          padding: 7px 10px;
          background: #10243d;
          border-radius: 9px;
        }

        .thread-icon-btn,
        .thread-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #e6eef8;
          border-radius: 7px;
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .thread-icon-btn:hover,
        .thread-filter-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .thread-filter-btn.active {
          background: #13bcae;
          border-color: #13bcae;
          color: #ffffff;
        }

        .thread-live-badge {
          margin-left: auto;
          font-size: 10px;
          font-weight: 700;
          color: #7ee8dc;
        }

        .thread-list {
          max-height: 240px;
          overflow-y: auto;
          background: #f8fafd;
          border: 1px solid #e6ecf5;
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .thread-empty {
          margin: 0;
          font-size: 12px;
          color: #8b9bb0;
        }

        .thread-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #ffffff;
          border: 1px solid #e7edf5;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .thread-avatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: #102b4d;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .thread-content {
          min-width: 0;
          flex: 1;
        }

        .thread-item-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .thread-author-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .thread-item-top strong {
          font-size: 12px;
          color: #1d3048;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .thread-you-tag {
          background: #e6f7f5;
          color: #0e8a7d;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .thread-item-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .thread-item-right span {
          font-size: 10px;
          color: #96a4b5;
        }

        .thread-delete {
          border: none;
          background: transparent;
          color: #d95353;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .thread-content p {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.55;
          color: #2d4159;
          white-space: pre-line;
          overflow-wrap: anywhere;
        }

        .thread-error {
          margin: 8px 0 0;
          font-size: 11px;
          color: #bd3d3d;
        }

        .thread-image-tag {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 11px;
          color: #53657b;
        }

        .thread-image-tag select {
          border: 1px solid #dfe6ef;
          border-radius: 7px;
          padding: 6px 10px;
          background: #fbfcfe;
          color: #24364d;
          font-size: 11px;
          outline: none;
        }

        .thread-form {
          margin-top: 8px;
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .thread-form textarea {
          flex: 1;
          min-height: 40px;
          max-height: 110px;
          border: 1px solid #dfe6ef;
          border-radius: 8px;
          padding: 10px 12px;
          background: #fbfcfe;
          color: #24364d;
          font: inherit;
          font-size: 12px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        }

        .thread-form textarea:focus {
          border-color: #347cf0;
        }

        .thread-form button {
          height: 40px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          flex-shrink: 0;
        }

        .thread-form button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
