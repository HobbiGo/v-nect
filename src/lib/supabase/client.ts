import { createClient } from "@supabase/supabase-js";

// v-nect - Supabase Client (Browser)
// File: src/lib/supabase/client.ts
// Dipakai di: dashboard/page.tsx, company/page.tsx, v-circle, v-market, dll.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("v-nect: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set di .env.local / Vercel");
}

export function createClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Biar bisa dipakai 2 cara:
// 1. const supabase = createClient()
// 2. import { supabase } from "@/lib/supabase/client"
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export default createClient;
