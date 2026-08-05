import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");

  if (!checkPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url), 303);
  }

  await createSessionCookie();
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
