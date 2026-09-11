import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin-only: create a new product (with an initial inventory row).
// Editing existing products can reuse the same Supabase table client-side
// from the admin dashboard (protected by RLS admin policies) — this route
// exists for the create flow so a matching inventory row is guaranteed.
export async function POST(req: Request) {
  const sessionClient = createServerSupabase();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { data: admin } = await sessionClient.from("admin_users").select("id").eq("id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { slug, name, short_description, description, ingredients, spice_level, weight_grams, price_paise, max_qty_per_order, initial_stock, low_stock_threshold, image_url } = body;

  if (!slug || !name || !price_paise) {
    return NextResponse.json({ error: "Slug, name and price are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({
      slug,
      name,
      short_description: short_description || null,
      description: description || null,
      ingredients: ingredients || null,
      spice_level: spice_level || "medium",
      weight_grams: weight_grams || null,
      price_paise,
      max_qty_per_order: max_qty_per_order || 10,
      status: "draft",
    })
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "A product with this slug may already exist." }, { status: 400 });
  }

  await supabase.from("inventory").insert({
    product_id: product.id,
    quantity_available: initial_stock ?? 0,
    low_stock_threshold: low_stock_threshold ?? 5,
  });

  if (image_url) {
    await supabase.from("product_images").insert({ product_id: product.id, url: image_url, alt_text: name, sort_order: 1 });
  }

  return NextResponse.json(product);
}
