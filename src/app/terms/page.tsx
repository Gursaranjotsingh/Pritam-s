import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-3xl font-bold text-earth-800">Terms & Conditions</h1>
        <div className="mt-6 flex flex-col gap-4 text-sm text-earth-600">
          <p>By using this website and placing an order, you agree to these terms.</p>
          <p>Product information (price, weight, stock) shown on the site is as accurate as possible at the time of your order, but may change without notice.</p>
          <p>All orders are subject to availability. In the rare case an item sells out before your payment is confirmed, we will let you know and process a refund if needed.</p>
          <p>Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</p>
          <p>(This is placeholder legal text — please have it reviewed by a professional to ensure it fits your business before launch.)</p>
        </div>
      </div>
    </div>
  );
}
