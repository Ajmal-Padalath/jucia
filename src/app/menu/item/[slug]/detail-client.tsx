"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, Minus, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency, cn } from "@/lib/utils";

type Variant = { id: string; name: string; price: number };
type Extra = { id: string; name: string; price: number };

type FoodDetail = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image?: string | null;
  rating: number;
  isVeg: boolean;
  prepTime: number;
  isAvailable: boolean;
  ingredients: string[];
  variants: Variant[];
  extras: Extra[];
};

const SPICE_LEVELS = ["MILD", "MEDIUM", "HOT", "EXTRA_HOT"] as const;

export default function FoodDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table") || "1";
  const slug = params.slug as string;
  const addItem = useCartStore((s) => s.addItem);

  const [item, setItem] = useState<FoodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] =
    useState<(typeof SPICE_LEVELS)[number]>("MEDIUM");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch(`/api/menu/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setItem(res.data);
          if (res.data.variants?.length) {
            setSelectedVariant(res.data.variants[0]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras((prev) =>
      prev.find((e) => e.id === extra.id)
        ? prev.filter((e) => e.id !== extra.id)
        : [...prev, extra]
    );
  };

  const unitPrice = selectedVariant?.price ?? item?.price ?? 0;
  const extrasTotal = selectedExtras.reduce((s, e) => e.price + s, 0);
  const total = (unitPrice + extrasTotal) * quantity;

  const handleAdd = () => {
    if (!item || !item.isAvailable) return;
    addItem({
      foodItemId: item.id,
      name: item.name,
      image: item.image,
      quantity,
      unitPrice,
      spiceLevel,
      size: selectedVariant?.name,
      selectedExtras: selectedExtras.map((e) => ({
        id: e.id,
        name: e.name,
        price: e.price,
      })),
      specialInstructions: notes || undefined,
    });
    toast.success(`${item.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <Skeleton className="aspect-[4/3] w-full" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p>Item not found</p>
        <Link href={`/menu?table=${tableParam}`}>
          <Button>Back to menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white pb-28 dark:bg-zinc-950">
      <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={
            item.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80"
          }
          alt={item.name}
          fill
          className="object-cover"
          priority
        />
        <Link
          href={`/menu?table=${tableParam}`}
          className="absolute left-4 top-4 rounded-full bg-white/90 p-2 shadow backdrop-blur dark:bg-zinc-900/90"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h1>
            <Badge variant={item.isVeg ? "veg" : "nonveg"}>
              {item.isVeg ? "Veg" : "Non-Veg"}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              {item.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {item.prepTime} min
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {item.description}
          </p>
          {item.ingredients?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.ingredients.map((ing) => (
                <Badge key={ing} variant="secondary">
                  {ing}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {item.variants.length > 0 && (
          <div>
            <Label className="mb-2 block">Size</Label>
            <div className="flex flex-wrap gap-2">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVariant(v)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                    selectedVariant?.id === v.id
                      ? "border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
                      : "border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                  )}
                >
                  {v.name} · {formatCurrency(v.price)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label className="mb-2 block">Spice level</Label>
          <div className="grid grid-cols-4 gap-2">
            {SPICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSpiceLevel(level)}
                className={cn(
                  "rounded-xl border py-2 text-xs font-semibold transition",
                  spiceLevel === level
                    ? "border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
                    : "border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                )}
              >
                {level.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {item.extras.length > 0 && (
          <div>
            <Label className="mb-2 block">Extra toppings</Label>
            <div className="space-y-2">
              {item.extras.map((extra) => {
                const selected = selectedExtras.some((e) => e.id === extra.id);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition",
                      selected
                        ? "border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100"
                        : "border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                    )}
                  >
                    <span>{extra.name}</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      +{formatCurrency(extra.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="notes" className="mb-2 block">
            Special instructions
          </Label>
          <Textarea
            id="notes"
            placeholder="No onions, extra sauce..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Quantity</Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-semibold text-zinc-900 dark:text-zinc-50">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            className="flex-1"
            size="lg"
            disabled={!item.isAvailable}
            onClick={handleAdd}
          >
            Add to Cart · {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
