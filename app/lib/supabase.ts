import { createBrowserClient } from "@supabase/ssr";

// Prevent build-time crashes if env vars aren't injected yet
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

