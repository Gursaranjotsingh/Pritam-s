import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pritams.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProducts();

  const staticPages = [
    "", "shop", "about", "our-story", "contact", "faq",
    "shipping-policy", "refund-policy", "privacy-policy", "terms",
  ].map((path) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date(),
  }));

  const productPages = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...productPages];
}
