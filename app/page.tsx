import { prisma } from "@/lib/prisma";
import type { Platform, Product } from "@/app/generated/prisma/client";

const PLATFORM_LABEL: Record<Platform, string> = {
  shopee: "Shopee",
  tiki: "Tiki",
  tiktok: "TikTok Shop",
};

function formatPrice(price: unknown) {
  const n = Number(price);
  if (!n) return "";
  return n.toLocaleString("vi-VN") + " đ";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; platform?: string }>;
}) {
  const { q = "", platform } = await searchParams;

  const where = {
    ...(platform && ["shopee", "tiki", "tiktok"].includes(platform)
      ? { platform: platform as Platform }
      : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sách tham khảo
        </h1>

        <form className="mt-6 flex flex-wrap gap-3" action="/">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm theo từ khóa, ví dụ: sách lớp 10..."
            className="min-w-[240px] flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <select
            name="platform"
            defaultValue={platform ?? ""}
            className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">Tất cả sàn</option>
            <option value="shopee">Shopee</option>
            <option value="tiki">Tiki</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-5 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Tìm kiếm
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Bài viết có chứa liên kết tiếp thị liên kết (affiliate). Chúng tôi có thể nhận
          hoa hồng khi bạn mua hàng qua các liên kết này, không phát sinh thêm chi phí
          cho bạn.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p: Product) => (
            <a
              key={p.id}
              href={p.affLink}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image ?? ""}
                alt={p.name}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="line-clamp-2 text-sm text-zinc-800 dark:text-zinc-100">
                  {p.name}
                </span>
                <span className="mt-auto font-semibold text-red-600">
                  {formatPrice(p.price)}
                </span>
                <span className="text-xs uppercase tracking-wide text-zinc-400">
                  {PLATFORM_LABEL[p.platform]}
                  {p.shopName ? ` · ${p.shopName}` : ""}
                </span>
              </div>
            </a>
          ))}
        </div>

        {products.length === 0 && (
          <p className="mt-16 text-center text-zinc-500">
            Chưa có sản phẩm. Chạy đồng bộ dữ liệu ở{" "}
            <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">
              POST /api/cron/sync
            </code>{" "}
            trước.
          </p>
        )}
      </main>
    </div>
  );
}
