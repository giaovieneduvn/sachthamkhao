import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadEbookFile } from "@/lib/storage";
import { CONTENT_TYPE } from "@/lib/file-types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await prisma.order.findUnique({ where: { code }, include: { ebook: true } });

  if (!order || order.status !== "paid") {
    return NextResponse.json({ error: "Đơn hàng chưa được thanh toán" }, { status: 402 });
  }

  if (order.downloadedAt) {
    return NextResponse.json(
      {
        error:
          "Link tải này đã được dùng. Mỗi đơn hàng chỉ tải được 1 lần để tránh chia sẻ link. Liên hệ người bán nếu cần tải lại.",
      },
      { status: 410 },
    );
  }

  // Atomic claim: only the first request that still finds downloadedAt = null wins,
  // so two concurrent hits (double-click, retry) can't both slip through.
  const claim = await prisma.order.updateMany({
    where: { id: order.id, downloadedAt: null },
    data: { downloadedAt: new Date() },
  });

  if (claim.count === 0) {
    return NextResponse.json(
      { error: "Link tải này đã được dùng. Liên hệ người bán nếu cần tải lại." },
      { status: 410 },
    );
  }

  await prisma.ebook.update({
    where: { id: order.ebookId },
    data: { downloadCount: { increment: 1 } },
  });

  const buffer = await downloadEbookFile(order.ebook.fileKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPE[order.ebook.fileType],
      "Content-Disposition": `attachment; filename="${order.ebook.fileKey}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
