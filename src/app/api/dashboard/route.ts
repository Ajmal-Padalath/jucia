import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export async function GET(request: Request) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error || !session) return error!;

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "daily";
    const restaurantId = session.user.restaurantId!;

    const now = new Date();
    let since = startOfDay(now);
    if (period === "weekly") since = startOfWeek(now);
    if (period === "monthly") since = startOfMonth(now);

    const [
      revenueAgg,
      todayOrders,
      pendingOrders,
      activeTables,
      popularDishes,
      recentOrders,
      salesByDay,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: {
          restaurantId,
          status: { not: "CANCELLED" },
          createdAt: { gte: since },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({
        where: {
          restaurantId,
          createdAt: { gte: startOfDay(now) },
        },
      }),
      prisma.order.count({
        where: {
          restaurantId,
          status: { in: ["PENDING", "ACCEPTED", "PREPARING"] },
        },
      }),
      prisma.table.count({
        where: {
          restaurantId,
          status: { not: "AVAILABLE" },
        },
      }),
      prisma.orderItem.groupBy({
        by: ["foodItemId"],
        where: {
          order: {
            restaurantId,
            createdAt: { gte: since },
            status: { not: "CANCELLED" },
          },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        where: { restaurantId },
        include: { table: true, customer: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.order.findMany({
        where: {
          restaurantId,
          status: { not: "CANCELLED" },
          createdAt: { gte: subDays(now, 7) },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    const foodIds = popularDishes.map((d) => d.foodItemId);
    const foods = await prisma.foodItem.findMany({
      where: { id: { in: foodIds } },
    });

    const popular = popularDishes.map((d) => ({
      ...foods.find((f) => f.id === d.foodItemId),
      sold: d._sum.quantity ?? 0,
    }));

    const salesMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i).toISOString().slice(0, 10);
      salesMap[day] = 0;
    }
    for (const order of salesByDay) {
      const day = order.createdAt.toISOString().slice(0, 10);
      if (day in salesMap) salesMap[day] += order.total;
    }

    return jsonOk({
      revenue: revenueAgg._sum.total ?? 0,
      orderCount: revenueAgg._count,
      todayOrders,
      pendingOrders,
      activeTables,
      popularDishes: popular,
      recentOrders,
      salesGraph: Object.entries(salesMap).map(([date, total]) => ({
        date,
        total: Math.round(total * 100) / 100,
      })),
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch dashboard stats", 500);
  }
}
