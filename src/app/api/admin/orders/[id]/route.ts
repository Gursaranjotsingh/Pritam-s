import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["pending", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sessionClient = createServerSupabase();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { data: admin } = await sessionClient.from("admin_users").select("id").eq("id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { order_status } = await req.json().catch(() => ({}));
  if (!VALID_STATUSES.includes(order_status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Restore inventory automatically when an order moves to cancelled/refunded.
  if (order_status === "cancelled" || order_status === "refunded") {
    await supabase.rpc("restore_order_inventory", { p_order_id: params.id, p_reason: `order_${order_status}` });
  }

  const patch: Record<string, unknown> = { order_status, updated_at: new Date().toISOString() };
  if (order_status === "refunded") patch.payment_status = "refunded";

  const { data, error } = await supabase.from("orders").update(patch).eq("id", params.id).select().single();
  if (error) return NextResponse.json({ error: "Could not update order." }, { status: 500 });

  return NextResponse.json(data);
}
