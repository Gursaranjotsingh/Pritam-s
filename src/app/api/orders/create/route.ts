import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validation/checkout";

// Row shape for the `products` table (queried WITHOUT the embedded
// `inventory` relation — see note below on why).
interface ProductRow {
  id: string;
  name: string;
  price_paise: number;
  status: string;
  max_qty_per_order: number;
}

// Creates an order in "pending" state. Price + stock are re-read from the
// database here — client-submitted price/quantity values are NEVER trusted.
// Inventory is NOT deducted yet (that only happens after verified payment,
// or immediately below for COD orders where there's no gateway to verify).
export async function POST(req: Request) {
  const supabase = createAdminClient();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Load settings needed for pricing/validation
  const { data: settingsRows } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["cod_enabled", "cod_fee_paise", "cod_max_order_paise", "shipping_charge_paise", "free_shipping_threshold_paise"]);
  const settings: Record<string, any> = {};
  for (const row of settingsRows ?? []) settings[row.key] = row.value;

  if (input.payment_method === "cod" && settings.cod_enabled !== true) {
    return NextResponse.json({ error: "Cash on Delivery is not available right now." }, { status: 400 });
  }

  // Re-fetch authoritative product data (price + live stock) for every item.
  //
  // This is deliberately TWO separate queries instead of one query with an
  // embedded `inventory(...)` relation. Embedding was unreliable here —
  // depending on how PostgREST resolves the relationship, the nested
  // `inventory` field could come back shaped differently than expected,
  // which silently made every product look out of stock even when Admin
  // correctly showed 20 units. Querying `inventory` directly and joining it
  // ourselves in application code (via a Map) removes that ambiguity
  // entirely — there is no embedded-relation shape left to get wrong.
  const productIds = input.items.map((i) => i.productId);

  const { data: products, error: productsErr } = await supabase
    .from("products")
    .select("id, name, price_paise, status, max_qty_per_order")
    .in("id", productIds)
    .returns<ProductRow[]>();

  if (productsErr) {
    console.error("[ORDER CREATE] products query failed:", productsErr.message);
    return NextResponse.json(
      { error: "We couldn't verify your items right now. Please try again in a moment." },
      { status: 500 }
    );
  }

  const { data: inventoryRows, error: inventoryErr } = await supabase
    .from("inventory")
    .select("product_id, quantity_available")
    .in("product_id", productIds);

  if (inventoryErr) {
    console.error("[ORDER CREATE] inventory query failed:", inventoryErr.message);
    return NextResponse.json(
      { error: "We couldn't verify stock levels right now. Please try again in a moment." },
      { status: 500 }
    );
  }

  if (!products || products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more items in your cart are no longer available." },
      { status: 409 }
    );
  }

  // product_id -> quantity_available, built directly from the inventory
  // table — no embedded-relation normalization needed.
  const inventoryMap = new Map<string, number>(
    (inventoryRows ?? []).map((row) => [row.product_id, row.quantity_available])
  );

  let subtotalPaise = 0;
  const orderItems: {
    product_id: string;
    product_name: string;
    unit_price_paise: number;
    quantity: number;
    line_total_paise: number;
  }[] = [];

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || product.status !== "active") {
      return NextResponse.json({ error: "One of the items in your cart is unavailable." }, { status: 409 });
    }

    const available = inventoryMap.get(product.id) ?? 0;

    // Temporary debug logging — server-side only, no customer/payment data.
    console.log("[ORDER DEBUG]", {
      productId: product.id,
      productName: product.name,
      requestedQuantity: item.quantity,
      availableQuantity: available,
    });

    if (item.quantity > available) {
      return NextResponse.json(
        { error: `Sorry, only ${available} unit(s) of "${product.name}" are left in stock.` },
        { status: 409 }
      );
    }
    if (item.quantity > product.max_qty_per_order) {
      return NextResponse.json(
        { error: `You can order at most ${product.max_qty_per_order} unit(s) of "${product.name}" per order.` },
        { status: 400 }
      );
    }
    const lineTotal = product.price_paise * item.quantity;
    subtotalPaise += lineTotal;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      unit_price_paise: product.price_paise,
      quantity: item.quantity,
      line_total_paise: lineTotal,
    });
  }

  const shippingPaise =
    subtotalPaise >= (settings.free_shipping_threshold_paise ?? Infinity) ? 0 : settings.shipping_charge_paise ?? 0;
  const codFeePaise = input.payment_method === "cod" ? settings.cod_fee_paise ?? 0 : 0;

  if (input.payment_method === "cod") {
    const codMax = settings.cod_max_order_paise;
    if (typeof codMax === "number" && subtotalPaise + shippingPaise + codFeePaise > codMax) {
      return NextResponse.json({ error: "This order value is too high for Cash on Delivery." }, { status: 400 });
    }
  }

  const totalPaise = subtotalPaise + shippingPaise + codFeePaise;

  // Upsert customer
  const { data: customer, error: customerErr } = await supabase
    .from("customers")
    .insert({ name: input.name, phone: input.phone, email: input.email || null })
    .select()
    .single();
  if (customerErr || !customer) {
    return NextResponse.json({ error: "Unable to place your order. Please contact us on WhatsApp." }, { status: 500 });
  }

  const orderNumber = `PRT-${Date.now().toString().slice(-8)}`;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customer.id,
      customer_name: input.name,
      customer_phone: input.phone,
      customer_email: input.email || null,
      address_line1: input.address_line1,
      address_line2: input.address_line2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      subtotal_paise: subtotalPaise,
      shipping_paise: shippingPaise,
      cod_fee_paise: codFeePaise,
      total_paise: totalPaise,
      payment_method: input.payment_method,
      payment_status: input.payment_method === "cod" ? "pending" : "pending",
      order_status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Unable to place your order. Please contact us on WhatsApp." }, { status: 500 });
  }

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

  if (itemsErr) {
    return NextResponse.json({ error: "Unable to place your order. Please contact us on WhatsApp." }, { status: 500 });
  }

  // COD orders: no gateway payment to verify, so we confirm & commit inventory now.
  if (input.payment_method === "cod") {
    const { error: commitErr } = await supabase.rpc("commit_order_inventory", { p_order_id: order.id });
    if (commitErr) {
      // Someone else grabbed the last unit between our check and now — roll back the order.
      await supabase.from("orders").update({ order_status: "cancelled" }).eq("id", order.id);
      return NextResponse.json(
        { error: "Sorry, this item just sold out while you were checking out." },
        { status: 409 }
      );
    }
    await supabase.from("orders").update({ order_status: "processing" }).eq("id", order.id);
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    totalPaise,
    paymentMethod: input.payment_method,
  });
}
