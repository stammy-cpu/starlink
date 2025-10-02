import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: Request) {
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

  // Optional status filter (?status=pending|approved|rejected)
  const url = new URL(req.url)
  const status = url.searchParams.get('status') || undefined

  let query = supa
    .from('manual_payments')
    .select('id,user_id,email,plan,amount,currency,provider,tx_ref,evidence_url,note,status,reviewed_by,reviewed_at,created_at')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ rows: data ?? [] }, { status: 200 })
}
