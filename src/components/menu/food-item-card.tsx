"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Heart, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites-store";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type FoodItemCardData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  image?: string | null;
  rating: number;
  isVeg: boolean;
  prepTime: number;
  isAvailable: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
};

export function FoodItemCard({
  item,
  tableParam,
}: {
  item: FoodItemCardData;
  tableParam?: string;
}) {
  const { toggle, isFavorite } = useFavoritesStore();
  const addItem = useCartStore((s) => s.addItem);
  const fav = isFavorite(item.id);
  const href = tableParam
    ? `/menu/item/${item.slug}?table=${tableParam}`
    : `/menu/item/${item.slug}`;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.isAvailable) return;
    addItem({
      foodItemId: item.id,
      name: item.name,
      image: item.image,
      quantity: 1,
      unitPrice: item.price,
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900",
        !item.isAvailable && "opacity-60"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80"}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <button
          type="button"
          aria-label={fav ? "Remove favorite" : "Add favorite"}
          onClick={(e) => {
            e.preventDefault();
            toggle(item.id);
          }}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur dark:bg-zinc-900/90"
        >
          <Heart
            className={cn("h-4 w-4", fav ? "fill-red-500 text-red-500" : "text-zinc-600 dark:text-zinc-300")}
          />
        </button>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          <Badge variant={item.isVeg ? "veg" : "nonveg"}>
            {item.isVeg ? "Veg" : "Non-Veg"}
          </Badge>
          {item.isPopular && <Badge>Popular</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-50">
            {item.name}
          </h3>
          <div className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {item.rating.toFixed(1)}
          </div>
        </div>
        <p className="line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div>
            <p className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(item.price)}</p>
            <p className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3 w-3" /> {item.prepTime} min
            </p>
          </div>
          <Button
            size="icon"
            className="h-9 w-9 rounded-full"
            disabled={!item.isAvailable}
            onClick={quickAdd}
            aria-label={`Add ${item.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {!item.isAvailable && (
          <p className="text-xs font-medium text-red-500">Currently unavailable</p>
        )}
      </div>
    </Link>
  );
}
