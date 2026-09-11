"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/money";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";

const spiceLabels: Record<string, string> = {
  mild: "Mild",
  medium: "Medium",
  hot: "Hot",
  extra_hot: "Extra Hot",
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const images = product.product_images?.length ? product.product_images : [{ id: "ph", url: "/products/placeholder.jpg", alt_text: product.name, sort_order: 0 }];
  const available = product.inventory?.quantity_available ?? 0;
  const soldOut = product.inventory?.is_sold_out ?? available <= 0;
  const maxQty = Math.min(product.max_qty_per_order, available || product.max_qty_per_order);

  function lineForCart() {
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: images[0].url,
      pricePaise: product.price_paise,
      maxQtyPerOrder: product.max_qty_per_order,
    };
  }

  function handleAdd() {
    addItem(lineForCart(), qty);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  function handleBuyNow() {
    addItem(lineForCart(), qty);
    router.push("/checkout");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-xl2 bg-earth-50 shadow-card">
          <Image src={images[activeImg].url} alt={images[activeImg].alt_text || product.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" priority />
          {soldOut && (
            <span className="absolute left-4 top-4 rounded-full bg-earth-800 px-4 py-1.5 text-sm font-bold text-white">SOLD OUT</span>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((img, i) => (
              <button key={img.id} onClick={() => setActiveImg(i)} className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${activeImg === i ? "border-spice-500" : "border-transparent"}`}>
                <Image src={img.url} alt={img.alt_text || product.name} fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="font-serif text-3xl font-bold text-earth-800">{product.name}</h1>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-2xl font-bold text-earth-700">{formatINR(product.price_paise)}</span>
          {product.compare_at_price_paise && product.compare_at_price_paise > product.price_paise && (
            <span className="text-base text-earth-400 line-through">{formatINR(product.compare_at_price_paise)}</span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {product.weight_grams && <span className="rounded-full bg-earth-100 px-3 py-1 text-earth-600">{product.weight_grams} g</span>}
          <span className="rounded-full bg-earth-100 px-3 py-1 text-earth-600">Spice level: {spiceLabels[product.spice_level] ?? product.spice_level}</span>
          {!soldOut && available > 0 && available <= (product.inventory?.low_stock_threshold ?? 5) && (
            <span className="rounded-full bg-spice-500 px-3 py-1 font-semibold text-white">Only {available} jar{available === 1 ? "" : "s"} left</span>
          )}
        </div>

        {product.short_description && <p className="mt-5 text-earth-600">{product.short_description}</p>}
        {product.description && <p className="mt-3 whitespace-pre-line text-sm text-earth-500">{product.description}</p>}

        {product.ingredients && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-earth-700">Ingredients</h3>
            <p className="mt-1 text-sm text-earth-500">{product.ingredients}</p>
          </div>
        )}

        {!soldOut ? (
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-earth-600">Quantity</span>
              <div className="flex items-center rounded-full border border-earth-200">
                <button className="px-3 py-1.5 text-earth-600" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span className="min-w-[2rem] text-center">{qty}</span>
                <button className="px-3 py-1.5 text-earth-600 disabled:opacity-30" onClick={() => setQty((q) => Math.min(q + 1, maxQty))} disabled={qty >= maxQty} aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={handleAdd} className="btn-secondary flex-1">{justAdded ? "Added to Cart ✓" : "Add to Cart"}</button>
              <button onClick={handleBuyNow} className="btn-primary flex-1">Buy Now</button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <button disabled className="w-full cursor-not-allowed rounded-full bg-earth-100 px-6 py-3 font-semibold text-earth-400">SOLD OUT</button>
            <p className="mt-2 text-center text-sm text-earth-400">Check back soon!</p>
          </div>
        )}

        <a
          href={buildWhatsAppLink("916280060371", `Hi Pritam's! I have a question about ${product.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#128C7E] hover:underline"
        >
          Chat with us on WhatsApp about this product
        </a>
      </div>
    </div>
  );
}
