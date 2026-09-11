import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Admin-only: adjust stock (set exact quantity, or add/subtract a delta).
// Auth: requires a logged-in Supabase user present in admin_users (checked
// via the session-bound server client before we touch the service-role client).
export async function POST(req: Request) {
  const sessionClient = createServerSupabase();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: admin } = await sessionClient.from("admin_users").select("id").eq("id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { productId, mode, value, lowStockThreshold } = await req.json().catch(() => ({}));
  if (!productId || !mode) return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: inv } = await supabase.from("inventory").select("*").eq("product_id", productId).single();
  if (!inv) return NextResponse.json({ error: "Product inventory not found." }, { status: 404 });

  let newQty = inv.quantity_available;
  if (mode === "set") newQty = Math.max(0, Number(value));
  else if (mode === "add") newQty = Math.max(0, inv.quantity_available + Number(value));
  else if (mode === "subtract") newQty = Math.max(0, inv.quantity_available - Number(value));
  else if (mode === "sold_out") newQty = 0;

  const change = newQty - inv.quantity_available;

  const update: Record<string, unknown> = { quantity_available: newQty, updated_at: new Date().toISOString() };
  if (typeof lowStockThreshold === "number") update.low_stock_threshold = lowStockThreshold;

  await supabase.from("inventory").update(update).eq("product_id", productId);

  if (change !== 0) {
    await supabase.from("inventory_history").insert({
      product_id: productId,
      change,
      reason: "manual_admin",
      admin_user_id: user.id,
    });
  }

  return NextResponse.json({ quantity_available: newQty });
}
