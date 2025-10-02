import { redirect } from 'next/navigation'
import { createServer } from '@/lib/supabase/server'

type Plan = 'free' | 'basic' | 'pro'

function rank(plan: Plan | string | null | undefined) {
  if (plan === 'pro') return 2
  if (plan === 'basic') return 1
  return 0
}

/**
 * Server-side guard for pages/features that require a plan.
 * Usage: await requirePlan('pro')
 */
export async function requirePlan(minPlan: 'basic' | 'pro' = 'basic') {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth?next=' + encodeURIComponent('/'))

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, plan_expires_at')
    .eq('id', session.user.id)
    .single()

  const okRank = rank(profile?.plan as Plan) >= rank(minPlan)
  const notExpired =
    !profile?.plan_expires_at || new Date(profile.plan_expires_at) > new Date()

  if (!okRank || !notExpired) {
    redirect('/pay') // not entitled or expired
  }

  return { session, profile }
}
