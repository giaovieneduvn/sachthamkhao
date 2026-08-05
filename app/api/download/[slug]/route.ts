import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { slug } });

  if (!ebook || !ebook.published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Payment isn't wired up yet — every ebook is currently free to download.
  // Once checkout exists, gate this on a verified purchase before signing the URL.
  await prisma.ebook.update({
    where: { id: ebook.id },
    data: { downloadCount: { increment: 1 } },
  });

  const url = await getSignedDownloadUrl(ebook.fileKey, 60);
  return NextResponse.redirect(url);
}
