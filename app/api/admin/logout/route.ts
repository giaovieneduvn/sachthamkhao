import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/admin-auth";
import { requestOrigin } from "@/lib/request-origin";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", requestOrigin(req)), 303);
}
