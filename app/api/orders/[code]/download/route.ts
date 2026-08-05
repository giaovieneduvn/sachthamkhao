import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await prisma.order.findUnique({ where: { code }, include: { ebook: true } });

  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "Đơn hàng chưa được thanh toán" }, { status: 402 });
  }

  await prisma.ebook.update({
    where: { id: order.ebookId },
    data: { downloadCount: { increment: 1 } },
  });

  const url = await getSignedDownloadUrl(order.ebook.fileKey, 60);
  return NextResponse.redirect(url);
}
