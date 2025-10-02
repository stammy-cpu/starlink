import { NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'
import { adminSupabase } from '@/lib/supabase/admin'

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

export async function POST(req: Request) {
  const supabase = await createRouteClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.redirect(new URL('/auth?next=/admin/payments', req.url))

  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (!allowed.includes((session.user.email || '').toLowerCase())) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const form = await req.formData()
  const id = String(form.get('id') || '')
  const status = String(form.get('status') || '')
  if (!id || !['paid','rejected'].includes(status)) {
    return NextResponse.redirect(new URL('/admin/payments?err=bad_input', req.url))
  }

  const { data: pay } = await adminSupabase
    .from('manual_payments')
    .select('user_id, plan, amount_ngn')
    .eq('id', id)
    .single()

  const { error: updErr } = await adminSupabase
    .from('manual_payments')
    .update({
      status,
      verified_at: new Date().toISOString(),
      verified_by: session.user.id,
    })
    .eq('id', id)
  if (updErr) {
    return NextResponse.redirect(new URL('/admin/payments?err=update_failed', req.url))
  }

  if (status === 'paid' && pay) {
    const now = new Date()
    const expires = addDays(now, 30)
    await adminSupabase
      .from('profiles')
      .update({
        plan: pay.plan || 'basic',
        plan_started_at: now.toISOString(),
        plan_expires_at: expires.toISOString(),
      })
      .eq('id', pay.user_id)
  }

  return NextResponse.redirect(new URL('/admin/payments?ok=1', req.url))
}
