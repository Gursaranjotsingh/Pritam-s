"use client";

// Cart CONTENTS (which products + quantities) persist in localStorage purely
// for UX convenience (so a page refresh doesn't wipe the cart). This is NOT
// the source of truth for price or stock — at checkout, the server re-reads
// the live price and available inventory for every item from the database
// and rejects/clamps anything that doesn't match. See /api/orders/create.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine } from "@/lib/types";

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotalPaise: number;
  addItem: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pritams_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem: CartContextValue["addItem"] = (line, quantity) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      const cap = line.maxQtyPerOrder ?? 10;
      if (existing) {
        return prev.map((l) =>
          l.productId === line.productId
            ? { ...l, quantity: Math.min(l.quantity + quantity, cap) }
            : l
        );
      }
      return [...prev, { ...line, quantity: Math.min(quantity, cap) }];
    });
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (productId, quantity) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    );
  };

  const removeItem: CartContextValue["removeItem"] = (productId) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const clearCart = () => setLines([]);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotalPaise = useMemo(
    () => lines.reduce((sum, l) => sum + l.pricePaise * l.quantity, 0),
    [lines]
  );

  return (
    <CartContext.Provider value={{ lines, itemCount, subtotalPaise, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
