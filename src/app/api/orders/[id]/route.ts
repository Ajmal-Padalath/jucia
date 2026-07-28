import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { orderStatusSchema } from "@/lib/validations";
import type { OrderStatus, TableStatus } from "@prisma/client";

const statusTimestamps: Partial<Record<OrderStatus, string>> = {
  ACCEPTED: "acceptedAt",
  PREPARING: "preparingAt",
  READY: "readyAt",
  SERVED: "servedAt",
  COMPLETED: "completedAt",
  CANCELLED: "cancelledAt",
};

const tableStatusMap: Partial<Record<OrderStatus, TableStatus>> = {
  PENDING: "OCCUPIED",
  ACCEPTED: "OCCUPIED",
  PREPARING: "WAITING",
  READY: "READY_TO_SERVE",
  SERVED: "OCCUPIED",
  COMPLETED: "AVAILABLE",
  CANCELLED: "AVAILABLE",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        items: { include: { foodItem: true } },
        table: true,
        customer: true,
        payment: true,
        feedback: true,
      },
    });
    if (!order) return jsonError("Order not found", 404);
    return jsonOk(order);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch order", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN", "KITCHEN", "WAITER", "STAFF"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);

    const status = parsed.data.status as OrderStatus;
    const timestampField = statusTimestamps[status];
    const data: Record<string, unknown> = { status };
    if (timestampField) data[timestampField] = new Date();

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        items: { include: { foodItem: true } },
        table: true,
        customer: true,
        payment: true,
      },
    });

    const tableStatus = tableStatusMap[status];
    if (tableStatus) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: tableStatus },
      });
    }

    if (status === "SERVED" && order.payment) {
      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          status:
            order.payment.method === "ONLINE" ? order.payment.status : "PENDING",
        },
      });
    }

    return jsonOk(order);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to update order", 500);
  }
}
