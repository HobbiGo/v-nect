import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ============================================================
// v-nect - Supabase Client (Browser)
// File: src/lib/supabase/client.ts
// Dipakai di:
//  - src/app/dashboard/page.tsx
//  - src/app/company/page.tsx
//  - src/app/v-circle/page.tsx
//  - src/app/v-market/page.tsx
//  - src/app/v-meet/page.tsx
// ============================================================
// PENTING:
// JANGAN tulis URL / KEY langsung di file ini.
// Pakai Environment Variables di Vercel:
//  - NEXT_PUBLIC_SUPABASE_URL
//  - NEXT_PUBLIC_SUPABASE_ANON_KEY
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "v-nect: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set di Vercel -> Settings -> Environment Variables"
  );
}

// Cara pakai 1 (yang dipakai dashboard):
// const supabase = createClient();
// const { data } = await supabase.from("account_settings").select("*");
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Cara pakai 2 (boleh juga):
// import { supabase } from "@/lib/supabase/client";
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default createClient;
