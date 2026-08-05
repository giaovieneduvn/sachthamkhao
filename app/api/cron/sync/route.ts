import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDatafeedPage, type AccesstradeDomain } from "@/lib/accesstrade";
import type { Platform } from "@/app/generated/prisma/client";

const PLATFORM_DOMAINS: Record<Exclude<Platform, "tiktok">, AccesstradeDomain> = {
  shopee: "shopee.vn",
  tiki: "tiki.vn",
};

const PAGE_SIZE = 100;
const DEFAULT_PAGES_PER_RUN = 5; // ~500 products per platform per invocation

async function syncPlatform(platform: "shopee" | "tiki", pagesToFetch: number) {
  const domain = PLATFORM_DOMAINS[platform];
  const cursor = await prisma.syncCursor.upsert({
    where: { platform },
    create: { platform, nextPage: 1 },
    update: {},
  });

  const log = await prisma.syncLog.create({ data: { platform } });

  let page = cursor.nextPage;
  let fetched = 0;
  let upserted = 0;

  try {
    for (let i = 0; i < pagesToFetch; i++) {
      const result = await fetchDatafeedPage(domain, page, PAGE_SIZE);
      fetched += result.data.length;

      for (const p of result.data) {
        await prisma.product.upsert({
          where: { platform_productId: { platform, productId: p.product_id } },
          create: {
            platform,
            productId: p.product_id,
            name: p.name,
            description: p.desc || null,
            price: p.price ?? null,
            image: p.image || null,
            shopName: p.shop_name || null,
            originalUrl: p.url,
            affLink: p.aff_link,
          },
          update: {
            name: p.name,
            description: p.desc || null,
            price: p.price ?? null,
            image: p.image || null,
            shopName: p.shop_name || null,
            originalUrl: p.url,
            affLink: p.aff_link,
          },
        });
        upserted++;
      }

      const totalPages = Math.ceil(result.total / PAGE_SIZE);
      page = page >= totalPages ? 1 : page + 1; // wrap around to refresh from the top

      if (result.data.length === 0) break;
    }

    await prisma.syncCursor.update({ where: { platform }, data: { nextPage: page } });
    await prisma.syncLog.update({
      where: { id: log.id },
      data: { finishedAt: new Date(), fetched, upserted, status: "success" },
    });

    return { platform, fetched, upserted, nextPage: page };
  } catch (err) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        finishedAt: new Date(),
        fetched,
        upserted,
        status: "failed",
        errorMsg: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pagesParam = req.nextUrl.searchParams.get("pages");
  const pagesToFetch = pagesParam ? parseInt(pagesParam, 10) : DEFAULT_PAGES_PER_RUN;

  const results = [];
  for (const platform of ["shopee", "tiki"] as const) {
    results.push(await syncPlatform(platform, pagesToFetch));
  }

  return NextResponse.json({ ok: true, results });
}
