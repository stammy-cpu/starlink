import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'

  const supabase = await createRouteClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('exchange error', error)
      return NextResponse.redirect(new URL('/auth?error=callback', req.url))
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
