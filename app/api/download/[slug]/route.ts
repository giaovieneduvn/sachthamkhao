import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadEbookFile } from "@/lib/storage";
import { CONTENT_TYPE } from "@/lib/file-types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { slug } });

  if (!ebook || !ebook.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (Number(ebook.price) > 0) {
    return NextResponse.json(
      { error: "Ebook này cần mua trước khi tải. Vào trang chi tiết để thanh toán." },
      { status: 402 },
    );
  }

  await prisma.ebook.update({
    where: { id: ebook.id },
    data: { downloadCount: { increment: 1 } },
  });

  const buffer = await downloadEbookFile(ebook.fileKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPE[ebook.fileType],
      "Content-Disposition": `attachment; filename="${ebook.fileKey}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
