import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BuyButton from "./BuyButton";

function formatPrice(price: unknown) {
  const n = Number(price);
  if (!n) return "Miễn phí";
  return n.toLocaleString("vi-VN") + " đ";
}

export default async function EbookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { slug } });

  if (!ebook || !ebook.published) notFound();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ebook.coverUrl ?? ""}
            alt={ebook.title}
            className="aspect-[3/4] w-48 shrink-0 self-start rounded-lg object-cover"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {ebook.title}
            </h1>
            <p className="mt-1 text-sm uppercase tracking-wide text-zinc-400">
              {ebook.fileType} · {(ebook.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
            </p>
            <p className="mt-3 text-xl font-semibold text-emerald-600">
              {formatPrice(ebook.price)}
            </p>
            {ebook.description && (
              <p className="mt-4 whitespace-pre-line text-zinc-600 dark:text-zinc-300">
                {ebook.description}
              </p>
            )}
            {Number(ebook.price) > 0 ? (
              <BuyButton slug={ebook.slug} />
            ) : (
              <a
                href={`/api/download/${ebook.slug}`}
                className="mt-6 inline-block rounded-md bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
              >
                Tải xuống
              </a>
            )}
            <p className="mt-2 text-xs text-zinc-400">{ebook.downloadCount} lượt tải</p>
          </div>
        </div>
      </main>
    </div>
  );
}
