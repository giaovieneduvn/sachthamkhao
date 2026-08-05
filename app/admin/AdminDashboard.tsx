"use client";

import { useEffect, useState, type FormEvent } from "react";

interface EbookRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  fileType: string;
  fileSizeBytes: number;
  coverUrl: string | null;
  price: string;
  published: boolean;
  downloadCount: number;
}

function formatSize(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function AdminDashboard() {
  const [ebooks, setEbooks] = useState<EbookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function loadEbooks() {
    setLoading(true);
    const res = await fetch("/api/admin/ebooks");
    const data = await res.json();
    setEbooks(data.ebooks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadEbooks();
  }, []);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (!(formData.get("file") as File)?.size) {
      setUploadError("Chọn file trước đã.");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload thất bại");
      form.reset();
      await loadEbooks();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }

  async function togglePublished(ebook: EbookRow) {
    await fetch(`/api/admin/ebooks/${ebook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !ebook.published }),
    });
    await loadEbooks();
  }

  async function remove(ebook: EbookRow) {
    if (!confirm(`Xoá "${ebook.title}"? Không thể hoàn tác.`)) return;
    await fetch(`/api/admin/ebooks/${ebook.id}`, { method: "DELETE" });
    await loadEbooks();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Quản lý Ebook</h1>
        <form action="/api/admin/logout" method="POST">
          <button className="text-sm text-zinc-500 underline">Đăng xuất</button>
        </form>
      </div>

      <form
        onSubmit={handleUpload}
        className="mb-10 space-y-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
      >
        <h2 className="font-medium">Đăng ebook mới</h2>
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,.pptx"
          className="block w-full text-sm"
          required
        />
        <input
          type="text"
          name="title"
          placeholder="Tên sách (để trống = lấy theo tên file)"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <textarea
          name="description"
          placeholder="Mô tả (để trống = tự trích từ nội dung file)"
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="number"
          name="price"
          placeholder="Giá (0 = miễn phí)"
          defaultValue={0}
          min={0}
          className="w-40 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {uploading ? "Đang tải lên..." : "Đăng"}
        </button>
      </form>

      <h2 className="mb-3 font-medium">Danh sách ({ebooks.length})</h2>
      {loading ? (
        <p className="text-zinc-500">Đang tải...</p>
      ) : (
        <div className="space-y-3">
          {ebooks.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={e.coverUrl ?? ""} alt={e.title} className="h-20 w-16 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="text-xs text-zinc-500">
                  {e.fileType.toUpperCase()} · {formatSize(e.fileSizeBytes)} ·{" "}
                  {Number(e.price) > 0 ? `${Number(e.price).toLocaleString("vi-VN")} đ` : "Miễn phí"} ·{" "}
                  {e.downloadCount} lượt tải
                </p>
                <a
                  href={`/ebook/${e.slug}`}
                  target="_blank"
                  className="text-xs text-blue-600 underline"
                >
                  Xem trang công khai
                </a>
              </div>
              <button
                onClick={() => togglePublished(e)}
                className={`rounded-md px-3 py-1.5 text-xs ${
                  e.published
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {e.published ? "Đang hiện" : "Đang ẩn"}
              </button>
              <button
                onClick={() => remove(e)}
                className="rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-600 dark:bg-red-900/20"
              >
                Xoá
              </button>
            </div>
          ))}
          {ebooks.length === 0 && <p className="text-zinc-500">Chưa có ebook nào.</p>}
        </div>
      )}
    </div>
  );
}
