import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatPrice(price: unknown) {
  const n = Number(price);
  if (!n) return "Miễn phí";
  return n.toLocaleString("vi-VN") + " đ";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  const ebooks = await prisma.ebook.findMany({
    where: {
      published: true,
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 48,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sách tham khảo — Ebook
        </h1>

        <form className="mt-6 flex gap-3" action="/">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm tên sách..."
            className="min-w-[240px] flex-1 rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-5 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {ebooks.map((e) => (
            <Link
              key={e.id}
              href={`/ebook/${e.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.coverUrl ?? ""}
                alt={e.title}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
              />
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="line-clamp-2 text-sm text-zinc-800 dark:text-zinc-100">
                  {e.title}
                </span>
                <span className="mt-auto text-sm font-semibold text-emerald-600">
                  {formatPrice(e.price)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {ebooks.length === 0 && (
          <p className="mt-16 text-center text-zinc-500">Chưa có ebook nào được đăng.</p>
        )}
      </main>
    </div>
  );
}
