import type { Metadata } from "next";
export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl prose-earth">
        <h1 className="font-serif text-3xl font-bold text-earth-800">Shipping Policy</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm text-earth-600">
          <p>We aim to pack and ship your order as soon as possible after it is confirmed.</p>
          <p><strong>Shipping charges</strong> and <strong>free shipping thresholds</strong> are shown at checkout and are configurable from the Admin Dashboard.</p>
          <p><strong>Estimated delivery time:</strong> shown at checkout, configurable in Admin → Settings.</p>
          <p>Delivery timelines may vary based on your location and courier availability. We'll do our best to keep you updated on your order status.</p>
          <p>If you have any questions about your shipment, please contact us on WhatsApp with your order number.</p>
        </div>
      </div>
    </div>
  );
}
