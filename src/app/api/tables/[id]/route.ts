import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import type { TableStatus } from "@prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const byNumber = !isNaN(Number(id));

    const table = await prisma.table.findFirst({
      where: byNumber ? { number: Number(id) } : { id },
      include: {
        qrCode: true,
        restaurant: true,
        orders: {
          include: {
            items: { include: { foodItem: true } },
            customer: true,
            payment: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!table) return jsonError("Table not found", 404);
    return jsonOk(table);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch table", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN", "WAITER", "STAFF"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status as TableStatus } : {}),
        ...(body.capacity ? { capacity: Number(body.capacity) } : {}),
      },
      include: { qrCode: true },
    });
    return jsonOk(table);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to update table", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.table.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to delete table", 500);
  }
}
