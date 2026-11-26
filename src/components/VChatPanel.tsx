"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase";

type ChatMessage = {
  id: string;
  sender: string;
  role: string;
  time: string;
  text: string;
  attachmentName?: string;
  isMe?: boolean;
};

const CHANNELS = [
  { id: "general", name: "v-nect Business Hub", status: "● Live" },
  { id: "partners", name: "Suppliers & Partners", status: "● Online" },
  { id: "product", name: "Product Launch Room", status: "● Live" },
];

const QUICK_EMOJIS = ["👍", "🚀", "💡", "✅"];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m-1",
    sender: "Sophia Lee",
    role: "Product Lead",
    time: "19:30",
    text: "Selamat datang di v-chat! Masuk lewat akun agar pesan Anda tersimpan dan terdata.",
  },
  {
    id: "m-2",
    sender: "James Carter",
    role: "Growth Partner",
    time: "19:32",
    text: "Gunakan toolbar lampiran, template bisnis, atau emoji di bawah untuk mengirim update cepat.",
  },
];

export function VChatPanel({
  currentUserName,
  onRequireAuth,
}: {
  currentUserName?: string | null;
  onRequireAuth?: () => void;
}) {
  const supabase = createClient();

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [resolvedName, setResolvedName] = useState<string>(
    currentUserName?.trim() || "Guest"
  );
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [isLiveStatus, setIsLiveStatus] = useState(true);
  const [statusNote, setStatusNote] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSessionUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (user) {
        setAuthUserId(user.id);
        const displayName =
          currentUserName?.trim() ||
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          user.email?.split("@")[0] ||
          "Member";
        setResolvedName(displayName);
      } else {
        setAuthUserId(null);
        setResolvedName(currentUserName?.trim() || "Guest");
      }
    }
    loadSessionUser();
    return () => {
      active = false;
    };
  }, [supabase, currentUserName]);

  useEffect(() => {
    let active = true;
    async function loadChannelMessages() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, sender_id, sender_name, sender_role, message_text, attachment_name, created_at")
        .eq("channel", activeChannel)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!active) return;
      if (error || !data || data.length === 0) {
        setMessages(INITIAL_MESSAGES);
        return;
      }

      const mapped: ChatMessage[] = data.map((row) => ({
        id: String(row.id),
        sender: String(row.sender_name || "Member"),
        role: String(row.sender_role || "Member"),
        time: row.created_at
          ? new Date(String(row.created_at)).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Now",
        text: String(row.message_text || ""),
        attachmentName: row.attachment_name ? String(row.attachment_name) : undefined,
        isMe: Boolean(authUserId && row.sender_id === authUserId),
      }));

      setMessages(mapped);
    }

    loadChannelMessages();
    return () => {
      active = false;
    };
  }, [supabase, activeChannel, authUserId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const cleanText = draft.trim();
    if (!cleanText && !attachedFileName) return;

    if (!authUserId) {
      setStatusNote("Silakan masuk lewat akun terlebih dahulu agar chat terdata dengan akun Anda.");
      onRequireAuth?.();
      return;
    }

    setSending(true);
    setStatusNote("");

    const nowTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const roleLabel = isLiveStatus ? "Live Account" : "Account Member";
    const textBody = cleanText || "(Lampiran dikirim)";

    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: resolvedName,
      role: roleLabel,
      time: nowTime,
      text: textBody,
      attachmentName: attachedFileName || undefined,
      isMe: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setDraft("");
    setAttachedFileName("");

    const { error } = await supabase.from("chat_messages").insert({
      channel: activeChannel,
      sender_id: authUserId,
      sender_name: resolvedName,
      sender_role: roleLabel,
      message_text: textBody,
      attachment_name: optimisticMsg.attachmentName || null,
    });

    if (error) {
      setStatusNote(
        "Pesan tampil lokal; buat tabel 'chat_messages' di Supabase untuk menyimpan permanen."
      );
    } else {
      setStatusNote(`Pesan terdata atas akun ${resolvedName}.`);
    }

    setSending(false);
  }

  function appendEmoji(emoji: string) {
    setDraft((prev) => (prev ? `${prev} ${emoji}` : emoji));
  }

  return (
    <section className="vchat-box" aria-label="v-chat module">
      <div className="vchat-top">
        <div>
          <span className="vchat-tag">v-chat MODULE</span>
          <h3>v-chat · Business &amp; Team Messaging</h3>
          <small className="vchat-account-sub">
            Akun aktif: <strong>{resolvedName}</strong>{" "}
            {!authUserId && (
              <button
                type="button"
                className="vchat-inline-auth"
                onClick={() => onRequireAuth?.()}
              >
                (Masuk / Register Akun)
              </button>
            )}
          </small>
        </div>

        <button
          type="button"
          className={isLiveStatus ? "vchat-status-btn live" : "vchat-status-btn"}
          onClick={() => setIsLiveStatus((v) => !v)}
        >
          {isLiveStatus ? "● Status: Live" : "○ Status: Available"}
        </button>
      </div>

      <div className="vchat-channels">
        {CHANNELS.map((ch) => (
          <button
            key={ch.id}
            type="button"
            className={activeChannel === ch.id ? "vchat-ch active" : "vchat-ch"}
            onClick={() => setActiveChannel(ch.id)}
          >
            <span>{ch.name}</span>
            <small>{ch.status}</small>
          </button>
        ))}
      </div>

      {statusNote && <div className="vchat-note">{statusNote}</div>}

      <div className="vchat-feed">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.isMe ? "vchat-msg me" : "vchat-msg"}
          >
            <div className="vchat-msg-meta">
              <strong>{msg.sender}</strong>
              <span>{msg.role}</span>
              <time>{msg.time}</time>
            </div>
            <p>{msg.text}</p>
            {msg.attachmentName && (
              <div className="vchat-attach-chip">📎 {msg.attachmentName}</div>
            )}
          </div>
        ))}
      </div>

      <div className="vchat-toolbar" role="toolbar" aria-label="Chat Feature Toolbar">
        <label className="vchat-tool-btn">
          📎 Lampirkan File/Media
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setAttachedFileName(f.name);
              e.currentTarget.value = "";
            }}
            hidden
          />
        </label>

        <button
          type="button"
          className="vchat-tool-btn"
          onClick={() =>
            setDraft((prev) =>
              prev
                ? prev
                : "Update progres: siap review & diskusi lanjutan."
            )
          }
        >
          📝 Template Bisnis
        </button>

        <div className="vchat-emojis">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              className="vchat-emoji-btn"
              onClick={() => appendEmoji(em)}
            >
              {em}
            </button>
          ))}
        </div>
      </div>

      {attachedFileName && (
        <div className="vchat-pending-file">
          <span>
            File siap dikirim: <strong>{attachedFileName}</strong>
          </span>
          <button type="button" onClick={() => setAttachedFileName("")}>
            Batal ✕
          </button>
        </div>
      )}

      <form className="vchat-form" onSubmit={handleSend}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            authUserId
              ? "Tulis pesan untuk tim atau partner bisnis..."
              : "Masuk lewat akun dulu untuk mengirim & mendata pesan..."
          }
        />
        <button type="submit" disabled={sending}>
          {sending ? "Mengirim..." : "Kirim →"}
        </button>
      </form>

      <style jsx>{`
        .vchat-box {
          font-family: var(--font-sans), Arial, sans-serif;
          background: #0d1e34;
          border: 1px solid rgba(126, 232, 220, 0.16);
          border-radius: 16px;
          padding: 20px;
          color: #eef4fb;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .vchat-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-wrap: wrap;
        }

        .vchat-tag {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: #13c8b5;
        }

        .vchat-top h3 {
          margin: 4px 0 0;
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
        }

        .vchat-account-sub {
          display: block;
          margin-top: 5px;
          font-size: 12px;
          color: #b5c6dc;
        }

        .vchat-inline-auth {
          border: none;
          background: transparent;
          color: #7ee8dc;
          font-size: 12px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          padding: 0 4px;
        }

        .vchat-status-btn {
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.06);
          color: #dce8f6;
          padding: 7px 13px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vchat-status-btn.live {
          border-color: #13c8b5;
          background: rgba(19, 200, 181, 0.18);
          color: #7ee8dc;
        }

        .vchat-channels {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .vchat-ch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #122742;
          color: #d4e1f0;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .vchat-ch.active {
          border-color: #13c8b5;
          background: rgba(19, 200, 181, 0.16);
          color: #ffffff;
        }

        .vchat-ch small {
          font-size: 11px;
          color: #7ee8dc;
        }

        .vchat-note {
          padding: 9px 12px;
          border-radius: 9px;
          background: rgba(19, 200, 181, 0.12);
          border: 1px solid rgba(19, 200, 181, 0.3);
          font-size: 12px;
          color: #a8f6ec;
        }

        .vchat-feed {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 260px;
          overflow-y: auto;
          padding: 12px;
          border-radius: 12px;
          background: #091627;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .vchat-msg {
          background: #122640;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 11px;
          padding: 11px 13px;
          max-width: 88%;
        }

        .vchat-msg.me {
          align-self: flex-end;
          background: linear-gradient(125deg, #153c66, #13576b);
          border-color: rgba(126, 232, 220, 0.3);
        }

        .vchat-msg-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #9cb2cc;
        }

        .vchat-msg-meta strong {
          color: #ffffff;
          font-size: 13px;
        }

        .vchat-msg-meta time {
          margin-left: auto;
          font-size: 11px;
        }

        .vchat-msg p {
          margin: 6px 0 0;
          font-size: 14px;
          line-height: 1.55;
          color: #eef4fb;
        }

        .vchat-attach-chip {
          margin-top: 8px;
          display: inline-block;
          padding: 5px 10px;
          border-radius: 7px;
          background: rgba(0, 0, 0, 0.25);
          font-size: 12px;
          color: #9ff5eb;
        }

        .vchat-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          padding: 9px 12px;
          border-radius: 10px;
          background: #11243e;
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .vchat-tool-btn {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #e2ecf8;
          padding: 7px 11px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .vchat-emojis {
          display: flex;
          gap: 6px;
        }

        .vchat-emoji-btn {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 7px;
          padding: 5px 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .vchat-pending-file {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(52, 124, 240, 0.18);
          font-size: 13px;
          color: #d7e8ff;
        }

        .vchat-pending-file button {
          border: none;
          background: transparent;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .vchat-form {
          display: flex;
          gap: 10px;
        }

        .vchat-form input {
          flex: 1;
          min-width: 0;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: #091627;
          color: #ffffff;
          font: inherit;
          font-size: 14px;
        }

        .vchat-form button {
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          padding: 0 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .vchat-form button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}
