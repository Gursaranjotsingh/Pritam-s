import { createServerSupabase } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

// Public product reads go through the session-aware server client so RLS
// (public can only see status='active' products) applies automatically.
export async function getActiveProducts(): Promise<Product[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), inventory(quantity_available, low_stock_threshold, is_sold_out)")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as any[]).map((p) => ({
    ...p,
    product_images: (p.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    inventory: Array.isArray(p.inventory) ? p.inventory[0] ?? null : p.inventory,
  })) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(*), inventory(quantity_available, low_stock_threshold, is_sold_out)")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  const p: any = data;
  return {
    ...p,
    product_images: (p.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    inventory: Array.isArray(p.inventory) ? p.inventory[0] ?? null : p.inventory,
  } as Product;
}
