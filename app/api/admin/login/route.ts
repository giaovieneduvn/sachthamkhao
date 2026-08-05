import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionCookie } from "@/lib/admin-auth";
import { requestOrigin } from "@/lib/request-origin";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const origin = requestOrigin(req);

  if (!checkPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", origin), 303);
  }

  await createSessionCookie();
  return NextResponse.redirect(new URL("/admin", origin), 303);
}
