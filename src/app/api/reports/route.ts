import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET(request: Request) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error || !session) return error!;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const format = searchParams.get("format") || "json";
    const restaurantId = session.user.restaurantId!;

    const now = new Date();
    let since = startOfDay(now);
    if (period === "weekly") since = startOfWeek(now);
    if (period === "monthly") since = startOfMonth(now);

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: since },
        status: { not: "CANCELLED" },
      },
      include: {
        items: { include: { foodItem: true } },
        table: true,
        customer: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const revenue = orders.reduce((s, o) => s + o.total, 0);
    const foodSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    const hourSales: Record<number, number> = {};

    for (const order of orders) {
      const hour = order.createdAt.getHours();
      hourSales[hour] = (hourSales[hour] || 0) + 1;
      for (const item of order.items) {
        const key = item.foodItemId;
        if (!foodSales[key]) {
          foodSales[key] = { name: item.foodItem.name, qty: 0, revenue: 0 };
        }
        foodSales[key].qty += item.quantity;
        foodSales[key].revenue += item.totalPrice;
      }
    }

    const mostSold = Object.values(foodSales).sort((a, b) => b.qty - a.qty);
    const peakHours = Object.entries(hourSales)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count);

    const report = {
      period,
      since,
      orderCount: orders.length,
      revenue,
      mostSold,
      peakHours,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        table: o.table.number,
        customer: o.customer?.name,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };

    if (format === "csv") {
      const header = "Order Number,Table,Customer,Total,Status,Date\n";
      const rows = report.orders
        .map(
          (o) =>
            `${o.orderNumber},${o.table},${o.customer || ""},${o.total},${o.status},${o.createdAt.toISOString()}`
        )
        .join("\n");
      return new Response(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report-${period}.csv"`,
        },
      });
    }

    return jsonOk(report);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to generate report", 500);
  }
}
