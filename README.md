# Sách Tham Khảo — Ebook Store

Next.js + Prisma (Postgres) + Supabase Storage. Trang admin cho phép upload file
PDF/Word/PPT, hệ thống tự trích văn bản làm mô tả, tự tạo ảnh bìa, và đăng lên
trang công khai để tải xuống.

## Kiến trúc

```
app/admin/                -> trang quản trị (đăng nhập bằng mật khẩu, upload, bật/tắt/xoá ebook)
app/api/admin/upload      -> nhận file, trích văn bản, tạo bìa, upload Storage, lưu DB
app/api/admin/ebooks[/id] -> API list/toggle publish/xoá cho trang admin
app/                       -> trang chủ danh sách ebook (chỉ hiện published)
app/ebook/[slug]          -> trang chi tiết 1 ebook
app/api/download/[slug]   -> tải ebook miễn phí: server tải file từ Supabase rồi trả thẳng nội dung (không redirect)
app/api/orders            -> tạo đơn hàng (yêu cầu email người mua)
app/order/[code]          -> trang hiện VietQR + trạng thái đơn, nút tải khi đã thanh toán
app/api/orders/[code]/download -> tải file cho đơn đã thanh toán, chỉ dùng được đúng 1 lần
lib/storage.ts             -> upload lên / tải file về từ Supabase Storage (không dùng signed URL cho client)
lib/extract-text.ts        -> trích đoạn văn bản từ .docx (mammoth) / .pdf (pdf-parse) / .pptx (đọc XML slide)
lib/cover.ts                -> tự sinh ảnh bìa (nền màu + tên sách) bằng sharp, không cần LibreOffice
lib/admin-auth.ts           -> session admin bằng cookie HMAC, không cần DB session
lib/bank.ts                 -> thông tin ngân hàng + tạo URL ảnh VietQR
lib/email.ts                 -> gửi email báo thanh toán thành công qua Resend
prisma/schema.prisma        -> model Ebook, Order
```

**Vì sao không redirect sang URL Supabase khi tải file:** URL ký (signed URL) của
Supabase có hiệu lực độc lập với app trong khoảng thời gian hiệu lực của nó —
ai có được URL đó (từ thanh địa chỉ, lịch sử trình duyệt) trong lúc còn hạn đều
tải được, khiến giới hạn "1 lần/đơn" của app trở nên vô nghĩa. Nên các route
tải đều tự tải file bằng `service_role` key rồi trả thẳng nội dung, trình duyệt
chỉ thấy URL của app, không có link nào để chia sẻ.

**Vì sao không render bìa thật từ file PDF/PPT:** cần LibreOffice hoặc canvas
native binding, không hợp với môi trường Render free (không có sẵn, build nặng).
Thay vào đó bìa được tự sinh từ tên sách — admin có thể mở rộng sau này để cho
upload ảnh bìa riêng nếu muốn đẹp hơn.

**Thanh toán:** chuyển khoản ngân hàng qua VietQR, xác nhận thủ công (không
dùng cổng thanh toán/API ngân hàng). Ebook giá 0 vẫn tải trực tiếp; ebook có
giá thì khách phải nhập email + tạo đơn (`POST /api/orders`) → trang
`/order/[code]` hiện QR + thông tin chuyển khoản → admin bấm "Xác nhận đã nhận
tiền" trên `/admin` sau khi tự kiểm tra sao kê → hệ thống tự gửi email chứa
link `/order/[code]` cho khách, đồng thời trang đó cũng tự cập nhật cho phép
tải. Link tải chỉ dùng được **đúng 1 lần** (chặn atomic ở
`app/api/orders/[code]/download`) — admin có thể bấm "Cho phép tải lại" trên
`/admin` nếu khách tải lỗi. `app/api/download/[slug]` (tải trực tiếp cho ebook
miễn phí) chặn hẳn nếu ebook có giá > 0, tránh vòng qua thanh toán bằng cách
đoán URL.

`lib/bank.ts` chứa số tài khoản/tên chủ khoản Vietcombank (hardcode, không phải
secret) và hàm dựng URL ảnh VietQR qua `img.vietqr.io`.

**Email:** gửi qua Resend (`lib/email.ts`), domain gửi (`sachthamkhao.vn`,
đổi trong `FROM_ADDRESS`) phải đã verify trên Resend dashboard trước. Nếu gửi
lỗi, việc xác nhận thanh toán vẫn thành công — chỉ báo lỗi email riêng
(`emailError` trong response, admin thấy alert) để không chặn luồng chính.

## Thiết lập local

1. `npm install`
2. Copy `.env.example` → `.env`, điền:
   - `DATABASE_URL`: chuỗi Postgres (Supabase **Session pooler**, xem ghi chú trong file)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API (lấy **service_role**, không phải anon key) — dùng để ghi file lên Storage, khác với `DATABASE_URL`
   - `ADMIN_PASSWORD`: mật khẩu tự chọn để vào `/admin`
   - `RESEND_API_KEY`: Resend Dashboard → API Keys (domain gửi phải verify trước)
3. `npx prisma migrate deploy`
4. `npm run dev`
5. Vào `http://localhost:3000/admin`, đăng nhập, upload thử 1 file

Bucket Storage (`ebook-files` riêng tư, `ebook-covers` công khai) được tự tạo ở
lần upload đầu tiên (`ensureBuckets()` trong `lib/storage.ts`), không cần tạo tay.

## Deploy lên Render

Build/Start command giữ nguyên như trước:
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npm run start`
- Env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `RESEND_API_KEY`

Không cần Cron Job / GitHub Actions nữa (không còn đồng bộ dữ liệu bên ngoài).
