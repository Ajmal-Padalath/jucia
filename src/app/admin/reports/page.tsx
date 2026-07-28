"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type Report = {
  period: string;
  orderCount: number;
  revenue: number;
  mostSold: { name: string; qty: number; revenue: number }[];
  peakHours: { hour: number; count: number }[];
};

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState("daily");
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch(`/api/reports?period=${period}`)
      .then((r) => r.json())
      .then((d) => d.success && setReport(d.data));
  }, [period]);

  const exportCsv = () => {
    window.open(`/api/reports?period=${period}&format=csv`, "_blank");
  };

  if (!session) return null;

  return (
    <DashboardShell title="Reports">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(report?.revenue ?? 0)}
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {report?.orderCount ?? 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Peak Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(report?.peakHours || []).slice(0, 5).map((h) => (
              <div key={h.hour} className="flex justify-between text-sm">
                <span>
                  {String(h.hour).padStart(2, "0")}:00 –{" "}
                  {String(h.hour + 1).padStart(2, "0")}:00
                </span>
                <Badge variant="secondary">{h.count} orders</Badge>
              </div>
            ))}
            {!report?.peakHours?.length && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Most Sold Foods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-zinc-600 dark:text-zinc-300">
                  <th className="pb-2 font-medium">Dish</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(report?.mostSold || []).map((item) => (
                  <tr key={item.name} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5">{item.name}</td>
                    <td className="py-2.5">{item.qty}</td>
                    <td className="py-2.5 text-right font-medium">
                      {formatCurrency(item.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
