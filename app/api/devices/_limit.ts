import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve device limit from the user's **active subscription**.
 * Falls back to matching plan by slug first, then by amount.
 * If nothing matches, default to 1 device.
 * If the plan has devices = null => unlimited.
 */
export async function getDeviceLimit(supa: SupabaseClient, userId: string) {
  const now = new Date()

  // 1) Get the latest "active" (or "trialing") subscription for this user
  const { data: sub, error: subErr } = await supa
    .from('subscriptions')
    .select(
      // include multiple fields so we can match flexibly
      'plan, plan_slug, slug, amount, price, currency, status, current_period_end, ends_at, cancel_at, cancelled_at, created_at'
    )
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (subErr) throw new Error(subErr.message)

  // No sub? -> default limit
  if (!sub) return 1

  // time-based validity checks if timestamps exist
  const timeOK =
    (!sub.current_period_end || new Date(sub.current_period_end) > now) &&
    (!sub.ends_at || new Date(sub.ends_at) > now) &&
    (!sub.cancel_at || new Date(sub.cancel_at) > now) &&
    !sub.cancelled_at

  if (!timeOK) return 1

  // 2) Try to match plan by slug/name from the subscription row
  const slugCandidate = [sub.plan_slug, sub.slug, sub.plan]
    .map(v => (typeof v === 'string' ? v.trim().toLowerCase().replace(/\s+/g, '-').replace(/_{1,}/g, '-') : ''))
    .find(Boolean)

  if (slugCandidate) {
    const { data: bySlug } = await supa
      .from('plans')
      .select('devices, is_active')
      .eq('slug', slugCandidate)
      .maybeSingle()
    if (bySlug && bySlug.is_active !== false) {
      return bySlug.devices ?? Infinity
    }
  }

  // 3) Fallback: match by amount (normalize to integer NGN)
  const amt =
    typeof sub.amount === 'number'
      ? Math.round(sub.amount)
      : typeof sub.price === 'number'
      ? Math.round(sub.price)
      : null

  if (amt !== null) {
    const { data: byAmt } = await supa
      .from('plans')
      .select('devices, is_active')
      .eq('amount', amt)
      .eq('is_active', true)
      .maybeSingle()
    if (byAmt) return byAmt.devices ?? Infinity
  }

  // 4) Default if nothing matches
  return 1
}
