import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();
    if (!code) return jsonError("Coupon code required");

    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) return jsonError("Restaurant not found", 404);

    const coupon = await prisma.coupon.findFirst({
      where: {
        restaurantId: restaurant.id,
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) return jsonError("Invalid coupon code");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return jsonError("Coupon expired");
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return jsonError("Coupon usage limit reached");
    }
    if (subtotal < coupon.minOrder) {
      return jsonError(`Minimum order of ${coupon.minOrder} required`);
    }

    const discount =
      coupon.discountType === "PERCENT"
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;

    return jsonOk({
      code: coupon.code,
      discount: Math.round(discount * 100) / 100,
      description: coupon.description,
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to validate coupon", 500);
  }
}
