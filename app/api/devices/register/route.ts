import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getDeviceLimit } from '../_limit'

const ACTIVE_WINDOW_MIN = 5

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })
  let { data: { user } } = await supa.auth.getUser()

  // Bearer fallback (if cookies not yet synced)
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

  const now = new Date()
  const body = await req.json().catch(() => ({} as any))
  const device_id = String(body?.device_id || '').trim()
  const device_name = String(body?.device_name || '').trim() || null
  const user_agent = String(body?.user_agent || '').trim() || null
  const steal = !!body?.steal // if true, kick oldest active session to make room

  if (!device_id) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 })

  // Get current limit from plans (∞ for unlimited)
  const limit = await getDeviceLimit(supa as any, user.id)

  // Treat sessions as active if seen within ACTIVE_WINDOW_MIN
  const since = new Date(now.getTime() - ACTIVE_WINDOW_MIN * 60 * 1000).toISOString()

  // Count active sessions
  const { data: actives, error: listErr } = await supa
    .from('device_sessions')
    .select('id, device_id, last_seen, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('last_seen', since)
    .order('last_seen', { ascending: true }) // oldest first
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 400 })

  // If this device already exists, mark it active + touch last_seen
  const existing = actives?.find(a => a.device_id === device_id)
  if (existing) {
    const { error } = await supa
      .from('device_sessions')
      .update({ status: 'active', last_seen: now.toISOString(), device_name, user_agent })
      .eq('user_id', user.id)
      .eq('device_id', device_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, reused: true }, { status: 200 })
  }

  // Enforce limit
  if (Number.isFinite(limit) && actives && actives.length >= limit) {
    if (!steal) {
      return NextResponse.json({
        error: `Device limit reached (${limit}).`,
        can_steal: true,
        active_count: actives.length,
      }, { status: 409 })
    }
    // kick oldest
    const oldest = actives[0]
    const { error: kickErr } = await supa
      .from('device_sessions')
      .update({ status: 'kicked' })
      .eq('id', oldest.id)
    if (kickErr) return NextResponse.json({ error: kickErr.message }, { status: 400 })
  }

  // Upsert (unique per user_id + device_id)
  const { error: upErr } = await supa
    .from('device_sessions')
    .upsert({
      user_id: user.id,
      device_id,
      device_name,
      user_agent,
      status: 'active',
      last_seen: now.toISOString(),
    }, { onConflict: 'user_id,device_id' })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  return NextResponse.json({ ok: true }, { status: 200 })
}
