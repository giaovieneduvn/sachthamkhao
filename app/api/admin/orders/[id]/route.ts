import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmedEmail } from "@/lib/email";
import { requestOrigin } from "@/lib/request-origin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.allowRedownload) {
    const order = await prisma.order.update({ where: { id }, data: { downloadedAt: null } });
    return NextResponse.json({ ok: true, order });
  }

  const status = body.status;
  if (!["pending", "paid", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status, paidAt: status === "paid" ? new Date() : null },
    include: { ebook: true },
  });

  let emailError: string | undefined;
  if (status === "paid" && order.buyerEmail) {
    try {
      await sendPaymentConfirmedEmail({
        to: order.buyerEmail,
        ebookTitle: order.ebook.title,
        orderCode: order.code,
        orderUrl: new URL(`/order/${order.code}`, requestOrigin(req)).toString(),
      });
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Gửi email thất bại";
    }
  }

  return NextResponse.json({ ok: true, order, emailError });
}
