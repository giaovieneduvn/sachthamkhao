import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteEbookFile } from "@/lib/storage";
import type { Prisma } from "@/app/generated/prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: Prisma.EbookUpdateInput = {};

  if (typeof body.published === "boolean") data.published = body.published;
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.description === "string") data.description = body.description.trim() || null;
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Giá không hợp lệ" }, { status: 400 });
    }
    data.price = price;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Không có gì để cập nhật" }, { status: 400 });
  }

  const ebook = await prisma.ebook.update({ where: { id }, data });
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
