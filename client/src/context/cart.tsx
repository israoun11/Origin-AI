import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export interface CartLine { coffeeId: string; slug: string; name: string; image?: string; weight: number; price: number; quantity: number; max: number }
interface Ctx {
  lines: CartLine[]; count: number; subtotal: number; open: boolean; setOpen(v: boolean): void;
  add(l: Omit<CartLine, 'quantity'>, qty?: number): void;
  setQty(coffeeId: string, weight: number, qty: number): void;
  remove(coffeeId: string, weight: number): void; clear(): void;
}
const CartCtx = createContext<Ctx>(null as never);
export const useCart = () => useContext(CartCtx);
const KEY = 'origin.cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [open, setOpen] = useState(false);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines]);
  const same = (a: CartLine, id: string, w: number) => a.coffeeId === id && a.weight === w;
  const value = useMemo<Ctx>(() => ({
    lines, open, setOpen,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    subtotal: lines.reduce((s, l) => s + l.price * l.quantity, 0),
    add: (l, qty = 1) => { setLines((p) => {
      const ex = p.find((x) => same(x, l.coffeeId, l.weight));
      if (ex) return p.map((x) => (x === ex ? { ...x, ...l, quantity: Math.min(x.quantity + qty, l.max) } : x));
      return [...p, { ...l, quantity: Math.min(qty, l.max) }];
    }); setOpen(true); },
    setQty: (id, w, qty) => setLines((p) => p.map((x) => (same(x, id, w) ? { ...x, quantity: Math.max(1, Math.min(qty, x.max)) } : x))),
    remove: (id, w) => setLines((p) => p.filter((x) => !same(x, id, w))),
    clear: () => setLines([]),
  }), [lines, open]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
