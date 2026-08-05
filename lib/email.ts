import { Resend } from "resend";

const FROM_ADDRESS = "Sách Tham Khảo <no-reply@sachthamkhao.vn>";

let cached: Resend | null = null;

function resend() {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY env var");
  cached = new Resend(apiKey);
  return cached;
}

export async function sendPaymentConfirmedEmail(params: {
  to: string;
  ebookTitle: string;
  orderCode: string;
  orderUrl: string;
}) {
  const { to, ebookTitle, orderCode, orderUrl } = params;

  await resend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Đơn hàng ${orderCode} đã thanh toán — tải sách của bạn`,
    html: `
      <p>Chào bạn,</p>
      <p>Chúng tôi đã nhận được thanh toán cho đơn hàng <strong>${orderCode}</strong> (${ebookTitle}).</p>
      <p><a href="${orderUrl}">Bấm vào đây để tải sách</a></p>
      <p style="color:#666;font-size:13px">Lưu ý: link chỉ tải được 1 lần. Nếu tải lỗi, liên hệ lại để được cấp lại lượt tải.</p>
    `,
  });
}
