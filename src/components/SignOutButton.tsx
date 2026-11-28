"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      // Bersihkan sisa session lokal kalau ada
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      router.push("/");
      router.refresh();
    } catch (e) {
      alert("Gagal sign out, coba lagi.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      style={{
        background: "#ef4444",
        color: "#fff",
        border: "none",
        borderRadius: 999,
        padding: "8px 16px",
        fontWeight: 600,
        cursor: "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
