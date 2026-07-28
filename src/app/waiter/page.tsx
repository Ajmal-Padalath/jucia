"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ConciergeBell, Users, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/use-socket";
import { formatCurrency, ORDER_STATUS_LABELS, cn } from "@/lib/utils";

type TableData = {
  id: string;
  number: number;
  capacity: number;
  status: string;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    customer?: { name: string } | null;
    items: { quantity: number; foodItem: { name: string }; totalPrice: number }[];
    payment?: { method: string; status: string } | null;
  }[];
};

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200",
  OCCUPIED: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950/50 dark:border-orange-800 dark:text-orange-200",
  WAITING: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200",
  READY_TO_SERVE: "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/50 dark:border-sky-800 dark:text-sky-200 animate-pulse",
};

export default function WaiterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { socket } = useSocket();
  const [tables, setTables] = useState<TableData[]>([]);
  const [selected, setSelected] = useState<TableData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    const res = await fetch("/api/tables");
    const data = await res.json();
    if (data.success) setTables(data.data);
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:waiter");
    const refresh = () => loadTables();
    socket.on("order:new", refresh);
    socket.on("order:update", refresh);
    socket.on("table:update", refresh);
    return () => {
      socket.off("order:new", refresh);
      socket.off("order:update", refresh);
      socket.off("table:update", refresh);
    };
  }, [socket]);

  const markServed = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    const data = await res.json();
    if (data.success) {
      socket?.emit("order:status", data.data);
      toast.success("Marked as served");
      loadTables();
    }
  };

  const clearTable = async (tableId: string) => {
    await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "AVAILABLE" }),
    });
    toast.success("Table cleared");
    setOpen(false);
    loadTables();
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
      title="Waiter Floor"
      links={[{ href: "/waiter", label: "Floor Plan", icon: ConciergeBell }]}
    >
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {Object.entries(STATUS_STYLES).map(([statusKey, style]) => (
          <span
            key={statusKey}
            className={cn("rounded-full border px-3 py-1 font-medium", style)}
          >
            {statusKey.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {tables.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => {
                setSelected(table);
                setOpen(true);
              }}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition hover:scale-[1.02]",
                STATUS_STYLES[table.status] || STATUS_STYLES.AVAILABLE
              )}
            >
              <span className="font-display text-2xl font-bold text-inherit">
                {table.number}
              </span>
              <span className="mt-1 flex items-center gap-1 text-[11px] opacity-80">
                <Users className="h-3 w-3" /> {table.capacity}
              </span>
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide">
                {table.status.replace(/_/g, " ")}
              </span>
            </button>
          ))}
        </div>
      )}

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent
          title={selected ? `Table ${selected.number}` : "Table"}
          description={selected ? `Capacity ${selected.capacity} · ${selected.status}` : ""}
          className="max-h-[85vh] overflow-y-auto"
        >
          {selected && (
            <div className="space-y-4">
              {selected.orders.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300">No orders for this table.</p>
              ) : (
                selected.orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="font-mono text-sm">
                        {order.orderNumber}
                      </CardTitle>
                      <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {order.customer?.name && (
                        <p className="text-sm">{order.customer.name}</p>
                      )}
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>
                            {item.quantity}× {item.foodItem.name}
                          </span>
                          <span>{formatCurrency(item.totalPrice)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t pt-2 font-semibold">
                        <span>Bill</span>
                        <span className="text-orange-600">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      {order.status === "READY" && (
                        <Button
                          className="w-full"
                          onClick={() => markServed(order.id)}
                        >
                          Mark Served
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => clearTable(selected.id)}
                >
                  Clear Table
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </DashboardShell>
  );
}
