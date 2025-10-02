import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, device_id } = await req.json().catch(() => ({} as any))
  if (!id && !device_id) return NextResponse.json({ error: 'Missing id or device_id' }, { status: 400 })

  let q = supa
    .from('device_sessions')
    .update({ status: 'kicked' })

  if (id) q = q.eq('id', id)
  if (device_id) q = q.eq('device_id', device_id)

  // owner only (RLS already restricts to user_id = auth.uid())
  const { error } = await q
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
