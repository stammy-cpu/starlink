// app/api/auth/session/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  try {
    const { access_token, refresh_token } = await req.json().catch(() => ({} as any))

    // Guard against missing tokens
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // ✅ Check existing session before hitting setSession
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token === access_token) {
      // Already valid session → no need to call setSession again
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 })
    }

    // ✅ Only set session if needed
    const { error } = await supabase.auth.setSession({ access_token, refresh_token })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 })
  }
}
