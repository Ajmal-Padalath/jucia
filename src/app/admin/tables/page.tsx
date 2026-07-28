"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type TableRow = {
  id: string;
  number: number;
  capacity: number;
  status: string;
  qrCode?: { url: string } | null;
};

export default function AdminTablesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState("4");

  const load = () =>
    fetch("/api/tables")
      .then((r) => r.json())
      .then((d) => d.success && setTables(d.data));

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: Number(number),
        capacity: Number(capacity),
      }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Table ${number} created with QR`);
      setNumber("");
      load();
    } else {
      toast.error(data.error);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete table?")) return;
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    toast.success("Table deleted");
    load();
  };

  if (!session) return null;

  return (
    <DashboardShell title="Table Management">
      <Card className="mb-6">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <Label>Table number</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div>
            <Label>Capacity</Label>
            <Input
              type="number"
              className="mt-1.5"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={create}>
              Create Table + QR
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => (
          <Card key={table.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    Table {table.number}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Seats {table.capacity}
                  </p>
                </div>
                <Badge variant="secondary">{table.status}</Badge>
              </div>
              {table.qrCode && (
                <p className="mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {table.qrCode.url}
                </p>
              )}
              <Button
                size="sm"
                variant="destructive"
                className="mt-3"
                onClick={() => remove(table.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
