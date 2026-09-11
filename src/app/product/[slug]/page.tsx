import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.short_description || `${product.name} — homemade by Pritam's.`,
    openGraph: {
      title: `${product.name} | Pritam's`,
      description: product.short_description || undefined,
      images: product.product_images?.[0]?.url ? [product.product_images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.short_description ?? product.description ?? undefined,
    image: product.product_images?.map((i) => i.url) ?? [],
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price_paise / 100).toFixed(2),
      availability: product.inventory?.is_sold_out
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <div className="container-px py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <ProductDetailClient product={product} />
    </div>
  );
}
