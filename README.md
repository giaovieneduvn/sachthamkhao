# Sách Tham Khảo — website affiliate tự động

Next.js + Prisma (Postgres). Đồng bộ sản phẩm từ Shopee và Tiki qua **Accesstrade**
(mạng affiliate), lưu vào database, hiển thị kèm link affiliate.

> **TikTok Shop chưa được hỗ trợ.** Accesstrade không phân phối dữ liệu sản phẩm
> TikTok Shop. Cần nghiên cứu/đăng ký riêng qua TikTok Shop Affiliate Center nếu
> muốn thêm sau này.

## Kiến trúc

```
app/api/cron/sync   -> gọi Accesstrade datafeed API, upsert vào bảng Product
app/api/products     -> API tìm kiếm sản phẩm đã lưu (q, platform, page)
app/page.tsx         -> trang chủ: form tìm kiếm + lưới sản phẩm (đọc thẳng từ DB)
lib/accesstrade.ts    -> client gọi Accesstrade API
lib/prisma.ts          -> Prisma client singleton
prisma/schema.prisma  -> model Product, SyncLog, SyncCursor
```

Vì Accesstrade **không có tham số tìm theo từ khóa/danh mục thật sự** (đã kiểm
chứng: `q`, `keyword`, `cate` đều không lọc được), cách tiếp cận là: định kỳ kéo
toàn bộ datafeed (phân trang, dùng `SyncCursor` để nhớ trang tiếp theo, tự quay
vòng lại trang 1 khi hết để làm mới dữ liệu) rồi tự tìm kiếm trên dữ liệu đã lưu
bằng Postgres (`ILIKE`/`contains`).

**Giới hạn đã biết:** tìm kiếm hiện phân biệt dấu tiếng Việt (gõ "sach" sẽ không
ra "Sách"). Cải tiến sau: chuẩn hoá bỏ dấu khi lưu + khi tìm (cột phụ
`name_unaccent`, hoặc bật extension `unaccent` của Postgres).

## Thiết lập local

1. Cài dependencies: `npm install`
2. Copy `.env.example` → `.env`, điền:
   - `DATABASE_URL`: chuỗi kết nối Postgres (Render Postgres / Neon / Supabase,
     hoặc chạy nhanh `npx prisma dev`)
   - `ACCESSTRADE_API_KEY`: lấy tại
     https://pub.accesstrade.vn/publisher_profile/personal_info
   - `CRON_SECRET`: một chuỗi ngẫu nhiên bất kỳ, dùng để bảo vệ endpoint sync
3. Chạy migration: `npx prisma migrate dev`
4. Chạy dev server: `npm run dev`
5. Đồng bộ dữ liệu lần đầu:
   ```bash
   curl -X POST "http://localhost:3000/api/cron/sync?pages=5" \
     -H "x-cron-secret: <CRON_SECRET>"
   ```
   `pages` = số trang (100 sản phẩm/trang) kéo về **mỗi sàn** trong một lần gọi.
   Gọi lại nhiều lần (hoặc đặt cron) để kéo hết ~13k sản phẩm Shopee /
   ~53k sản phẩm Tiki hiện có trong tài khoản.

## Database: Supabase thay vì Render Postgres

Dùng Supabase hoàn toàn được (Render free plan không có Postgres free lâu dài,
nên đây là lựa chọn hợp lý). Đã test thực tế và hoạt động tốt với **direct
connection**:

```
DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

Lấy tại **Project Settings → Database → Connection string** (tab "URI", mục
"Direct connection"). Nếu môi trường deploy không hỗ trợ IPv6 (direct connection
của Supabase chạy IPv6 mặc định, dù trong quá trình dev ở đây vẫn kết nối được)
và gặp lỗi timeout, đổi sang **"Session pooler"** (IPv4, dạng
`postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`)
— tuyệt đối không dùng "Transaction pooler" vì nó không giữ session, khiến
`prisma migrate deploy` lỗi advisory lock.

Chứng chỉ TLS của Supabase là self-signed nên `lib/prisma.ts` đã cấu hình
`ssl: { rejectUnauthorized: false }` khi tạo adapter — cần giữ nguyên dòng này.

## Deploy lên Render

1. Push repo lên GitHub (`giaovieneduvn/sachthamkhao`).
2. Trên Render, tạo:
   - **Web Service**, connect với repo GitHub này.
     - Build command: `npm install && npx prisma generate && npm run build`
     - Start command: `npm run start`
     - Env vars: `DATABASE_URL`, `ACCESSTRADE_API_KEY`, `CRON_SECRET`
   - **Cron Job**, cùng repo, chạy định kỳ (vd mỗi giờ):
     ```bash
     curl -X POST "https://<your-app>.onrender.com/api/cron/sync?pages=10" \
       -H "x-cron-secret: $CRON_SECRET"
     ```
3. Sau khi deploy, chạy migration trên DB production một lần:
   `npx prisma migrate deploy` (với `DATABASE_URL` trỏ vào Render Postgres).

## Lưu ý pháp lý

Trang chủ đã có dòng công khai đây là liên kết tiếp thị liên kết (affiliate
disclosure). Không xoá dòng này — đây là yêu cầu tối thiểu khi kinh doanh
affiliate tại Việt Nam.
