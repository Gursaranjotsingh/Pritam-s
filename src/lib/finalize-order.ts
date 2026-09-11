import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Shared by both the client-side /api/payment/verify call and the
// /api/webhooks/razorpay handler. Idempotent: safe to call twice for the
// same payment_id (e.g. a webhook retry, or verify+webhook both firing).
export async function finalizePaidOrder(
  supabase: SupabaseClient,
  order: any,
  paymentId: string,
  razorpayOrderId: string,
  signature: string | null
) {
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("gateway_payment_id", paymentId)
    .maybeSingle();

  if (!existingPayment) {
    await supabase.from("payments").insert({
      order_id: order.id,
      gateway: "razorpay",
      gateway_order_id: razorpayOrderId,
      gateway_payment_id: paymentId,
      status: "captured",
      amount_paise: order.total_paise,
    });
  }

  if (order.payment_status === "paid") return; // already finalized — idempotent no-op

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "paid",
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const { error: commitErr } = await supabase.rpc("commit_order_inventory", { p_order_id: order.id });
  if (commitErr) {
    // Extremely rare race: payment succeeded but stock ran out in the meantime.
    // Flag for manual admin follow-up (refund) rather than silently overselling.
    await supabase
      .from("orders")
      .update({ notes: "INVENTORY CONFLICT AFTER PAYMENT — needs manual refund review." })
      .eq("id", order.id);
  }
}
