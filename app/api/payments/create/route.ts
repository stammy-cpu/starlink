import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/** Normalize strings for loose matching (slug, name, etc.) */
function norm(s: unknown) {
  return typeof s === 'string'
    ? s.trim().toLowerCase().replace(/[\s_-]+/g, '') // remove spaces, hyphens, underscores
    : ''
}

export async function POST(req: Request) {
  try {
    // 1) Prefer cookie session (SSR-safe)
    const supa = createRouteHandlerClient({ cookies })
    let { data: { user } } = await supa.auth.getUser()

    // 2) Fallback: Authorization: Bearer <access_token>
    if (!user) {
      const hdrs = await headers()
      const authHeader = hdrs.get('authorization') ?? ''
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
      if (token) {
        const srv = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const r = await srv.auth.getUser(token)
        user = r.data.user ?? null
      }
    }

    if (!user) return NextResponse.json({ error: 'Auth session missing' }, { status: 401 })

    // 3) Read incoming "plan" (can be slug or display name)
    let body: any = {}
    try { body = await req.json() } catch {}
    const planInput =
      body?.plan ??
      new URL(req.url).searchParams.get('plan') ??
      ''

    const planKey = norm(planInput)
    if (!planKey) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    // 4) Fetch ACTIVE plans from DB (RLS allows anon/auth for active plans)
    const { data: plans, error: pErr } = await supa
      .from('plans')
      .select('slug,name,amount,currency,is_active')
      .eq('is_active', true)

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })
    if (!plans || plans.length === 0) {
      return NextResponse.json({ error: 'No active plans configured' }, { status: 400 })
    }

    // 5) Build a lookup map by normalized slug + normalized name
    const byKey = new Map<string, { slug: string; name: string; amount: number; currency: string }>()
    for (const p of plans) {
      byKey.set(norm(p.slug), { slug: p.slug, name: p.name, amount: p.amount, currency: p.currency || 'NGN' })
      byKey.set(norm(p.name), { slug: p.slug, name: p.name, amount: p.amount, currency: p.currency || 'NGN' })
    }

    const matched = byKey.get(planKey)
    if (!matched) {
      // Helpfully report the valid options to the client
      const valid = plans.map(p => p.slug).join(', ')
      return NextResponse.json({ error: `Plan not available. Valid options: ${valid}` }, { status: 400 })
    }

    // 6) Insert manual payment with server-fixed amount
    const { data, error } = await supa
      .from('manual_payments')
      .insert({
        user_id: user.id,
        email: user.email ?? null,
        plan: matched.slug,            // store canonical slug
        amount: matched.amount,        // NGN integer from DB (immutable)
        currency: matched.currency || 'NGN',
        provider: 'OPay',
        tx_ref: body?.tx_ref?.toString()?.trim() || null,
        evidence_url: body?.evidence_url?.toString()?.trim() || null,
        note: body?.note?.toString()?.trim() || null,
        status: 'pending',
      })
      .select('id, status, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, payment: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Submit failed' }, { status: 500 })
  }
}
