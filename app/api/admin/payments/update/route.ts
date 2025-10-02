import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })

  // Auth user
  const { data: { user }, error: uErr } = await supa.auth.getUser()
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 401 })
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Must be admin
  const { data: admin } = await supa
    .from('app_admins')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Payload
  const { id, action } = await req.json().catch(() => ({}))
  if (!id || !['approve','reject'].includes(String(action))) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  const { data, error } = await supa
    .from('manual_payments')
    .update({
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id,status,reviewed_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true, payment: data }, { status: 200 })
}
