import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Single-language mode: English only
const locales = ["en"];
const defaultLocale = "en";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip locale processing for admin routes—they have their own layout
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // If path has a locale prefix (/en or /en/*), strip it
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const cleanPath = pathname.replace(`/${defaultLocale}`, "") || "/";
    const url = new URL(cleanPath, req.url);
    return NextResponse.redirect(url, 301);
  }

  // Strip any other 2-letter locale prefix (redirects /hi, /fr etc. to clean URL)
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (localeMatch) {
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, "") || "/";
    const url = new URL(cleanPath, req.url);
    return NextResponse.redirect(url, 301);
  }

  // No locale in URL → rewrite so [locale] routes match (URL stays clean)
  const url = new URL(`/${defaultLocale}${pathname}`, req.url);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|assets).*)"],
};
