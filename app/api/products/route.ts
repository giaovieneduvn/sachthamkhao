import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Platform } from "@/app/generated/prisma/client";

const VALID_PLATFORMS = ["shopee", "tiki", "tiktok"];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const platformParam = searchParams.get("platform");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(48, Math.max(1, parseInt(searchParams.get("pageSize") ?? "24", 10)));

  const platform =
    platformParam && VALID_PLATFORMS.includes(platformParam) ? (platformParam as Platform) : undefined;

  const where = {
    ...(platform ? { platform } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
