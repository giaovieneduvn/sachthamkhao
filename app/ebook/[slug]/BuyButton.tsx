"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function BuyButton({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleBuy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ebookSlug: slug, buyerEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Không tạo được đơn hàng");
      router.push(`/order/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleBuy} className="mt-6 space-y-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email nhận link tải sau khi thanh toán"
        className="w-full max-w-sm rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={loading}
        className="block rounded-md bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Đang tạo đơn..." : "Mua ngay (chuyển khoản)"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
