"use client";
import { useState } from "react";

// v-nect - LanguageSwitcher
// File: src/components/LanguageSwitcher.tsx
// Dipakai di: dashboard/page.tsx, company/page.tsx, dll.
// Sederhana dulu: ganti label bahasa, simpan di localStorage.
// Nanti bisa disambung ke sistem translate beneran.

const LANGS = [
  { code: "id", label: "🇮🇩 ID" },
  { code: "en", label: "🇺🇸 EN" },
  { code: "zh", label: "🇨🇳 中文" },
  { code: "ja", label: "🇯🇵 JP" },
  { code: "ko", label: "🇰🇷 KR" },
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState("id");
  const [open, setOpen] = useState(false);

  function choose(code: string) {
    setLang(code);
    setOpen(false);
    try {
      localStorage.setItem("vnect-lang", code);
      document.cookie = `vnect-lang=${code}; path=/; max-age=31536000`;
    } catch {}
    // Biar halaman lain tau bahasa ganti
    window.dispatchEvent(new CustomEvent("vnect-lang-change", { detail: code }));
  }

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: "#0E183A",
          border: "1px solid rgba(138,165,255,.4)",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        {current.label} ▾
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            background: "#0E183A",
            border: "1px solid rgba(138,165,255,.4)",
            borderRadius: 12,
            overflow: "hidden",
            minWidth: 110,
            zIndex: 50,
            boxShadow: "0 10px 30px rgba(0,0,0,.4)",
          }}
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => choose(l.code)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: l.code === lang ? "#4B6BFF" : "transparent",
                border: 0,
                color: "#fff",
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: l.code === lang ? 800 : 400,
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
