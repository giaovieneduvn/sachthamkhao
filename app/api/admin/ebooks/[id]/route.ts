import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteEbookFile } from "@/lib/storage";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const ebook = await prisma.ebook.update({
    where: { id },
    data: { published: Boolean(body.published) },
  });

  return NextResponse.json({ ok: true, ebook });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ebook = await prisma.ebook.delete({ where: { id } });
  await deleteEbookFile(ebook.fileKey);

  return NextResponse.json({ ok: true });
}
