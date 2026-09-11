"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import type { Settings } from "@/lib/types";

export default function CartPage() {
  const { lines, subtotalPaise, updateQuantity, removeItem } = useCart();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const shipping = settings
    ? subtotalPaise >= settings.free_shipping_threshold_paise
      ? 0
      : settings.shipping_charge_paise
    : 0;
  const total = subtotalPaise + shipping;

  return (
    <div className="container-px py-12 sm:py-16">
      <h1 className="mb-8 font-serif text-3xl font-bold text-earth-800">Your Cart</h1>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-earth-500">Your cart is empty.</p>
          <Link href="/shop" className="btn-primary">Shop Achaar</Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-3">
          <ul className="flex flex-col gap-5 lg:col-span-2">
            {lines.map((line) => (
              <li key={line.productId} className="card flex gap-4 p-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-earth-50">
                  <Image src={line.imageUrl} alt={line.name} fill sizes="96px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-serif text-base font-bold text-earth-700">{line.name}</p>
                      <p className="text-sm text-earth-500">{formatINR(line.pricePaise)} each</p>
                    </div>
                    <button onClick={() => removeItem(line.productId)} className="text-xs text-earth-400 hover:text-spice-600">Remove</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-earth-200">
                      <button className="px-3 py-1.5 text-earth-600" onClick={() => updateQuantity(line.productId, line.quantity - 1)} aria-label="Decrease quantity">−</button>
                      <span className="min-w-[2rem] text-center">{line.quantity}</span>
                      <button className="px-3 py-1.5 text-earth-600 disabled:opacity-30" onClick={() => updateQuantity(line.productId, line.quantity + 1)} disabled={line.quantity >= line.maxQtyPerOrder} aria-label="Increase quantity">+</button>
                    </div>
                    <span className="font-semibold text-earth-700">{formatINR(line.pricePaise * line.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card h-fit p-6">
            <h2 className="mb-4 font-serif text-lg font-bold text-earth-700">Order Summary</h2>
            <div className="flex justify-between text-sm text-earth-600">
              <span>Subtotal</span>
              <span>{formatINR(subtotalPaise)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-earth-600">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-earth-100 pt-4 text-base font-bold text-earth-800">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            <Link href="/checkout" className="btn-primary mt-6 w-full">Proceed to Checkout</Link>
            <Link href="/shop" className="btn-secondary mt-3 w-full">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}
