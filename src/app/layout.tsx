import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/lib/cart-context";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pritams.example.com";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "916280060371";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pritam's | The Taste of Indian Household",
    template: "%s | Pritam's",
  },
  description:
    "Discover homemade Indian achaar from Pritam's — Aam, Nimbu, Mirch and Mix achaar made with the taste and warmth of an Indian household.",
  openGraph: {
    title: "Pritam's | The Taste of Indian Household",
    description:
      "Homemade Indian achaar, prepared with traditional recipes and the warmth of home.",
    url: SITE_URL,
    siteName: "Pritam's",
    images: [{ url: "/logo.png", width: 1200, height: 1200 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pritam's | The Taste of Indian Household",
    description: "Homemade Indian achaar, prepared with traditional recipes and the warmth of home.",
    images: ["/logo.png"],
  },
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pritam's",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "Homemade Indian achaar made with traditional recipes and the warmth of an Indian household.",
  };

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <CartProvider>
          <Navbar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer whatsappNumber={WHATSAPP_NUMBER} />
          <WhatsAppButton phone={WHATSAPP_NUMBER} />
        </CartProvider>
      </body>
    </html>
  );
}
