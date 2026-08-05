import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", req.url), 303);
}
