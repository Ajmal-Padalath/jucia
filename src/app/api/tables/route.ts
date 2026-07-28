import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { tableSchema } from "@/lib/validations";

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        qrCode: true,
        orders: {
          where: {
            status: { in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] },
          },
          include: {
            items: { include: { foodItem: true } },
            customer: true,
            payment: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { number: "asc" },
    });
    return jsonOk(tables);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch tables", 500);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error || !session) return error!;

  try {
    const body = await request.json();
    const parsed = tableSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return jsonError("No restaurant assigned", 400);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const table = await prisma.table.create({
      data: {
        number: parsed.data.number,
        capacity: parsed.data.capacity,
        restaurantId,
        qrCode: {
          create: {
            restaurantId,
            url: `${appUrl}/menu?table=${parsed.data.number}`,
          },
        },
      },
      include: { qrCode: true },
    });

    return jsonOk(table, 201);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create table", 500);
  }
}
