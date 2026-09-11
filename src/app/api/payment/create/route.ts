import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay";

// Given a pending order (created via /api/orders/create), open a Razorpay
// order for the EXACT total already stored server-side. The browser never
// tells us the amount to charge.
export async function POST(req: Request) {
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: "Missing orderId." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).single();

  if (error || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.payment_method !== "online") {
    return NextResponse.json({ error: "This order is not set up for online payment." }, { status: 400 });
  }
  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "This order is already paid." }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayClient();
    const rpOrder = await razorpay.orders.create({
      amount: order.total_paise, // Razorpay also expects the smallest currency unit (paise)
      currency: "INR",
      receipt: order.order_number,
      notes: { order_id: order.id },
    });

    await supabase.from("orders").update({ razorpay_order_id: rpOrder.id }).eq("id", order.id);

    return NextResponse.json({
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
    });
  } catch (e) {
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 502 });
  }
}
