"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

export function StickyCartButton({ tableParam }: { tableParam?: string }) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const href = tableParam ? `/cart?table=${tableParam}` : "/cart";

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <Link
        href={href}
        className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-orange-500 px-5 py-3.5 text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 animate-in slide-in-from-bottom-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative rounded-xl bg-white/20 p-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600">
              {count}
            </span>
          </div>
          <span className="font-semibold">View Cart</span>
        </div>
        <span className="font-bold">{formatCurrency(subtotal())}</span>
      </Link>
    </div>
  );
}
