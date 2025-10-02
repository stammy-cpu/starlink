import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: admin } = await supa.from('app_admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const slug = (body.slug ?? '').toString().trim().toLowerCase()
  const name = (body.name ?? '').toString().trim()
  const amount = Number(body.amount)
  const features = Array.isArray(body.features) ? body.features : []
  const is_active = !!body.is_active
  const sort_order = Number(body.sort_order) || 0

  if (!slug || !name || !amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data, error } = await supa
    .from('plans')
    .upsert({ slug, name, amount, features, is_active, sort_order }, { onConflict: 'slug' })
    .select('slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, plan: data }, { status: 200 })
}
