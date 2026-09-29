import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!/^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/.test(host)) return new NextResponse("Host inválido", { status: 400 });
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost && forwardedHost !== host) return new NextResponse("Host encaminhado inválido", { status: 400 });
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin !== `http://${host}`) return new NextResponse("Origem inválida", { status: 403 });
  }
  const response = NextResponse.next({ request });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (["/app", "/portal", "/account", "/login", "/register", "/verify-email", "/reset-password", "/update-password"].some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
