import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { foodItemSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { safeParseJson } from "@/lib/json";

export async function GET() {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const items = await prisma.foodItem.findMany({
      include: { category: true, variants: true, extras: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(
      items.map((item) => ({
        ...item,
        ingredients: safeParseJson(item.ingredients, []),
      }))
    );
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch items", 500);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error || !session) return error!;

  try {
    const body = await request.json();
    const parsed = foodItemSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return jsonError("No restaurant assigned", 400);

    const { variants, extras } = body;
    const item = await prisma.foodItem.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        categoryId: parsed.data.categoryId,
        isVeg: parsed.data.isVeg,
        prepTime: parsed.data.prepTime,
        isAvailable: parsed.data.isAvailable,
        isFeatured: parsed.data.isFeatured,
        isPopular: parsed.data.isPopular,
        image: parsed.data.image,
        ingredients: JSON.stringify(parsed.data.ingredients ?? []),
        slug: slugify(parsed.data.name),
        restaurantId,
        variants: variants?.length ? { create: variants } : undefined,
        extras: extras?.length ? { create: extras } : undefined,
      },
      include: { variants: true, extras: true, category: true },
    });
    return jsonOk(item, 201);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create food item", 500);
  }
}
