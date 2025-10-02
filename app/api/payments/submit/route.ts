import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 })
    if (!user)   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { plan, amount, tx_ref, evidence_url, note } = await req.json().catch(() => ({}))
    if (!plan) return NextResponse.json({ error: 'Missing plan' }, { status: 400 })
    const amt = Number(amount)
    if (!amt || Number.isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const payload = {
      user_id: user.id,
      email: user.email ?? null,
      plan,
      amount: Math.round(amt),
      currency: 'NGN',
      provider: 'OPay',
      tx_ref: tx_ref?.toString()?.trim() || null,
      evidence_url: evidence_url?.toString()?.trim() || null,
      note: note?.toString()?.trim() || null,
      status: 'pending' as const,
    }

    const { data, error } = await supabase
      .from('manual_payments')
      .insert(payload)
      .select('id, status, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, payment: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Submit failed' }, { status: 500 })
  }
}
