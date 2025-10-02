import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const wantAll = url.searchParams.get('all') === '1'
  const supa = createRouteHandlerClient({ cookies })

  if (!wantAll) {
    const { data, error } = await supa
      .from('plans')
      .select('slug,name,amount,currency,devices,features,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ plans: data ?? [] }, { status: 200 })
  }

  // admin-only view for all plans
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { data: admin } = await supa.from('app_admins').select('email').eq('email', user.email).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supa
    .from('plans')
    .select('slug,name,amount,currency,devices,features,sort_order,is_active')
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ plans: data ?? [] }, { status: 200 })
}
