import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/api";
import { checkoutSchema } from "@/lib/validations";
import { generateOrderNumber } from "@/lib/utils";
import { isStripeEnabled, stripe } from "@/lib/stripe";
import type { PaymentMethod } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tableId = searchParams.get("tableId");
    const search = searchParams.get("search");
    const orderId = searchParams.get("id");

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderId }, { orderNumber: orderId }],
        },
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
    }

    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(tableId ? { tableId } : {}),
        ...(search
          ? {
              OR: [
                { orderNumber: { contains: search } },
                { customer: { name: { contains: search } } },
                { table: { number: isNaN(Number(search)) ? undefined : Number(search) } },
              ],
            }
          : {}),
      },
      include: {
        items: { include: { foodItem: true } },
        table: true,
        customer: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return jsonOk(orders);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch orders", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, ...checkoutData } = body;
    const parsed = checkoutSchema.safeParse(checkoutData);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);
    if (!items?.length) return jsonError("Cart is empty");

    const table = await prisma.table.findUnique({
      where: { id: parsed.data.tableId },
      include: { restaurant: true },
    });
    if (!table) return jsonError("Table not found", 404);

    const restaurant = table.restaurant;
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const food = await prisma.foodItem.findUnique({ where: { id: item.foodItemId } });
      if (!food || !food.isAvailable) {
        return jsonError(`Item unavailable: ${item.name || item.foodItemId}`);
      }
      const extrasTotal =
        item.selectedExtras?.reduce((s: number, e: { price: number }) => s + e.price, 0) ?? 0;
      const unitPrice = item.unitPrice ?? food.price;
      const totalPrice = (unitPrice + extrasTotal) * item.quantity;
      subtotal += totalPrice;
      orderItemsData.push({
        foodItemId: food.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        spiceLevel: item.spiceLevel,
        size: item.size,
        selectedExtras: JSON.stringify(item.selectedExtras ?? []),
        specialInstructions: item.specialInstructions,
      });
    }

    let discount = 0;
    if (parsed.data.couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          restaurantId: restaurant.id,
          code: parsed.data.couponCode.toUpperCase(),
          isActive: true,
        },
      });
      if (coupon && subtotal >= coupon.minOrder) {
        discount =
          coupon.discountType === "PERCENT"
            ? (subtotal * coupon.discountValue) / 100
            : coupon.discountValue;
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const taxable = Math.max(subtotal - discount, 0);
    const taxAmount = taxable * restaurant.taxRate;
    const serviceCharge = taxable * restaurant.serviceRate;
    const total = taxable + taxAmount + serviceCharge;
    const estimatedTime = Math.max(
      ...orderItemsData.map((i) => {
        const food = items.find((x: { foodItemId: string }) => x.foodItemId === i.foodItemId);
        return (food?.prepTime ?? 15) * i.quantity;
      }),
      15
    );

    let customer = null;
    if (parsed.data.name) {
      customer = await prisma.customer.create({
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone || null,
        },
      });
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: "PENDING",
        specialRequest: parsed.data.specialRequest,
        subtotal,
        taxAmount,
        serviceCharge,
        discount,
        total,
        estimatedTime,
        couponCode: parsed.data.couponCode?.toUpperCase(),
        tableId: table.id,
        restaurantId: restaurant.id,
        customerId: customer?.id,
        items: { create: orderItemsData },
        payment: {
          create: {
            method: parsed.data.paymentMethod as PaymentMethod,
            status: parsed.data.paymentMethod === "ONLINE" ? "PENDING" : "PENDING",
            amount: total,
          },
        },
      },
      include: {
        items: { include: { foodItem: true } },
        table: true,
        customer: true,
        payment: true,
      },
    });

    await prisma.table.update({
      where: { id: table.id },
      data: { status: "OCCUPIED" },
    });

    let checkoutUrl: string | null = null;
    if (parsed.data.paymentMethod === "ONLINE" && isStripeEnabled() && stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: restaurant.currency.toLowerCase(),
              product_data: {
                name: `Order ${order.orderNumber}`,
                description: `Table ${table.number}`,
              },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/${order.id}?paid=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?table=${table.number}`,
        metadata: { orderId: order.id },
      });
      checkoutUrl = session.url;
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { stripeSessionId: session.id },
      });
    }

    return jsonOk({ order, checkoutUrl }, 201);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to place order", 500);
  }
}
