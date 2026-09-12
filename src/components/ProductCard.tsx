"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/money";
import SpiceLevel from "@/components/SpiceLevel";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const image = product.product_images?.[0]?.url ?? "/products/placeholder.jpg";
  const available = product.inventory?.quantity_available ?? 0;
  const soldOut = product.inventory?.is_sold_out ?? available <= 0;
  const lowStock = !soldOut && available <= (product.inventory?.low_stock_threshold ?? 5);

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: image,
        pricePaise: product.price_paise,
        maxQtyPerOrder: product.max_qty_per_order,
      },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <div className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-earth-50">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-earth-800 px-3 py-1 text-xs font-bold text-white">SOLD OUT</span>
        )}
        {!soldOut && lowStock && (
          <span className="absolute left-3 top-3 animate-pop rounded-full bg-spice-500 px-3 py-1 text-xs font-bold text-white">
            Only {available} jar{available === 1 ? "" : "s"} left
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-earth-900/0 transition-colors duration-300 group-hover:bg-earth-900/25 md:flex">
          <span className="translate-y-2 rounded-full bg-cream px-4 py-2 text-xs font-semibold text-earth-700 opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            View Details
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-serif text-lg font-bold text-earth-700 transition-colors group-hover:text-spice-600">{product.name}</h3>
        </Link>
        {product.short_description && <p className="text-sm text-earth-500">{product.short_description}</p>}
        <SpiceLevel level={product.spice_level} />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-base font-bold text-earth-700">{formatINR(product.price_paise)}</span>
          {product.weight_grams && <span className="text-xs text-earth-400">{product.weight_grams} g</span>}
        </div>

        {!soldOut ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center rounded-full border border-earth-200">
              <button className="px-2 py-1 text-earth-600" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span className="min-w-[1.5rem] text-center text-sm">{qty}</span>
              <button
                className="px-2 py-1 text-earth-600 disabled:opacity-30"
                onClick={() => setQty((q) => Math.min(q + 1, product.max_qty_per_order, available))}
                disabled={qty >= Math.min(product.max_qty_per_order, available)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1 py-2 text-xs">
              {justAdded ? "Added ✓" : "Add to Cart"}
            </button>
          </div>
        ) : (
          <button disabled className="mt-2 w-full cursor-not-allowed rounded-full bg-earth-100 px-6 py-2 text-xs font-semibold text-earth-400">
            Sold Out
          </button>
        )}
      </div>
    </div>
  );
}
