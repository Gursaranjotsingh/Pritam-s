import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaidOrder } from "@/lib/finalize-order";

// Server-to-server Razorpay webhook — the SOURCE OF TRUTH for payment status.
// Configure this URL (https://yourdomain.com/api/webhooks/razorpay) in the
// Razorpay Dashboard → Settings → Webhooks, subscribed to at least:
//   payment.captured, payment.failed, order.paid
// Set the same webhook secret in RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const supabase = createAdminClient();

  // De-duplicate retried webhook deliveries using Razorpay's event id.
  const eventId: string | undefined = event.id;
  if (eventId) {
    const { data: seen } = await supabase
      .from("payments")
      .select("id")
      .eq("gateway_event_id", eventId)
      .maybeSingle();
    if (seen) return NextResponse.json({ status: "duplicate_ignored" });
  }

  const type = event.event as string;

  if (type === "payment.captured" || type === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId: string | undefined = payment?.order_id;
    const paymentId: string | undefined = payment?.id;
    if (razorpayOrderId && paymentId) {
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("razorpay_order_id", razorpayOrderId)
        .single();
      if (order) {
        await finalizePaidOrder(supabase, order, paymentId, razorpayOrderId, null);
        if (eventId) {
          await supabase
            .from("payments")
            .update({ gateway_event_id: eventId, raw_payload: event })
            .eq("gateway_payment_id", paymentId);
        }
      }
    }
  }

  if (type === "payment.failed") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId: string | undefined = payment?.order_id;
    if (razorpayOrderId) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed", order_status: "cancelled" })
        .eq("razorpay_order_id", razorpayOrderId)
        .eq("payment_status", "pending"); // don't clobber an order already marked paid
    }
  }

  return NextResponse.json({ status: "ok" });
}
