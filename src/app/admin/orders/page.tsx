"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/utils";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  table: { number: number };
  customer?: { name: string } | null;
};

const FILTERS = [
  "ALL",
  "PENDING",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const load = () => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    if (search) params.set("search", search);
    fetch(`/api/orders?${params}`)
      .then((r) => r.json())
      .then((d) => d.success && setOrders(d.data));
  };

  useEffect(() => {
    load();
  }, [filter]);

  if (!session) return null;

  return (
    <DashboardShell title="Order Management">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Search table, order ID, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={load}>Search</Button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-white text-zinc-800 ring-1 ring-zinc-300 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-600"
              }`}
            >
              {f === "ALL" ? "All" : ORDER_STATUS_LABELS[f] || f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{order.orderNumber}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Table {order.table.number}
                  {order.customer?.name ? ` · ${order.customer.name}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <p className="py-12 text-center text-zinc-600 dark:text-zinc-300">No orders found</p>
        )}
      </div>
    </DashboardShell>
  );
}
