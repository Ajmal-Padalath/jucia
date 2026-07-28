"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type FoodItem = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isVeg: boolean;
  prepTime: number;
  category: { name: string };
};

export default function AdminMenuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/food-items")
      .then((r) => r.json())
      .then((d) => d.success && setItems(d.data));
  }, []);

  const toggleAvailability = async (item: FoodItem) => {
    const res = await fetch(`/api/food-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
        )
      );
      toast.success("Updated availability");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/food-items/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item deleted");
    }
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!session) return null;

  return (
    <DashboardShell title="Menu Management">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{filtered.length} items</p>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h3>
                  <Badge variant={item.isVeg ? "veg" : "nonveg"}>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </Badge>
                  <Badge variant="secondary">{item.category.name}</Badge>
                  {!item.isAvailable && <Badge variant="danger">Unavailable</Badge>}
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {formatCurrency(item.price)} · {item.prepTime} min
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAvailability(item)}
                >
                  {item.isAvailable ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(item.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
