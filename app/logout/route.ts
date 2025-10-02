import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

export async function GET(req: Request) {
  const supabase = await createRouteClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/auth', req.url))
}
