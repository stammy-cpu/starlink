// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Only refresh auth where it matters
  const path = req.nextUrl.pathname
  const needsAuthRefresh =
    path.startsWith('/api') ||
    path === '/' ||
    path.startsWith('/admin') ||
    path.startsWith('/pay') ||
    path.startsWith('/auth') ||
    path.startsWith('/status')

  if (needsAuthRefresh) {
    const supabase = createMiddlewareClient({ req, res })
    await supabase.auth.getSession()
  }

  return res
}

// ✅ Valid matcher (no capturing groups, no fancy ext patterns)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|images|fonts).*)',
  ],
}
