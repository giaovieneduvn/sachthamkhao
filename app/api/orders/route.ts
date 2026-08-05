import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderCode } from "@/lib/bank";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = String(body.ebookSlug ?? "");
  const buyerEmail = String(body.buyerEmail ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }

  const ebook = await prisma.ebook.findUnique({ where: { slug } });
  if (!ebook || !ebook.published) {
    return NextResponse.json({ error: "Không tìm thấy ebook" }, { status: 404 });
  }
  if (Number(ebook.price) <= 0) {
    return NextResponse.json({ error: "Ebook này miễn phí, không cần tạo đơn" }, { status: 400 });
  }

  let order = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    try {
      order = await prisma.order.create({
        data: {
          code: generateOrderCode(),
          ebookId: ebook.id,
          amount: ebook.price,
          buyerEmail,
        },
      });
    } catch {
      // unique code collision (astronomically unlikely) — retry with a new code
    }
  }

  if (!order) {
    return NextResponse.json({ error: "Không tạo được đơn hàng, thử lại" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: order.code });
}
