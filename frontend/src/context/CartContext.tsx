import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { MenuItem } from "@/src/lib/api";

export type CartLine = {
  item: MenuItem;
  quantity: number;
};

type CartCtx = {
  lines: CartLine[];
  addItem: (item: MenuItem) => void;
  removeItem: (menuId: string) => void;
  updateQty: (menuId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartCtx | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = (item: MenuItem) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) => (l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (menuId: string) => {
    setLines((prev) => prev.filter((l) => l.item.id !== menuId));
  };

  const updateQty = (menuId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuId);
      return;
    }
    setLines((prev) => prev.map((l) => (l.item.id === menuId ? { ...l, quantity } : l)));
  };

  const clear = () => setLines([]);

  const total = useMemo(() => lines.reduce((s, l) => s + l.item.price * l.quantity, 0), [lines]);
  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider value={{ lines, addItem, removeItem, updateQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
