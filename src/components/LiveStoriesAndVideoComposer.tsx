"use client";

import { useEffect, useState } from "react";

export type LiveStoryItem = {
  id: string;
  author: string;
  handle: string;
  avatarText: string;
  isLive: boolean;
  caption: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  durationSec?: number;
};

export type QueuedVideoItem = {
  id: string;
  file: File;
  previewUrl: string;
  originalDuration: number;
  startSec: number;
  endSec: number;
  trimmed: boolean;
  caption: string;
};

type LiveStoriesAndVideoComposerProps = {
  currentAuthorName?: string;
  onPublishVideos?: (items: QueuedVideoItem[], maxDurationSec: number) => void;
};

const INITIAL_STORIES: LiveStoryItem[] = [
  {
    id: "story-live-1",
    author: "Sophia Lee",
    handle: "@sophialee",
    avatarText: "SL",
    isLive: true,
    caption: "Live product showcase & Q&A session",
    mediaType: "image",
    mediaUrl: "/images/logonew-v-nect.png",
  },
  {
    id: "story-2",
    author: "James Carter",
    handle: "@jamescarter",
    avatarText: "JC",
    isLive: true,
    caption: "Weekly ecosystem update from studio",
    mediaType: "image",
    mediaUrl: "/images/V-NECT-logo.png",
  },
  {
    id: "story-3",
    author: "Olivia Bennett",
    handle: "@oliviabennett",
    avatarText: "OB",
    isLive: false,
    caption: "Design sprint highlights",
    mediaType: "image",
    mediaUrl: "/images/logonew-v-nect.png",
  },
  {
    id: "story-4",
    author: "Daniel Kim",
    handle: "@danielkim",
    avatarText: "DK",
    isLive: true,
    caption: "Live partner pitch & demo",
    mediaType: "image",
    mediaUrl: "/images/V-NECT-logo.png",
  },
  {
    id: "story-5",
    author: "Mia Rodriguez",
    handle: "@miarodriguez",
    avatarText: "MR",
    isLive: false,
    caption: "Community growth recap",
    mediaType: "image",
    mediaUrl: "/images/logonew-v-nect.png",
  },
  {
    id: "story-6",
    author: "Noah Smith",
    handle: "@noahsmith",
    avatarText: "NS",
    isLive: false,
    caption: "New marketplace suppliers onboarded",
    mediaType: "image",
    mediaUrl: "/images/V-NECT-logo.png",
  },
];

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal membaca durasi video."));
    };
    video.src = url;
  });
}

export function LiveStoriesAndVideoComposer({
  currentAuthorName = "You",
  onPublishVideos,
}: LiveStoriesAndVideoComposerProps) {
  const [stories, setStories] = useState<LiveStoryItem[]>(INITIAL_STORIES);
  const [activeStory, setActiveStory] = useState<LiveStoryItem | null>(null);
  const [onlyLiveStories, setOnlyLiveStories] = useState(false);

  const [maxDurationSec, setMaxDurationSec] = useState<30 | 60>(60);
  const [videoQueue, setVideoQueue] = useState<QueuedVideoItem[]>([]);
  const [notice, setNotice] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    return () => {
      for (const item of videoQueue) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [videoQueue]);

  function handleAddQuickStory() {
    const newStory: LiveStoryItem = {
      id: `story-${Date.now()}`,
      author: currentAuthorName,
      handle: "@live_member",
      avatarText: currentAuthorName.slice(0, 2).toUpperCase() || "VN",
      isLive: true,
      caption: `${currentAuthorName} is live now on v-nect`,
      mediaType: "image",
      mediaUrl: "/images/logonew-v-nect.png",
    };
    setStories((prev) => [newStory, ...prev]);
    setNotice(`Story Live "${currentAuthorName}" ditambahkan.`);
    setErrorMsg("");
  }

  async function handleVideoFilesSelected(fileList: FileList | null) {
    setNotice("");
    setErrorMsg("");

    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const added: QueuedVideoItem[] = [];
    let autoCutCount = 0;

    for (const file of files) {
      const isVideo =
        file.type.startsWith("video/") ||
        /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);

      if (!isVideo) {
        setErrorMsg(`File "${file.name}" bukan format video yang didukung.`);
        continue;
      }

      try {
        const duration = await readVideoDuration(file);
        const safeDuration = duration > 0 ? duration : maxDurationSec;
        const needsCut = safeDuration > maxDurationSec;
        const endSec = needsCut
          ? maxDurationSec
          : Math.max(1, Math.round(safeDuration));

        if (needsCut) {
          autoCutCount += 1;
        }

        added.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          originalDuration: Math.round(safeDuration),
          startSec: 0,
          endSec,
          trimmed: needsCut,
          caption: "",
        });
      } catch {
        setErrorMsg(`Tidak dapat memuat metadata durasi untuk "${file.name}".`);
      }
    }

    if (added.length > 0) {
      setVideoQueue((prev) => [...prev, ...added]);
      if (autoCutCount > 0) {
        setNotice(
          `${added.length} video masuk antrean. ${autoCutCount} video melebihi batas ${maxDurationSec}s dan otomatis dipotong ke ${maxDurationSec}s (bisa diatur manual).`
        );
      } else {
        setNotice(`${added.length} video siap diatur & diunggah (batas max ${maxDurationSec}s).`);
      }
    }
  }

  function handleMaxDurationChange(nextMax: 30 | 60) {
    setMaxDurationSec(nextMax);
    let adjusted = 0;

    setVideoQueue((prev) =>
      prev.map((item) => {
        const nextEnd = Math.min(item.endSec, nextMax);
        const nextStart = Math.min(item.startSec, Math.max(0, nextEnd - 1));
        const isTrimmed = item.originalDuration > nextMax || nextStart > 0 || nextEnd < item.originalDuration;
        if (nextEnd !== item.endSec) adjusted += 1;
        return {
          ...item,
          startSec: nextStart,
          endSec: Math.max(1, nextEnd),
          trimmed: isTrimmed,
        };
      })
    );

    if (adjusted > 0) {
      setNotice(`Batas durasi diubah ke ${nextMax}s dan ${adjusted} video otomatis disesuaikan.`);
    }
  }

  function updateVideoRange(id: string, nextStart: number, nextEnd: number) {
    setVideoQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const clampedStart = Math.max(0, Math.min(nextStart, item.originalDuration - 1));
        const maxAllowedEnd = Math.min(item.originalDuration, clampedStart + maxDurationSec);
        const clampedEnd = Math.max(clampedStart + 1, Math.min(nextEnd, maxAllowedEnd));
        const isTrimmed =
          clampedStart > 0 || clampedEnd < item.originalDuration || item.originalDuration > maxDurationSec;

        return {
          ...item,
          startSec: clampedStart,
          endSec: clampedEnd,
          trimmed: isTrimmed,
        };
      })
    );
  }

  function updateQueuedCaption(id: string, nextCaption: string) {
    setVideoQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, caption: nextCaption.slice(0, 240) }
          : item
      )
    );
  }

  function removeQueuedVideo(id: string) {
    setVideoQueue((prev) => {
      const target = prev.find((v) => v.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((v) => v.id !== id);
    });
  }

  function handlePublishBatch() {
    if (videoQueue.length === 0) {
      setErrorMsg("Pilih minimal satu video terlebih dahulu.");
      return;
    }
    setErrorMsg("");
    onPublishVideos?.(videoQueue, maxDurationSec);
    setNotice(
      `${videoQueue.length} video (durasi max ${maxDurationSec}s per klip) diproses ke daftar unggahan.`
    );
    setVideoQueue([]);
  }

  const displayedStories = onlyLiveStories
    ? stories.filter((s) => s.isLive)
    : stories;

  return (
    <div className="vn-social-panel">
      {/* STORIES LIVE SECTION */}
      <div className="vn-stories-card">
        <div className="vn-stories-header">
          <div>
            <span className="vn-tag">STORIES &amp; LIVE</span>
            <h3>Stories yang Sedang Live</h3>
          </div>

          <div className="vn-stories-actions">
            <button
              type="button"
              className={onlyLiveStories ? "vn-chip active" : "vn-chip"}
              onClick={() => setOnlyLiveStories((v) => !v)}
            >
              ● Live Only ({stories.filter((s) => s.isLive).length})
            </button>
            <button
              type="button"
              className="vn-btn-primary"
              onClick={handleAddQuickStory}
            >
              + Go Live / Add Story
            </button>
          </div>
        </div>

        <div className="vn-stories-strip" role="list" aria-label="Live Stories">
          {displayedStories.map((story) => (
            <button
              key={story.id}
              type="button"
              className={story.isLive ? "vn-story-item is-live" : "vn-story-item"}
              onClick={() => setActiveStory(story)}
            >
              <span className="vn-story-ring">
                <span className="vn-story-avatar">{story.avatarText}</span>
                {story.isLive && <span className="vn-live-badge">LIVE</span>}
              </span>
              <span className="vn-story-name">{story.author}</span>
            </button>
          ))}
        </div>

        {activeStory && (
          <div className="vn-story-viewer">
            <div className="vn-story-viewer-top">
              <div>
                <strong>{activeStory.author}</strong>{" "}
                <span>{activeStory.handle}</span>
                {activeStory.isLive && (
                  <span className="vn-live-pill">● LIVE NOW</span>
                )}
              </div>
              <button
                type="button"
                className="vn-close-btn"
                onClick={() => setActiveStory(null)}
              >
                Tutup ✕
              </button>
            </div>
            <p className="vn-story-caption">{activeStory.caption}</p>
            <img
              src={activeStory.mediaUrl}
              alt={activeStory.author}
              className="vn-story-preview-img"
            />
          </div>
        )}
      </div>

      {/* MULTI-UPLOAD VIDEO & AUTO-TRIM 30-60s */}
      <div className="vn-video-card">
        <div className="vn-video-header">
          <div>
            <span className="vn-tag">VIDEO UPLOAD · MULTI-BATCH</span>
            <h3>Upload Video (Batas &amp; Potong Durasi 30–60 Detik)</h3>
            <p>
              Bisa upload berkali-kali atau pilih banyak video sekaligus. Video yang lebih panjang dari batas otomatis dipotong ke rentang durasi maksimal.
            </p>
          </div>

          <div className="vn-duration-switch" role="group" aria-label="Batas Durasi Video">
            <button
              type="button"
              className={maxDurationSec === 30 ? "vn-dur-btn active" : "vn-dur-btn"}
              onClick={() => handleMaxDurationChange(30)}
            >
              Max 30s
            </button>
            <button
              type="button"
              className={maxDurationSec === 60 ? "vn-dur-btn active" : "vn-dur-btn"}
              onClick={() => handleMaxDurationChange(60)}
            >
              Max 60s
            </button>
          </div>
        </div>

        <label className="vn-upload-dropzone">
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(e) => {
              handleVideoFilesSelected(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          <span className="vn-dropzone-title">
            + Pilih Satu atau Banyak Video (Bisa Upload Berkali-Kali)
          </span>
          <span className="vn-dropzone-sub">
            Aturan aktif: Durasi maksimal {maxDurationSec} detik · Potong otomatis jika melebihi {maxDurationSec} detik
          </span>
        </label>

        {errorMsg && <div className="vn-alert error">{errorMsg}</div>}
        {notice && <div className="vn-alert info">{notice}</div>}

        {videoQueue.length > 0 && (
          <div className="vn-queue-list">
            {videoQueue.map((item) => {
              const clipLength = item.endSec - item.startSec;
              return (
                <div className="vn-queue-item" key={item.id}>
                  <video
                    src={item.previewUrl}
                    controls
                    className="vn-video-player"
                  />

                  <div className="vn-queue-meta">
                    <div className="vn-queue-title-row">
                      <strong>{item.file.name}</strong>
                      <span className={item.trimmed ? "vn-trim-badge cut" : "vn-trim-badge ok"}>
                        {item.trimmed
                          ? `Terpotong: ${item.startSec}s – ${item.endSec}s (${clipLength}s / asli ${item.originalDuration}s)`
                          : `Durasi OK: ${clipLength}s (max ${maxDurationSec}s)`}
                      </span>
                    </div>

                    <div className="vn-queue-caption-row">
                      <input
                        type="text"
                        className="vn-queue-caption-input"
                        value={item.caption}
                        onChange={(e) =>
                          updateQueuedCaption(item.id, e.target.value)
                        }
                        placeholder="Tulis teks / caption video sebelum diunggah..."
                        maxLength={240}
                      />
                    </div>

                    <div className="vn-trim-controls">
                      <label>
                        Mulai (detik):
                        <input
                          type="number"
                          min={0}
                          max={Math.max(0, item.endSec - 1)}
                          value={item.startSec}
                          onChange={(e) =>
                            updateVideoRange(item.id, Number(e.target.value), item.endSec)
                          }
                        />
                      </label>

                      <label>
                        Selesai (detik):
                        <input
                          type="number"
                          min={item.startSec + 1}
                          max={Math.min(item.originalDuration, item.startSec + maxDurationSec)}
                          value={item.endSec}
                          onChange={(e) =>
                            updateVideoRange(item.id, item.startSec, Number(e.target.value))
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="vn-mini-btn"
                        onClick={() =>
                          updateVideoRange(
                            item.id,
                            0,
                            Math.min(item.originalDuration, maxDurationSec)
                          )
                        }
                      >
                        Auto-Cut {maxDurationSec}s
                      </button>

                      <button
                        type="button"
                        className="vn-remove-btn"
                        onClick={() => removeQueuedVideo(item.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              className="vn-btn-primary vn-publish-batch"
              onClick={handlePublishBatch}
            >
              Simpan / Kirim {videoQueue.length} Video (Max {maxDurationSec}s) →
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .vn-social-panel {
          font-family: var(--font-sans), Arial, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 18px;
          color: #eef4fb;
        }

        .vn-stories-card,
        .vn-video-card {
          background: #0d1e34;
          border: 1px solid rgba(126, 232, 220, 0.16);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 8px 24px rgba(4, 12, 24, 0.28);
        }

        .vn-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          color: #13c8b5;
          margin-bottom: 4px;
        }

        .vn-stories-header,
        .vn-video-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .vn-stories-header h3,
        .vn-video-header h3 {
          margin: 0;
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
        }

        .vn-video-header p {
          margin: 6px 0 0;
          font-size: 13px;
          color: #b5c6dc;
          line-height: 1.6;
          max-width: 620px;
        }

        .vn-stories-actions,
        .vn-duration-switch {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vn-chip,
        .vn-dur-btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #d7e3f2;
          padding: 8px 13px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-chip.active,
        .vn-dur-btn.active {
          background: rgba(19, 200, 181, 0.2);
          border-color: #13c8b5;
          color: #7ee8dc;
        }

        .vn-btn-primary {
          border: none;
          background: linear-gradient(110deg, #347cf0, #13bcae);
          color: #ffffff;
          padding: 9px 15px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-stories-strip {
          margin-top: 16px;
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .vn-story-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          background: transparent;
          border: none;
          color: #e4edf8;
          cursor: pointer;
          flex-shrink: 0;
          min-width: 78px;
        }

        .vn-story-ring {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          padding: 2px;
          background: rgba(255, 255, 255, 0.2);
          display: grid;
          place-items: center;
        }

        .vn-story-item.is-live .vn-story-ring {
          background: linear-gradient(135deg, #13c8b5, #347cf0);
          box-shadow: 0 0 14px rgba(19, 200, 181, 0.35);
        }

        .vn-story-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #132946;
          color: #ffffff;
          font-size: 15px;
          font-weight: 800;
          display: grid;
          place-items: center;
        }

        .vn-live-badge {
          position: absolute;
          bottom: -4px;
          background: #e53955;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 999px;
          letter-spacing: 0.6px;
        }

        .vn-story-name {
          font-size: 12px;
          font-weight: 600;
          max-width: 84px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vn-story-viewer {
          margin-top: 14px;
          background: #112540;
          border: 1px solid rgba(126, 232, 220, 0.24);
          border-radius: 12px;
          padding: 14px;
        }

        .vn-story-viewer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .vn-story-viewer-top span {
          font-size: 13px;
          color: #9cb2cc;
        }

        .vn-live-pill {
          margin-left: 8px;
          color: #ff7b90 !important;
          font-weight: 700;
        }

        .vn-close-btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          padding: 5px 10px;
          border-radius: 7px;
          font-size: 12px;
          cursor: pointer;
        }

        .vn-story-caption {
          margin: 8px 0 10px;
          font-size: 14px;
          color: #dce8f6;
        }

        .vn-story-preview-img {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          border-radius: 8px;
          background: #081322;
        }

        .vn-upload-dropzone {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 16px;
          border-radius: 12px;
          border: 1.5px dashed rgba(126, 232, 220, 0.45);
          background: rgba(19, 200, 181, 0.06);
          cursor: pointer;
        }

        .vn-upload-dropzone input {
          font-size: 13px;
          color: #dce8f6;
        }

        .vn-dropzone-title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .vn-dropzone-sub {
          font-size: 12px;
          color: #9fb4ce;
        }

        .vn-alert {
          margin-top: 12px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.5;
        }

        .vn-alert.error {
          background: rgba(229, 57, 85, 0.16);
          border: 1px solid rgba(255, 123, 144, 0.4);
          color: #ffc2cc;
        }

        .vn-alert.info {
          background: rgba(19, 200, 181, 0.14);
          border: 1px solid rgba(19, 200, 181, 0.35);
          color: #9ff5eb;
        }

        .vn-queue-list {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .vn-queue-item {
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          gap: 14px;
          background: #11243e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          align-items: center;
        }

        .vn-video-player {
          width: 100%;
          height: 120px;
          border-radius: 8px;
          background: #050d18;
          object-fit: cover;
        }

        .vn-queue-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .vn-queue-title-row strong {
          font-size: 14px;
          color: #ffffff;
          overflow-wrap: anywhere;
        }

        .vn-queue-caption-row {
          margin-top: 9px;
        }

        .vn-queue-caption-input {
          width: 100%;
          box-sizing: border-box;
          padding: 8px 11px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: #091627;
          color: #ffffff;
          font-size: 13px;
          outline: none;
        }

        .vn-queue-caption-input::placeholder {
          color: #8fa6c2;
        }

        .vn-queue-caption-input:focus {
          border-color: #13c8b5;
        }

        .vn-trim-badge {
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .vn-trim-badge.cut {
          background: rgba(255, 193, 7, 0.16);
          color: #ffe07d;
        }

        .vn-trim-badge.ok {
          background: rgba(19, 200, 181, 0.16);
          color: #7ee8dc;
        }

        .vn-trim-controls {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .vn-trim-controls label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #c7d6e8;
        }

        .vn-trim-controls input {
          width: 66px;
          padding: 6px 8px;
          border-radius: 7px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: #091627;
          color: #ffffff;
          font-size: 13px;
        }

        .vn-mini-btn {
          border: 1px solid rgba(126, 232, 220, 0.4);
          background: rgba(19, 200, 181, 0.16);
          color: #7ee8dc;
          padding: 6px 10px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-remove-btn {
          border: none;
          background: transparent;
          color: #ff8a9b;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .vn-publish-batch {
          width: 100%;
          padding: 12px;
        }

        @media (max-width: 640px) {
          .vn-queue-item {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
