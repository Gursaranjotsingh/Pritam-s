"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import CartDrawer from "@/components/CartDrawer";

const links = [
  { href: "/shop", label: "Shop" },
  { href: "/our-story", label: "Our Story" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-earth-100 bg-cream/90 backdrop-blur-md">
        <div className="container-px flex h-16 items-center justify-between sm:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Pritam's" width={44} height={44} className="rounded-full" priority />
            <span className="hidden font-serif text-lg font-bold tracking-wide text-earth-700 sm:block">
              PRITAM&apos;S
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-earth-700 transition-colors hover:text-spice-600">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-earth-700 transition-colors hover:bg-earth-100"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-spice-500 text-[11px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-earth-700 hover:bg-earth-100 md:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-earth-100 bg-cream px-4 pb-4 md:hidden">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-3 text-sm font-medium text-earth-700 hover:bg-earth-100">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
