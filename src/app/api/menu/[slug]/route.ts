import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError } from "@/lib/api";
import { safeParseJson } from "@/lib/json";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await prisma.foodItem.findFirst({
      where: { slug },
      include: {
        category: true,
        variants: true,
        extras: true,
      },
    });
    if (!item) return jsonError("Item not found", 404);
    return jsonOk({
      ...item,
      ingredients: safeParseJson(item.ingredients, []),
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch item", 500);
  }
}
