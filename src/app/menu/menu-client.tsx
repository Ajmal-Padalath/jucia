"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { FoodItemCard, type FoodItemCardData } from "@/components/menu/food-item-card";
import { StickyCartButton } from "@/components/menu/sticky-cart-button";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function MenuPage() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table") || "1";
  const setTable = useCartStore((s) => s.setTable);

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<(FoodItemCardData & { categoryId?: string; category?: { slug: string } })[]>([]);
  const [restaurant, setRestaurant] = useState<{
    name: string;
    logo?: string | null;
  } | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [catRes, menuRes, tableRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/menu"),
          fetch(`/api/tables/${tableParam}`),
        ]);
        const cats = await catRes.json();
        const menu = await menuRes.json();
        const table = await tableRes.json();

        if (cats.success) setCategories(cats.data);
        if (menu.success) setItems(menu.data);
        if (table.success) {
          setTableId(table.data.id);
          setTable(table.data.id, table.data.number);
          setRestaurant({
            name: table.data.restaurant?.name || "Restaurant",
            logo: table.data.restaurant?.logo,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tableParam, setTable]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        activeCategory === "all" ||
        item.category?.slug === activeCategory ||
        categories.find((c) => c.slug === activeCategory)?.id === item.categoryId;
      return matchSearch && matchCat;
    });
  }, [items, search, activeCategory, categories]);

  const featured = items.filter((i) => i.isFeatured);
  const popular = items.filter((i) => i.isPopular);

  return (
    <div className="min-h-screen bg-zinc-50 pb-28 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-orange-100">
              {restaurant?.logo ? (
                <Image
                  src={restaurant.logo}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-orange-600">
                  OF
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                {restaurant?.name || "Loading..."}
              </h1>
              <p className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                <MapPin className="h-3 w-3" /> Table {tableParam}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder="Search dishes, ingredients..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search menu"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              activeCategory === "all"
                ? "bg-orange-500 text-white"
                : "bg-white text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-600"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                activeCategory === cat.slug
                  ? "bg-orange-500 text-white"
                  : "bg-white text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-600"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {!search && activeCategory === "all" && featured.length > 0 && (
              <section className="mt-8">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">Featured</h2>
                  <Badge>Chef picks</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {featured.map((item) => (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      tableParam={tableParam}
                    />
                  ))}
                </div>
              </section>
            )}

            {!search && activeCategory === "all" && popular.length > 0 && (
              <section className="mt-8">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">Popular</h2>
                  <Badge variant="warning">Best sellers</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {popular.map((item) => (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      tableParam={tableParam}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8">
              <h2 className="font-display mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {activeCategory === "all"
                  ? "Full Menu"
                  : categories.find((c) => c.slug === activeCategory)?.name}
              </h2>
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-zinc-600 dark:text-zinc-300">No dishes found.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((item) => (
                    <FoodItemCard
                      key={item.id}
                      item={item}
                      tableParam={tableParam}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <StickyCartButton tableParam={tableParam} />
      {tableId && <span className="sr-only">Table ID {tableId}</span>}
    </div>
  );
}
