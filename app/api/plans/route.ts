import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data, error } = await supabase
    .from('plans')
    .select('slug,name,amount,currency,features,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('amount', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ plans: data ?? [] }, { status: 200 })
}
