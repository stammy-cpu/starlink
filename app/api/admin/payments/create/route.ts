import { NextResponse } from 'next/server'
import { createServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()
  const email = session?.user?.email
  if (!email) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // admin check via app_admins table
  const { data: admin } = await supabase
    .from('app_admins')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('manual_payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ rows: data }, { status: 200 })
}
