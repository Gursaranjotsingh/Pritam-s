"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/money";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, subtotalPaise, updateQuantity, removeItem } = useCart();

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-earth-900/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-earth-100 px-5 py-4">
          <h2 className="font-serif text-lg font-bold text-earth-700">Your Cart</h2>
          <button onClick={onClose} aria-label="Close cart" className="text-earth-500 hover:text-earth-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-earth-500">
              <p className="text-base">Your cart is empty.</p>
              <Link href="/shop" onClick={onClose} className="btn-secondary">Shop Achaar</Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-earth-50">
                    <Image src={line.imageUrl} alt={line.name} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-earth-700">{line.name}</p>
                      <button onClick={() => removeItem(line.productId)} className="text-xs text-earth-400 hover:text-spice-600">Remove</button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-earth-200">
                        <button
                          className="px-2 py-1 text-earth-600"
                          onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[1.5rem] text-center text-sm">{line.quantity}</span>
                        <button
                          className="px-2 py-1 text-earth-600 disabled:opacity-30"
                          onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                          disabled={line.quantity >= line.maxQtyPerOrder}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-earth-700">{formatINR(line.pricePaise * line.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-earth-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm text-earth-600">
              <span>Subtotal</span>
              <span className="font-semibold text-earth-800">{formatINR(subtotalPaise)}</span>
            </div>
            <p className="mb-3 text-xs text-earth-400">Shipping & total calculated at checkout.</p>
            <Link href="/cart" onClick={onClose} className="btn-secondary mb-2 w-full">View Cart</Link>
            <Link href="/checkout" onClick={onClose} className="btn-primary w-full">Proceed to Checkout</Link>
          </div>
        )}
      </aside>
    </>
  );
}
