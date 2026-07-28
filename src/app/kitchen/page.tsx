"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/use-socket";
import { formatCurrency, formatTimeElapsed, ORDER_STATUS_LABELS, cn } from "@/lib/utils";
import { ChefHat } from "lucide-react";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  specialRequest?: string | null;
  createdAt: string;
  table: { number: number };
  customer?: { name: string } | null;
  items: {
    quantity: number;
    spiceLevel?: string | null;
    size?: string | null;
    specialInstructions?: string | null;
    selectedExtras?: { name: string }[] | null;
    foodItem: { name: string };
  }[];
};

const NEXT_STATUS: Record<string, string> = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};

const STATUS_BTN: Record<string, string> = {
  PENDING: "Accept",
  ACCEPTED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Mark Served",
};

export default function KitchenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { socket, connected } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  const loadOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (data.success) {
      setOrders(
        data.data.filter((o: Order) =>
          ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(o.status)
        )
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:kitchen");
    const onNew = (order: Order) => {
      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
      toast.success(`New order ${order.orderNumber}`);
    };
    const onUpdate = (order: Order) => {
      setOrders((prev) => {
        if (["SERVED", "COMPLETED", "CANCELLED"].includes(order.status)) {
          return prev.filter((o) => o.id !== order.id);
        }
        const exists = prev.find((o) => o.id === order.id);
        if (exists) return prev.map((o) => (o.id === order.id ? order : o));
        return [order, ...prev];
      });
    };
    socket.on("order:new", onNew);
    socket.on("order:update", onUpdate);
    return () => {
      socket.off("order:new", onNew);
      socket.off("order:update", onUpdate);
    };
  }, [socket]);

  const updateStatus = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (data.success) {
      socket?.emit("order:status", data.data);
      toast.success(`Order ${STATUS_BTN[order.status]}`);
    }
  };

  if (status === "loading" || !session) {
    return (
      <div className="p-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <DashboardShell
      title="Kitchen Dashboard"
      links={[{ href: "/kitchen", label: "Live Orders", icon: ChefHat }]}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {orders.length} active orders
          <span
            className={cn(
              "ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              connected
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                connected ? "bg-emerald-500" : "bg-zinc-400"
              )}
            />
            {connected ? "Live" : "Offline"}
          </span>
        </p>
        <Button variant="outline" size="sm" onClick={loadOrders}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-zinc-600 dark:text-zinc-300">
            No active orders. Waiting for customers...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className={cn(
                "overflow-hidden",
                order.status === "PENDING" && "ring-2 ring-orange-400"
              )}
            >
              <CardHeader className="flex-row items-start justify-between space-y-0 bg-zinc-50 dark:bg-zinc-800/50">
                <div>
                  <CardTitle className="font-mono text-base">
                    {order.orderNumber}
                  </CardTitle>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Table {order.table.number}
                    {order.customer?.name ? ` · ${order.customer.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      order.status === "PENDING"
                        ? "warning"
                        : order.status === "READY"
                          ? "success"
                          : "default"
                    }
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <p className="mt-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                    {formatTimeElapsed(order.createdAt)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="text-sm text-zinc-800 dark:text-zinc-100">
                      <span className="font-semibold">{item.quantity}×</span>{" "}
                      {item.foodItem.name}
                      {item.size && (
                        <span className="text-zinc-600 dark:text-zinc-300"> ({item.size})</span>
                      )}
                      {item.spiceLevel && (
                        <span className="text-zinc-600 dark:text-zinc-300">
                          {" "}
                          · {item.spiceLevel}
                        </span>
                      )}
                      {item.specialInstructions && (
                        <p className="text-xs italic text-orange-600">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {order.specialRequest && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    Request: {order.specialRequest}
                  </p>
                )}
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {formatDistanceToNow(new Date(order.createdAt), {
                    addSuffix: true,
                  })}
                </p>
                {NEXT_STATUS[order.status] && (
                  <Button className="w-full" onClick={() => updateStatus(order)}>
                    {STATUS_BTN[order.status]}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
