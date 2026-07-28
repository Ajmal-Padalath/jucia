import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) return jsonError("Restaurant not found", 404);

    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      include: { _count: { select: { foodItems: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return jsonOk(categories);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch categories", 500);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error || !session) return error!;

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);

    const restaurantId = session.user.restaurantId;
    if (!restaurantId) return jsonError("No restaurant assigned", 400);

    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        slug: slugify(parsed.data.name),
        restaurantId,
      },
    });
    return jsonOk(category, 201);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create category", 500);
  }
}
