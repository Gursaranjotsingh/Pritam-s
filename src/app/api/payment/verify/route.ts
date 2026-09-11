import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaidOrder } from "@/lib/finalize-order";

// Called by the browser immediately after Razorpay Checkout succeeds.
// This gives the customer a fast confirmation, BUT it is only ever treated
// as provisional — we still verify the signature server-side here, and the
// webhook handler (/api/webhooks/razorpay) remains the ultimate source of
// truth in case this call never fires (tab closed, network drop, etc).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return NextResponse.json({ error: "Payment verification is not configured." }, { status: 500 });

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  await finalizePaidOrder(supabase, order, razorpay_payment_id, razorpay_order_id, razorpay_signature);

  return NextResponse.json({ status: "verified", orderNumber: order.order_number });
}
