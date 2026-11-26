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
}: PostThreadCommentsProps) {
  const [comments, setComments] = useState<BusinessPostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

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

    const resolvedName = currentUserName?.trim() || "Member";

    const { data, error } = await supabase
      .from("business_post_comments")
      .insert({
        post_id: postId,
        author_id: currentUserId,
        author_name: resolvedName,
        content: trimmed,
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

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>Discussion Thread ({comments.length})</span>
        <span>Live updates</span>
      </div>

      <div className="max-h-60 space-y-2.5 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {loading ? (
          <p className="text-xs text-slate-400">Loading thread...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-400">
            No comments yet. Start the conversation below.
          </p>
        ) : (
          comments.map((item) => {
            const isOwner = Boolean(currentUserId && item.author_id === currentUserId);
            return (
              <div
                key={item.id}
                className="flex items-start gap-2.5 rounded-md bg-white px-3 py-2 shadow-2xs ring-1 ring-slate-200/70"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                  {item.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-800">
                      {item.author_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {formatCommentTime(item.created_at)}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(item.id)}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 whitespace-pre-line break-words text-sm text-slate-700">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={listEndRef} />
      </div>

      {errorMsg && (
        <p className="mt-1.5 text-xs text-rose-600">{errorMsg}</p>
      )}

      <form onSubmit={handleSendComment} className="mt-2.5 flex items-end gap-2">
        <textarea
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
          className="min-h-[40px] max-h-28 flex-1 resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={!currentUserId || submitting || !draft.trim()}
          className="h-[40px] shrink-0 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
