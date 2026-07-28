import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";
import { foodItemSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { safeParseJson } from "@/lib/json";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const item = await prisma.foodItem.findUnique({
      where: { id },
      include: { category: true, variants: true, extras: true },
    });
    if (!item) return jsonError("Not found", 404);
    return jsonOk({
      ...item,
      ingredients: safeParseJson(item.ingredients, []),
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to fetch item", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = foodItemSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0].message);

    const data = parsed.data;
    const item = await prisma.foodItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name, slug: slugify(data.name) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.isVeg !== undefined ? { isVeg: data.isVeg } : {}),
        ...(data.prepTime !== undefined ? { prepTime: data.prepTime } : {}),
        ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.isPopular !== undefined ? { isPopular: data.isPopular } : {}),
        ...(data.image !== undefined ? { image: data.image } : {}),
        ...(data.ingredients !== undefined
          ? { ingredients: JSON.stringify(data.ingredients) }
          : {}),
      },
      include: { category: true, variants: true, extras: true },
    });
    return jsonOk(item);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to update item", 500);
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
    await prisma.foodItem.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to delete item", 500);
  }
}
