import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: admin } = await supa.from('app_admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { slug, is_active } = await req.json().catch(() => ({}))
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

  const { data, error } = await supa
    .from('plans')
    .update({ is_active: !!is_active })
    .eq('slug', slug)
    .select('slug,is_active')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, plan: data }, { status: 200 })
}
