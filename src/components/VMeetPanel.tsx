"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Participant = {
  id: string;
  name: string;
  role: string;
  micOn: boolean;
  camOn: boolean;
  isSelf?: boolean;
};

type MeetMessage = {
  id: string;
  sender: string;
  time: string;
  text: string;
};

type VMeetPanelProps = {
  currentUserName?: string | null;
  onRequireAuth?: () => void;
};

const PRESET_ROOMS = [
  {
    id: "exec-sync",
    title: "Executive Business Sync",
    code: "VN-EXEC-101",
    participantsCount: 4,
  },
  {
    id: "product-review",
    title: "Product & Launch Review",
    code: "VN-PROD-204",
    participantsCount: 6,
  },
  {
    id: "partner-pitch",
    title: "Global Partner Pitch",
    code: "VN-PART-309",
    participantsCount: 3,
  },
];

export function VMeetPanel({
  currentUserName,
  onRequireAuth,
}: VMeetPanelProps) {
  const hostName = currentUserName?.trim() || "Guest Host";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState(PRESET_ROOMS[0].id);
  const [customCode, setCustomCode] = useState(PRESET_ROOMS[0].code);
  const [inCall, setInCall] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [mediaNotice, setMediaNotice] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const [agendaNote, setAgendaNote] = useState(
    "Agenda: Review progres ekosistem v-nect, koordinasi partner, dan jadwal rilis berikutnya."
  );
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<MeetMessage[]>([
    {
      id: "meet-m-1",
      sender: "Sophia Lee",
      time: "21:10",
      text: "Room siap digunakan. Silakan aktifkan mic atau kamera jika ingin bergabung.",
    },
  ]);

  const activeRoom =
    PRESET_ROOMS.find((r) => r.id === selectedRoomId) || PRESET_ROOMS[0];

  const participants: Participant[] = [
    {
      id: "self",
      name: hostName,
      role: inCall ? "Host · In Room" : "Host · Standby",
      micOn,
      camOn,
      isSelf: true,
    },
    {
      id: "p-2",
      name: "Sophia Lee",
      role: "Product Lead",
      micOn: true,
      camOn: true,
    },
    {
      id: "p-3",
      name: "James Carter",
      role: "Partnership Director",
      micOn: false,
      camOn: true,
    },
    {
      id: "p-4",
      name: "Nadia Pratama",
      role: "Operations",
      micOn: true,
      camOn: false,
    },
  ];

  function stopActiveStream() {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    return () => {
      stopActiveStream();
    };
  }, []);

  async function enableCameraStream() {
    setMediaNotice("");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setCamOn(true);
      setMediaNotice(
        "Browser tidak mendukung akses kamera langsung; mode pratinjau virtual aktif."
      );
      return;
    }

    try {
      stopActiveStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: micOn,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamOn(true);
    } catch {
      setCamOn(true);
      setMediaNotice(
        "Kamera tidak terdeteksi atau belum diizinkan; menampilkan kartu kamera host."
      );
    }
  }

  async function handleToggleCamera() {
    if (camOn) {
      stopActiveStream();
      setScreenSharing(false);
      setCamOn(false);
    } else {
      await enableCameraStream();
    }
  }

  async function handleToggleScreenShare() {
    setMediaNotice("");
    if (screenSharing) {
      stopActiveStream();
      setScreenSharing(false);
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getDisplayMedia
    ) {
      setScreenSharing(true);
      setMediaNotice("Mode simulasi presentasi layar aktif.");
      return;
    }

    try {
      stopActiveStream();
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      mediaStreamRef.current = displayStream;
      if (videoRef.current) {
        videoRef.current.srcObject = displayStream;
      }
      setScreenSharing(true);
      setCamOn(true);
    } catch {
      setMediaNotice(
        "Berbagi layar dibatalkan atau tidak didukung perangkat ini."
      );
    }
  }

  async function handleJoinOrLeaveCall() {
    if (inCall) {
      stopActiveStream();
      setCamOn(false);
      setScreenSharing(false);
      setInCall(false);
      setMediaNotice("Anda telah keluar dari room meeting.");
      return;
    }

    setInCall(true);
    setMediaNotice(`Terhubung ke room ${customCode || activeRoom.code}.`);
  }

  function handleSelectPreset(roomId: string) {
    setSelectedRoomId(roomId);
    const found = PRESET_ROOMS.find((r) => r.id === roomId);
    if (found) {
      setCustomCode(found.code);
    }
  }

  function handleCreateCustomRoom() {
    const suffix = Math.floor(100 + Math.random() * 900);
    const generated = `VN-LIVE-${suffix}`;
    setCustomCode(generated);
    setMediaNotice(`Kode room baru dibuat: ${generated}`);
  }

  async function handleCopyRoomCode() {
    const textToCopy = customCode.trim() || activeRoom.code;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      setMediaNotice(`Kode room: ${textToCopy}`);
    }
  }

  function handleSendMeetChat(e: FormEvent) {
    e.preventDefault();
    const clean = chatInput.trim();
    if (!clean) return;

    const nowTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setMessages((prev) => [
      ...prev,
      {
        id: `meet-msg-${Date.now()}`,
        sender: hostName,
        time: nowTime,
        text: clean,
      },
    ]);
    setChatInput("");
  }

  return (
    <section className="vmeet-shell" aria-label="v-meet collaboration module">
      <div className="vmeet-header-bar">
        <div>
          <span className="vmeet-eyebrow">v-meet MODULE</span>
          <h2>Voice, Video Meeting &amp; Live Collaboration</h2>
          <p className="vmeet-sub">
            Host: <strong>{hostName}</strong>{" "}
            {!currentUserName && (
              <button
                type="button"
                className="vmeet-link-btn"
                onClick={() => onRequireAuth?.()}
              >
                (Masuk Akun untuk Identitas Host)
              </button>
            )}
          </p>
        </div>

        <div className="vmeet-room-actions">
          <input
            type="text"
            className="vmeet-code-input"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder="Kode room..."
            aria-label="Meeting room code"
          />
          <button
            type="button"
            className="vmeet-secondary-btn"
            onClick={handleCopyRoomCode}
          >
            {copiedCode ? "✓ Tersalin" : "Salin Kode"}
          </button>
          <button
            type="button"
            className="vmeet-secondary-btn"
            onClick={handleCreateCustomRoom}
          >
            + Room Baru
          </button>
        </div>
      </div>

      <div className="vmeet-presets">
        {PRESET_ROOMS.map((room) => (
          <button
            key={room.id}
            type="button"
            className={
              selectedRoomId === room.id ? "vmeet-preset active" : "vmeet-preset"
            }
            onClick={() => handleSelectPreset(room.id)}
          >
            <div>
              <strong>{room.title}</strong>
              <small>{room.code}</small>
            </div>
            <span>{room.participantsCount} peserta</span>
          </button>
        ))}
      </div>

      {mediaNotice && <div className="vmeet-notice">{mediaNotice}</div>}

      <div className="vmeet-main-grid">
        <div className="vmeet-stage-col">
          <div className="vmeet-stage">
            <div className="vmeet-stage-top">
              <span className={inCall ? "vmeet-live-pill on" : "vmeet-live-pill"}>
                {inCall ? "● LIVE MEETING" : "○ READY TO JOIN"}
              </span>
              <span className="vmeet-room-title">
                {activeRoom.title} · {customCode || activeRoom.code}
              </span>
            </div>

            <div className="vmeet-video-box">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={camOn || screenSharing ? "vmeet-video active" : "vmeet-video"}
              />

              {!camOn && !screenSharing && (
                <div className="vmeet-avatar-stage">
                  <div className="vmeet-big-avatar">
                    {hostName.charAt(0).toUpperCase()}
                  </div>
                  <h3>{hostName}</h3>
                  <p>
                    {inCall
                      ? "Sedang berada di dalam room meeting"
                      : "Klik Join Meeting untuk memulai sesi kolaborasi"}
                  </p>
                </div>
              )}

              {screenSharing && (
                <div className="vmeet-share-badge">
                  🖥️ Sharing Screen Active
                </div>
              )}
            </div>

            <div className="vmeet-controls">
              <button
                type="button"
                className={micOn ? "vmeet-ctrl-btn on" : "vmeet-ctrl-btn off"}
                onClick={() => setMicOn((v) => !v)}
              >
                {micOn ? "🎙️ Mic On" : "🔇 Mic Muted"}
              </button>

              <button
                type="button"
                className={camOn ? "vmeet-ctrl-btn on" : "vmeet-ctrl-btn"}
                onClick={handleToggleCamera}
              >
                {camOn ? "📷 Camera On" : "📷 Camera"}
              </button>

              <button
                type="button"
                className={
                  screenSharing ? "vmeet-ctrl-btn on" : "vmeet-ctrl-btn"
                }
                onClick={handleToggleScreenShare}
              >
                {screenSharing ? "🛑 Stop Share" : "🖥️ Share Screen"}
              </button>

              <button
                type="button"
                className={inCall ? "vmeet-join-btn leave" : "vmeet-join-btn"}
                onClick={handleJoinOrLeaveCall}
              >
                {inCall ? "Leave Room" : "Join Meeting →"}
              </button>
            </div>
          </div>

          <div className="vmeet-agenda-card">
            <label htmlFor="vmeet-agenda-textarea">
              Meeting Agenda &amp; Action Notes
            </label>
            <textarea
              id="vmeet-agenda-textarea"
              rows={3}
              value={agendaNote}
              onChange={(e) => setAgendaNote(e.target.value)}
            />
          </div>
        </div>

        <aside className="vmeet-side-col">
          <div className="vmeet-side-card">
            <div className="vmeet-side-head">
              <h3>Participants ({participants.length})</h3>
            </div>
            <ul className="vmeet-participant-list">
              {participants.map((person) => (
                <li key={person.id} className="vmeet-participant-item">
                  <div>
                    <strong>{person.name}</strong>
                    <small>{person.role}</small>
                  </div>
                  <div className="vmeet-badges">
                    <span>{person.micOn ? "🎙️" : "🔇"}</span>
                    <span>{person.camOn ? "📷" : "—"}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="vmeet-side-card">
            <div className="vmeet-side-head">
              <h3>In-Room Chat</h3>
            </div>
            <div className="vmeet-chat-list">
              {messages.map((m) => (
                <div key={m.id} className="vmeet-chat-msg">
                  <div className="vmeet-chat-meta">
                    <strong>{m.sender}</strong>
                    <time>{m.time}</time>
                  </div>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            <form className="vmeet-chat-form" onSubmit={handleSendMeetChat}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Kirim catatan ke room..."
              />
              <button type="submit">Kirim</button>
            </form>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .vmeet-shell {
          font-family: var(--font-sans), Arial, sans-serif;
          background: linear-gradient(
            160deg,
            rgba(20, 32, 72, 0.92),
            rgba(11, 19, 46, 0.96)
          );
          border: 1px solid rgba(138, 165, 255, 0.2);
          border-radius: 16px;
          padding: 22px;
          color: #f3f7ff;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 10px 24px rgba(3, 8, 24, 0.25);
        }

        .vmeet-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .vmeet-eyebrow {
          display: block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #79a6ff;
        }

        .vmeet-header-bar h2 {
          margin: 4px 0 0;
          font-size: 21px;
          font-weight: 800;
          color: #ffffff;
        }

        .vmeet-sub {
          margin: 6px 0 0;
          font-size: 13px;
          color: #b8c7e6;
        }

        .vmeet-link-btn {
          border: none;
          background: transparent;
          color: #8ab4ff;
          font-size: 12px;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          padding: 0 4px;
        }

        .vmeet-room-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vmeet-code-input {
          padding: 9px 12px;
          border-radius: 9px;
          border: 1px solid rgba(138, 165, 255, 0.24);
          background: #081029;
          color: #f3f7ff;
          font: inherit;
          font-size: 13px;
          width: 145px;
          outline: none;
        }

        .vmeet-code-input:focus {
          border-color: #7854ff;
        }

        .vmeet-secondary-btn {
          padding: 9px 13px;
          border-radius: 9px;
          border: 1px solid rgba(138, 165, 255, 0.3);
          background: rgba(92, 124, 255, 0.16);
          color: #dce7ff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .vmeet-secondary-btn:hover {
          border-color: rgba(138, 180, 255, 0.52);
          color: #ffffff;
        }

        .vmeet-presets {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .vmeet-preset {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          text-align: left;
          padding: 12px 14px;
          border-radius: 11px;
          border: 1px solid rgba(138, 165, 255, 0.16);
          background: rgba(8, 16, 41, 0.82);
          color: #c8d7f5;
          cursor: pointer;
        }

        .vmeet-preset.active {
          border-color: rgba(138, 180, 255, 0.48);
          background: linear-gradient(
            110deg,
            rgba(75, 107, 255, 0.32),
            rgba(120, 84, 255, 0.32)
          );
        }

        .vmeet-preset strong {
          display: block;
          font-size: 13px;
          color: #ffffff;
        }

        .vmeet-preset small {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          color: #9cb0d9;
        }

        .vmeet-preset span {
          font-size: 11px;
          font-weight: 700;
          color: #9ec0ff;
          white-space: nowrap;
        }

        .vmeet-notice {
          padding: 9px 13px;
          border-radius: 9px;
          background: rgba(92, 124, 255, 0.16);
          border: 1px solid rgba(138, 180, 255, 0.34);
          color: #dce7ff;
          font-size: 12px;
        }

        .vmeet-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(270px, 1fr);
          gap: 16px;
          align-items: start;
        }

        .vmeet-stage-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vmeet-stage {
          background: #081029;
          border: 1px solid rgba(138, 165, 255, 0.18);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vmeet-stage-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .vmeet-live-pill {
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          background: rgba(255, 255, 255, 0.06);
          color: #b8c7e6;
        }

        .vmeet-live-pill.on {
          background: rgba(92, 124, 255, 0.24);
          border: 1px solid rgba(138, 180, 255, 0.45);
          color: #ffffff;
        }

        .vmeet-room-title {
          font-size: 12px;
          color: #9cb0d9;
          font-weight: 600;
        }

        .vmeet-video-box {
          position: relative;
          min-height: 250px;
          border-radius: 12px;
          background: #060b24;
          border: 1px solid rgba(138, 165, 255, 0.14);
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .vmeet-video {
          display: none;
          width: 100%;
          max-height: 320px;
          object-fit: cover;
        }

        .vmeet-video.active {
          display: block;
        }

        .vmeet-avatar-stage {
          text-align: center;
          padding: 24px 16px;
        }

        .vmeet-big-avatar {
          width: 66px;
          height: 66px;
          border-radius: 999px;
          margin: 0 auto 10px;
          display: grid;
          place-items: center;
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
        }

        .vmeet-avatar-stage h3 {
          margin: 0;
          font-size: 17px;
          color: #ffffff;
        }

        .vmeet-avatar-stage p {
          margin: 5px 0 0;
          font-size: 13px;
          color: #9cb0d9;
        }

        .vmeet-share-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 5px 10px;
          border-radius: 8px;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
        }

        .vmeet-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vmeet-ctrl-btn {
          border: 1px solid rgba(138, 165, 255, 0.22);
          background: rgba(20, 32, 72, 0.85);
          color: #dce7ff;
          padding: 9px 13px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vmeet-ctrl-btn.on {
          border-color: rgba(138, 180, 255, 0.5);
          background: rgba(92, 124, 255, 0.24);
          color: #ffffff;
        }

        .vmeet-ctrl-btn.off {
          border-color: rgba(244, 63, 94, 0.45);
          background: rgba(244, 63, 94, 0.16);
          color: #ffc2cd;
        }

        .vmeet-join-btn {
          margin-left: auto;
          border: none;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          padding: 9px 16px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vmeet-join-btn.leave {
          background: #d9485f;
        }

        .vmeet-agenda-card {
          background: #081029;
          border: 1px solid rgba(138, 165, 255, 0.16);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .vmeet-agenda-card label {
          font-size: 12px;
          font-weight: 700;
          color: #9cb0d9;
        }

        .vmeet-agenda-card textarea {
          width: 100%;
          box-sizing: border-box;
          border-radius: 8px;
          border: 1px solid rgba(138, 165, 255, 0.2);
          background: rgba(20, 32, 72, 0.72);
          color: #f3f7ff;
          padding: 9px 11px;
          font: inherit;
          font-size: 13px;
          resize: vertical;
          outline: none;
        }

        .vmeet-agenda-card textarea:focus {
          border-color: #7854ff;
        }

        .vmeet-side-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vmeet-side-card {
          background: #081029;
          border: 1px solid rgba(138, 165, 255, 0.16);
          border-radius: 12px;
          padding: 13px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .vmeet-side-head h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 750;
          color: #ffffff;
        }

        .vmeet-participant-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vmeet-participant-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          border-radius: 9px;
          background: rgba(20, 32, 72, 0.78);
          border: 1px solid rgba(138, 165, 255, 0.12);
        }

        .vmeet-participant-item strong {
          display: block;
          font-size: 13px;
          color: #ffffff;
        }

        .vmeet-participant-item small {
          display: block;
          font-size: 11px;
          color: #9cb0d9;
        }

        .vmeet-badges {
          display: flex;
          gap: 6px;
          font-size: 12px;
        }

        .vmeet-chat-list {
          max-height: 150px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vmeet-chat-msg {
          padding: 8px 10px;
          border-radius: 8px;
          background: rgba(20, 32, 72, 0.78);
          border: 1px solid rgba(138, 165, 255, 0.12);
        }

        .vmeet-chat-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9cb0d9;
        }

        .vmeet-chat-meta strong {
          color: #9ec0ff;
        }

        .vmeet-chat-msg p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #f3f7ff;
          line-height: 1.45;
        }

        .vmeet-chat-form {
          display: flex;
          gap: 6px;
        }

        .vmeet-chat-form input {
          flex: 1;
          min-width: 0;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid rgba(138, 165, 255, 0.22);
          background: rgba(20, 32, 72, 0.72);
          color: #f3f7ff;
          font: inherit;
          font-size: 12px;
          outline: none;
        }

        .vmeet-chat-form input:focus {
          border-color: #7854ff;
        }

        .vmeet-chat-form button {
          border: none;
          border-radius: 8px;
          background: linear-gradient(110deg, #4b6bff, #7854ff);
          color: #ffffff;
          padding: 0 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        @media (max-width: 820px) {
          .vmeet-presets,
          .vmeet-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
