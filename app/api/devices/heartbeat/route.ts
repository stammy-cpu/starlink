// app/api/devices/heartbeat/route.ts
import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Throttled heartbeat:
 * - Only updates if last_seen is older than THROTTLE_MS (or null)
 * - Returns { skipped: true } when update is unnecessary
 */
const THROTTLE_MS = 60_000 // 60s

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies })

  // try cookie session first
  let { data: { user } } = await supa.auth.getUser()

  // fallback: Bearer token (from native app, etc.)
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

  const { device_id } = await req.json().catch(() => ({} as any))
  if (!device_id) return NextResponse.json({ error: 'Missing device_id' }, { status: 400 })

  const nowIso = new Date().toISOString()
  const thresholdIso = new Date(Date.now() - THROTTLE_MS).toISOString()

  // Only update if last_seen is NULL OR older than threshold
  const { data, error } = await supa
    .from('device_sessions')
    .update({ last_seen: nowIso })
    .eq('user_id', user.id)
    .eq('device_id', device_id)
    .eq('status', 'active')
    .or(`last_seen.is.null,last_seen.lt.${thresholdIso}`)
    .select('id') // to know if row was touched
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ ok: true, skipped: true }, { status: 200 }) // throttled

  return NextResponse.json({ ok: true }, { status: 200 })
}
