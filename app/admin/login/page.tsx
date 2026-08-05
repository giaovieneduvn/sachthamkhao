export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <form
        action="/api/admin/login"
        method="POST"
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Đăng nhập Admin
        </h1>
        {error && (
          <p className="mb-3 text-sm text-red-600">Sai mật khẩu, thử lại.</p>
        )}
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          autoFocus
          className="mb-4 w-full rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
