import type { NextRequest } from "next/server";

// Render (and most reverse proxies) terminate TLS in front of the app and
// forward requests to it over plain HTTP on an internal host/port, so
// `req.url`/`req.nextUrl` reflect that internal address instead of the public
// one. Rebuild the origin from the forwarded headers instead.
export function requestOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}`;
}
