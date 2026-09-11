import Link from "next/link";
import Image from "next/image";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const shopLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];
const policyLinks = [
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export default function Footer({ whatsappNumber = "916280060371" }: { whatsappNumber?: string }) {
  return (
    <footer className="border-t border-earth-100 bg-earth-900 text-earth-100">
      <div className="container-px grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="mb-3 flex items-center gap-2">
            <Image src="/logo.png" alt="Pritam's" width={44} height={44} className="rounded-full" />
            <span className="font-serif text-lg font-bold text-cream">PRITAM&apos;S</span>
          </Link>
          <p className="text-sm text-earth-300">The Taste of Indian Household</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-earth-300">Shop</h3>
          <ul className="space-y-2">
            {shopLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-earth-200 hover:text-cream">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-earth-300">Policies</h3>
          <ul className="space-y-2">
            {policyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-earth-200 hover:text-cream">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-earth-300">Get in Touch</h3>
          <a href={buildWhatsAppLink(whatsappNumber, "Hi Pritam's! I have a question about your achaar.")} target="_blank" rel="noopener noreferrer" className="text-sm text-earth-200 hover:text-cream">
            Chat on WhatsApp
          </a>
          <div className="mt-4 flex gap-3">
            {/* Social placeholders — add real links from Admin → Settings later */}
            <span className="h-8 w-8 rounded-full border border-earth-600" aria-hidden />
            <span className="h-8 w-8 rounded-full border border-earth-600" aria-hidden />
            <span className="h-8 w-8 rounded-full border border-earth-600" aria-hidden />
          </div>
        </div>
      </div>
      <div className="border-t border-earth-800 py-5 text-center text-xs text-earth-400">
        © {new Date().getFullYear()} Pritam&apos;s. Made with love, at home.
      </div>
    </footer>
  );
}
