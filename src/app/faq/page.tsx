import type { Metadata } from "next";
export const metadata: Metadata = { title: "FAQ" };

const faqs = [
  { q: "How is Pritam's achaar made?", a: "Our achaar is prepared at home by my mother, using traditional recipes and methods passed down in our family." },
  { q: "How should I store the achaar after opening?", a: "Keep the jar tightly sealed, use a clean dry spoon each time, and store it in a cool, dry place." },
  { q: "What is the shelf life?", a: "Please refer to the label on your jar for the exact shelf life and storage instructions." },
  { q: "How long does delivery take?", a: "Most orders are delivered within the estimate shown at checkout, depending on your location." },
  { q: "What payment methods do you accept?", a: "We currently accept online payments via UPI, cards, netbanking and wallets. Cash on Delivery may be available depending on your location — you'll see this option at checkout if it's enabled." },
  { q: "Can I cancel or return my order?", a: "Please see our Refund & Cancellation Policy for details." },
  { q: "Do you take bulk or custom orders?", a: "Yes — message us on WhatsApp and we'll be happy to help." },
];

export default function FaqPage() {
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 font-serif text-3xl font-bold text-earth-800 sm:text-4xl">Frequently Asked Questions</h1>
        <div className="divide-y divide-earth-100">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-earth-700">
                {f.q}
                <span className="ml-2 text-earth-400 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-earth-500">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
