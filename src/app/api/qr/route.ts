import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { jsonOk, jsonError, requireAuth } from "@/lib/api";

export async function GET(request: Request) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const tableId = searchParams.get("tableId");
    const format = searchParams.get("format") || "png";

    const qrCodes = await prisma.qRCode.findMany({
      where: tableId ? { tableId } : undefined,
      include: { table: true },
      orderBy: { table: { number: "asc" } },
    });

    if (tableId && qrCodes[0]) {
      const dataUrl = await QRCode.toDataURL(qrCodes[0].url, {
        width: 512,
        margin: 2,
        color: { dark: "#18181b", light: "#ffffff" },
      });
      return jsonOk({
        ...qrCodes[0],
        dataUrl,
        format,
      });
    }

    const withImages = await Promise.all(
      qrCodes.map(async (qr) => ({
        ...qr,
        dataUrl: await QRCode.toDataURL(qr.url, {
          width: 400,
          margin: 2,
        }),
      }))
    );

    return jsonOk(withImages);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to generate QR codes", 500);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuth(["ADMIN"]);
  if (error || !session) return error!;

  try {
    const { tableId } = await request.json();
    if (!tableId) return jsonError("tableId is required");

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return jsonError("Table not found", 404);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${appUrl}/menu?table=${table.number}`;

    const qr = await prisma.qRCode.upsert({
      where: { tableId },
      create: {
        tableId,
        restaurantId: session.user.restaurantId!,
        url,
      },
      update: { url },
      include: { table: true },
    });

    const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
    return jsonOk({ ...qr, dataUrl });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create QR code", 500);
  }
}
