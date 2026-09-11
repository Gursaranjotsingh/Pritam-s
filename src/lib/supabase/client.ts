// Browser-side Supabase client. Uses the PUBLIC anon key only.
// This client can only read what Row Level Security policies allow
// (active products, images, stock counts, settings) — see supabase/schema.sql.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
