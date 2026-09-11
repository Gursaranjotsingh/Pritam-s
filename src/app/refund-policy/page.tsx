import type { Metadata } from "next";
export const metadata: Metadata = { title: "Refund & Cancellation Policy" };

export default function RefundPolicyPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-earth-800">Refund & Cancellation Policy</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm text-earth-600">
          <p>Because our achaar is a perishable, home-made food product, please review this policy carefully before ordering.</p>
          <p><strong>Cancellations:</strong> Orders can typically be cancelled before they are packed/shipped. Contact us on WhatsApp as soon as possible with your order number.</p>
          <p><strong>Damaged or incorrect items:</strong> If your order arrives damaged or incorrect, please contact us within 48 hours of delivery with photos, and we will work with you on a resolution.</p>
          <p><strong>Refunds:</strong> Approved refunds are processed back to the original payment method. Please allow a few business days for the refund to reflect, depending on your bank/payment provider.</p>
          <p>(This is placeholder policy text — please review and edit it to match your actual business practices before launch.)</p>
        </div>
      </div>
    </div>
  );
}
