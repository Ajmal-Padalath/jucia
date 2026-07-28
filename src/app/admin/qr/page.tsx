"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QRItem = {
  id: string;
  url: string;
  dataUrl: string;
  table: { number: number; capacity: number };
};

export default function AdminQRPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [codes, setCodes] = useState<QRItem[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/qr")
      .then((r) => r.json())
      .then((d) => d.success && setCodes(d.data));
  }, []);

  const downloadPng = (item: QRItem) => {
    const a = document.createElement("a");
    a.href = item.dataUrl;
    a.download = `table-${item.table.number}-qr.png`;
    a.click();
    toast.success("PNG downloaded");
  };

  const downloadPdf = (item: QRItem) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Table ${item.table.number}`, 105, 30, { align: "center" });
    doc.setFontSize(12);
    doc.text("Scan to order", 105, 40, { align: "center" });
    doc.addImage(item.dataUrl, "PNG", 55, 50, 100, 100);
    doc.setFontSize(10);
    doc.text(item.url, 105, 160, { align: "center" });
    doc.save(`table-${item.table.number}-qr.pdf`);
    toast.success("PDF downloaded");
  };

  const downloadAllPdf = () => {
    const doc = new jsPDF();
    codes.forEach((item, index) => {
      if (index > 0) doc.addPage();
      doc.setFontSize(22);
      doc.text(`Table ${item.table.number}`, 105, 40, { align: "center" });
      doc.setFontSize(12);
      doc.text("Orange Flame Kitchen — Scan to order", 105, 50, {
        align: "center",
      });
      doc.addImage(item.dataUrl, "PNG", 55, 60, 100, 100);
      doc.setFontSize(9);
      doc.text(item.url, 105, 175, { align: "center" });
    });
    doc.save("all-table-qr-codes.pdf");
    toast.success("All QR codes exported");
  };

  if (!session) return null;

  return (
    <DashboardShell title="QR Code Management">
      <div className="mb-4 flex justify-end">
        <Button onClick={downloadAllPdf} disabled={!codes.length}>
          <Download className="mr-2 h-4 w-4" />
          Download All PDF
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {codes.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2 text-center">
              <CardTitle>Table {item.table.number}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.dataUrl}
                alt={`QR for table ${item.table.number}`}
                className="h-40 w-40 rounded-xl border border-zinc-200 dark:border-zinc-700"
              />
              <p className="max-w-full truncate text-center text-[10px] text-zinc-500 dark:text-zinc-400">
                {item.url}
              </p>
              <div className="flex w-full gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => downloadPng(item)}
                >
                  PNG
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => downloadPdf(item)}
                >
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
