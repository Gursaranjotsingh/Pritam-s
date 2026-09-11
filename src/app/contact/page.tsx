import type { Metadata } from "next";
import { buildWhatsAppLink } from "@/lib/whatsapp";
export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916280060371";
  return (
    <div className="container-px py-14 sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-serif text-3xl font-bold text-earth-800 sm:text-4xl">Get in Touch</h1>
        <p className="mt-4 text-earth-600">
          Have a question about an order, an ingredient, or want to place a bulk order? We&apos;d love to hear from you.
        </p>
        <a
          href={buildWhatsAppLink(whatsapp, "Hi Pritam's! I have a question about your achaar.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-8 inline-flex"
        >
          Chat on WhatsApp
        </a>
        <p className="mt-6 text-sm text-earth-400">
          You can also add an email address and business hours here from Admin → Settings.
        </p>
      </div>
    </div>
  );
}
