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
app/api/download/[slug]   -> tăng downloadCount, tạo signed URL Supabase rồi redirect
lib/storage.ts             -> upload/lấy signed URL từ Supabase Storage
lib/extract-text.ts        -> trích đoạn văn bản từ .docx (mammoth) / .pdf (pdf-parse) / .pptx (đọc XML slide)
lib/cover.ts                -> tự sinh ảnh bìa (nền màu + tên sách) bằng sharp, không cần LibreOffice
lib/admin-auth.ts           -> session admin bằng cookie HMAC, không cần DB session
prisma/schema.prisma        -> model Ebook
```

**Vì sao không render bìa thật từ file PDF/PPT:** cần LibreOffice hoặc canvas
native binding, không hợp với môi trường Render free (không có sẵn, build nặng).
Thay vào đó bìa được tự sinh từ tên sách — admin có thể mở rộng sau này để cho
upload ảnh bìa riêng nếu muốn đẹp hơn.

**Thanh toán:** hiện chưa tích hợp — mọi ebook đều tải miễn phí
(`app/api/download/[slug]/route.ts` có ghi chú rõ chỗ cần gắn kiểm tra thanh
toán sau này, chỉ cần thêm điều kiện trước khi tạo signed URL).

## Thiết lập local

1. `npm install`
2. Copy `.env.example` → `.env`, điền:
   - `DATABASE_URL`: chuỗi Postgres (Supabase **Session pooler**, xem ghi chú trong file)
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API (lấy **service_role**, không phải anon key) — dùng để ghi file lên Storage, khác với `DATABASE_URL`
   - `ADMIN_PASSWORD`: mật khẩu tự chọn để vào `/admin`
3. `npx prisma migrate deploy`
4. `npm run dev`
5. Vào `http://localhost:3000/admin`, đăng nhập, upload thử 1 file

Bucket Storage (`ebook-files` riêng tư, `ebook-covers` công khai) được tự tạo ở
lần upload đầu tiên (`ensureBuckets()` trong `lib/storage.ts`), không cần tạo tay.

## Deploy lên Render

Build/Start command giữ nguyên như trước:
- Build: `npm install && npx prisma generate && npm run build`
- Start: `npm run start`
- Env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`

Không cần Cron Job / GitHub Actions nữa (không còn đồng bộ dữ liệu bên ngoài).
