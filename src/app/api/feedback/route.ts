import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/api";
import { feedbackSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
    });
    if (!order) return jsonError("Order not found", 404);

    const feedback = await prisma.feedback.upsert({
      where: { orderId: parsed.data.orderId },
      create: {
        orderId: parsed.data.orderId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        customerId: order.customerId,
      },
      update: {
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
      select: { foodItemId: true },
    });

    for (const item of items) {
      const food = await prisma.foodItem.findUnique({
        where: { id: item.foodItemId },
      });
      if (food) {
        const newRating = (food.rating * 0.9 + parsed.data.rating * 0.1);
        await prisma.foodItem.update({
          where: { id: food.id },
          data: { rating: Math.round(newRating * 10) / 10 },
        });
      }
    }

    return jsonOk(feedback, 201);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to submit feedback", 500);
  }
}
