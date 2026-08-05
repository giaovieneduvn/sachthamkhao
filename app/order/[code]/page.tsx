import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildVietQrUrl, BANK_ACCOUNT_NAME, BANK_ACCOUNT_NUMBER, BANK_LABEL } from "@/lib/bank";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await prisma.order.findUnique({ where: { code }, include: { ebook: true } });

  if (!order) notFound();

  const amount = Number(order.amount);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Đơn hàng {order.code}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">{order.ebook.title}</p>

        {order.status === "paid" && order.downloadedAt ? (
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Link tải của đơn này đã được dùng (mỗi đơn chỉ tải được 1 lần để tránh chia sẻ
              link). Nếu cần tải lại, liên hệ người bán.
            </p>
          </div>
        ) : order.status === "paid" ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950">
            <p className="font-medium text-emerald-700 dark:text-emerald-400">
              Đã nhận thanh toán — bạn có thể tải sách ngay. Lưu ý: link chỉ tải được 1 lần.
            </p>
            <a
              href={`/api/orders/${order.code}/download`}
              className="mt-4 inline-block rounded-md bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
            >
              Tải xuống
            </a>
          </div>
        ) : order.status === "cancelled" ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            Đơn hàng đã bị huỷ.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-zinc-600 dark:text-zinc-300">
              Quét mã QR bên dưới bằng app ngân hàng bất kỳ để chuyển khoản, hoặc chuyển khoản
              thủ công theo thông tin phía dưới. Sau khi nhận được tiền, trang này sẽ tự cập
              nhật trạng thái (tải lại trang để kiểm tra).
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildVietQrUrl(amount, order.code)}
              alt="VietQR"
              className="mx-auto w-64 rounded-lg border border-zinc-200 dark:border-zinc-800"
            />
            <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
              <p>
                <span className="text-zinc-500">Ngân hàng:</span> {BANK_LABEL}
              </p>
              <p>
                <span className="text-zinc-500">Số tài khoản:</span> {BANK_ACCOUNT_NUMBER}
              </p>
              <p>
                <span className="text-zinc-500">Chủ tài khoản:</span> {BANK_ACCOUNT_NAME}
              </p>
              <p>
                <span className="text-zinc-500">Số tiền:</span>{" "}
                <strong>{amount.toLocaleString("vi-VN")} đ</strong>
              </p>
              <p>
                <span className="text-zinc-500">Nội dung chuyển khoản:</span>{" "}
                <strong>{order.code}</strong>
              </p>
            </div>
            <p className="text-xs text-zinc-400">
              Lưu ý: ghi đúng nội dung chuyển khoản ở trên để đơn được xác nhận nhanh.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
