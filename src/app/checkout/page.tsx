"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CreditCard, Banknote, Store, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/store/cart-store";
import { useSocket } from "@/hooks/use-socket";
import { formatCurrency, cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
  specialRequest: z.string().optional(),
  paymentMethod: z.enum(["PAY_AT_COUNTER", "CASH", "CARD", "ONLINE"]),
  couponCode: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_OPTIONS = [
  { value: "PAY_AT_COUNTER", label: "Pay at Counter", icon: Store },
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "ONLINE", label: "Online (Stripe)", icon: Wifi },
] as const;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table") || "1";
  const router = useRouter();
  const { socket } = useSocket();
  const {
    items,
    tableId,
    tableNumber,
    subtotal,
    discount,
    couponCode,
    setCoupon,
    clearCart,
  } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState(couponCode || "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: "PAY_AT_COUNTER",
      couponCode: couponCode || "",
    },
  });

  const paymentMethod = watch("paymentMethod");
  const sub = subtotal();
  const taxable = Math.max(sub - discount, 0);
  const total = taxable + taxable * 0.05 + taxable * 0.1;

  const applyCoupon = async () => {
    if (!couponInput) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput, subtotal: sub }),
    });
    const data = await res.json();
    if (data.success) {
      setCoupon(data.data.code, data.data.discount);
      setValue("couponCode", data.data.code);
      toast.success(`Coupon applied: -${formatCurrency(data.data.discount)}`);
    } else {
      toast.error(data.error || "Invalid coupon");
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!tableId) {
      toast.error("Table not detected. Please scan QR again.");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tableId,
          couponCode: couponCode || data.couponCode,
          items,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || "Failed to place order");
        return;
      }

      socket?.emit("order:created", result.data.order);

      if (result.data.checkoutUrl) {
        clearCart();
        window.location.href = result.data.checkoutUrl;
        return;
      }

      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/order/${result.data.order.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-zinc-600 dark:text-zinc-300">Nothing to checkout</p>
        <Link href={`/menu?table=${tableParam}`}>
          <Button>Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-zinc-50 pb-28 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <Link href={`/cart?table=${tableParam}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">Checkout</h1>
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Table {tableNumber || tableParam} · {formatCurrency(total)}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-4">
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <Label htmlFor="name">Your name *</Label>
            <Input id="name" className="mt-1.5" {...register("name")} />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" className="mt-1.5" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="specialRequest">Special request</Label>
            <Textarea
              id="specialRequest"
              className="mt-1.5"
              placeholder="Allergies, celebrations..."
              {...register("specialRequest")}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Label>Coupon code</Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
            />
            <Button type="button" variant="secondary" onClick={applyCoupon}>
              Apply
            </Button>
          </div>
          {discount > 0 && (
            <p className="mt-2 text-sm text-emerald-600">
              Saving {formatCurrency(discount)}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Label className="mb-3 block">Payment method</Label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("paymentMethod", opt.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition",
                  paymentMethod === opt.value
                    ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/40"
                    : "border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                )}
              >
                <opt.icon className="h-5 w-5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Placing order..." : `Confirm · ${formatCurrency(total)}`}
        </Button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
