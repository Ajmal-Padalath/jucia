"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

const TAX_RATE = 0.05;
const SERVICE_RATE = 0.1;

function CartContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table") || "1";
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal, discount, tableNumber } =
    useCartStore();

  const sub = subtotal();
  const taxable = Math.max(sub - discount, 0);
  const tax = taxable * TAX_RATE;
  const service = taxable * SERVICE_RATE;
  const total = taxable + tax + service;

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-zinc-600 dark:text-zinc-300">Your cart is empty</p>
        <Link href={`/menu?table=${tableParam}`}>
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-zinc-50 pb-36 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <Link href={`/menu?table=${tableParam}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">Your Cart</h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Table {tableNumber || tableParam}
          </p>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {items.map((item) => {
          const extras =
            item.selectedExtras?.reduce((s, e) => s + e.price, 0) ?? 0;
          const line = (item.unitPrice + extras) * item.quantity;
          return (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                <Image
                  src={
                    item.image ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80"
                  }
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight text-zinc-900 dark:text-zinc-50">{item.name}</h3>
                    {item.size && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">{item.size}</p>
                    )}
                    {item.spiceLevel && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        Spice: {item.spiceLevel.replace("_", " ")}
                      </p>
                    )}
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        + {item.selectedExtras.map((e) => e.name).join(", ")}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                        &ldquo;{item.specialInstructions}&rdquo;
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-red-500 dark:text-zinc-400"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(line)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mx-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2 text-sm text-zinc-900 dark:text-zinc-50">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Subtotal</span>
            <span>{formatCurrency(sub)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Tax (5%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">Service (10%)</span>
            <span>{formatCurrency(service)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-orange-600 dark:text-orange-400">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-lg">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/checkout?table=${tableParam}`)}
          >
            Place Order · {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading cart...</div>}>
      <CartContent />
    </Suspense>
  );
}
