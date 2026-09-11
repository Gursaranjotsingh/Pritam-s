import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR } from "@/lib/money";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const revalidate = 0;

export default async function OrderSuccessPage({ params }: { params: { orderId: string } }) {
  const supabase = createAdminClient();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", params.orderId).single();

  if (!order) notFound();

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916280060371";
  const isPaid = order.payment_status === "paid" || order.payment_method === "cod";

  return (
    <div className="container-px flex flex-col items-center py-16 text-center sm:py-24">
      {isPaid ? (
        <>
          <div className="mb-4 text-5xl">❤️</div>
          <h1 className="font-serif text-3xl font-bold text-earth-800 sm:text-4xl">Thank you for bringing Pritam&apos;s home ❤️</h1>
          <p className="mt-3 text-earth-500">Order #{order.order_number}</p>
        </>
      ) : (
        <>
          <div className="mb-4 text-5xl">⏳</div>
          <h1 className="font-serif text-3xl font-bold text-earth-800">Payment verification is in progress</h1>
          <p className="mt-3 text-earth-500">
            We&apos;ll confirm your order shortly. If this takes more than a few minutes, please contact us on WhatsApp with your order number.
          </p>
        </>
      )}

      <div className="card mt-10 w-full max-w-lg p-6 text-left">
        <h2 className="mb-3 font-serif text-lg font-bold text-earth-700">Order Details</h2>
        <ul className="flex flex-col gap-2 text-sm text-earth-600">
          {order.order_items.map((item: any) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatINR(item.line_total_paise)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-earth-100 pt-4 text-base font-bold text-earth-800">
          <span>Total {order.payment_method === "cod" ? "Payable" : "Paid"}</span>
          <span>{formatINR(order.total_paise)}</span>
        </div>
        <div className="mt-4 border-t border-earth-100 pt-4 text-sm text-earth-500">
          <p className="font-medium text-earth-700">Shipping to:</p>
          <p>{order.customer_name}</p>
          <p>{order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ""}</p>
          <p>{order.city}, {order.state} - {order.pincode}</p>
        </div>
        <div className="mt-4 border-t border-earth-100 pt-4 text-sm text-earth-500">
          <p>Payment method: <span className="font-medium text-earth-700">{order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}</span></p>
          <p>Order status: <span className="font-medium text-earth-700 capitalize">{order.order_status}</span></p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn-secondary">Continue Shopping</Link>
        <a
          href={buildWhatsAppLink(whatsapp, `Hi Pritam's! Need help with my order ${order.order_number}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Need help? Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
