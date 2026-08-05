import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ebooks = await prisma.ebook.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ebooks });
}
