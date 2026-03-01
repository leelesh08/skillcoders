import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/components/ui/sonner';

type CartItem = {
  id: string | number;
  title: string;
  price: number; // price in base currency (INR)
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string | number) => void;
  clear: () => void;
  updateQty: (id: string | number, qty: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('cart_items');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart_items', JSON.stringify(items));
    } catch (e) {}
  }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === String(item.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity = (copy[idx].quantity || 1) + (item.quantity || 1);
        try { toast.success(`${item.title} added to cart`); } catch (e) {}
        return copy;
      }
      try { toast.success(`${item.title} added to cart`); } catch (e) {}
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const remove = (id: string | number) => setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));

  const clear = () => setItems([]);

  const updateQty = (id: string | number, qty: number) => {
    setItems((prev) => prev.map((p) => (String(p.id) === String(id) ? { ...p, quantity: Math.max(1, qty) } : p)));
  };

  return (
    <CartContext.Provider value={{ items, add, remove, clear, updateQty }}>{children}</CartContext.Provider>
  );
};

export type { CartItem };

export default CartProvider;
