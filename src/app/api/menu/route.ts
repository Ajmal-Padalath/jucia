import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/api";
import { safeParseJson } from "@/lib/json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const popular = searchParams.get("popular");

    const restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) return jsonError("Restaurant not found", 404);

    const items = await prisma.foodItem.findMany({
      where: {
        restaurantId: restaurant.id,
        ...(category ? { category: { slug: category } } : {}),
        ...(featured === "true" ? { isFeatured: true } : {}),
        ...(popular === "true" ? { isPopular: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        variants: true,
        extras: true,
      },
      orderBy: [{ isFeatured: "desc" }, { isPopular: "desc" }, { name: "asc" }],
    });

    return jsonOk(
      items.map((item) => ({
        ...item,
        ingredients: safeParseJson(item.ingredients, []),
      }))
    );
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch menu", 500);
  }
}
