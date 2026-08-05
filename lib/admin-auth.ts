import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function expectedToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("Missing ADMIN_PASSWORD env var");
  return crypto.createHmac("sha256", password).update("admin-session").digest("hex");
}

export function checkPassword(input: string): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && input === process.env.ADMIN_PASSWORD;
}

export async function createSessionCookie() {
  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  return Boolean(value) && value === expectedToken();
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
