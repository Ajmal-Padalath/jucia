"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Grid3X3,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardShell } from "@/components/dashboard/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/utils";

type Stats = {
  revenue: number;
  todayOrders: number;
  pendingOrders: number;
  activeTables: number;
  popularDishes: { id?: string; name?: string; sold: number; image?: string }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    table: { number: number };
    customer?: { name: string } | null;
  }[];
  salesGraph: { date: string; total: number }[];
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      if (session.user.role === "KITCHEN") router.push("/kitchen");
      else if (session.user.role === "WAITER") router.push("/waiter");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (status === "loading" || !session) {
    return (
      <div className="p-8">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const cards = [
    {
      title: "Revenue",
      value: formatCurrency(stats?.revenue ?? 0),
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "Today's Orders",
      value: String(stats?.todayOrders ?? 0),
      icon: ShoppingBag,
      color: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Pending",
      value: String(stats?.pendingOrders ?? 0),
      icon: Clock,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Active Tables",
      value: String(stats?.activeTables ?? 0),
      icon: Grid3X3,
      color: "text-sky-600 bg-sky-50 dark:bg-sky-950",
    },
  ];

  return (
    <DashboardShell title="Admin Overview">
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.title}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`rounded-xl p-3 ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{card.title}</p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  Sales (7 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.salesGraph || []}>
                    <defs>
                      <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => v.slice(5)}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#F97316"
                      fill="url(#sales)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Popular Dishes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(stats?.popularDishes || []).map((dish, i) => (
                  <div key={dish.id || i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium">{dish.name}</span>
                    </div>
                    <Badge variant="secondary">{dish.sold} sold</Badge>
                  </div>
                ))}
                {!stats?.popularDishes?.length && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">No sales yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-zinc-600 dark:text-zinc-300">
                      <th className="pb-3 font-medium">Order</th>
                      <th className="pb-3 font-medium">Table</th>
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentOrders || []).map((order) => (
                      <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 font-mono text-xs">{order.orderNumber}</td>
                        <td className="py-3">{order.table.number}</td>
                        <td className="py-3">{order.customer?.name || "—"}</td>
                        <td className="py-3">
                          <Badge variant="secondary">
                            {ORDER_STATUS_LABELS[order.status]}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
