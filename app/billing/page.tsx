'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Plan = {
  slug: string
  name: string
  amount: number
  currency: string
  devices: number | null
  features: string[] | null
}

export default function BillingPage() {
  const supabase = createClient()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetch('/api/plans')
      .then(r => r.json())
      .then(j => { if (mounted) setPlans(j?.plans ?? []) })
      .catch(() => { if (mounted) setPlans([]) })
    return () => { mounted = false }
  }, [])

  async function submit(slug: string) {
    try {
      setLoadingSlug(slug)
      setOk(null); setErr(null)
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ plan: slug }), // only the slug; server decides price
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not submit payment')
      setOk('Payment submitted for review. You’ll get access once an admin approves it.')
    } catch (e: any) {
      setErr(e.message || 'Could not submit payment')
    } finally {
      setLoadingSlug(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Choose your plan</h1>
        <p className="text-white/70 mt-1">Pay to OPay, then click “Submit for review”.</p>

        {ok && <div className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">{ok}</div>}
        {err && <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map(p => (
            <div key={p.slug} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="text-3xl font-bold mt-2">₦{p.amount.toLocaleString()}</p>
              <p className="text-white/70 mt-1">
                {p.devices == null ? 'Unlimited devices' : `${p.devices} device${p.devices === 1 ? '' : 's'}`}
              </p>

              {p.features?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/80">
                  {p.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              ) : null}

              <div className="mt-4 text-sm text-white/80">
                <div className="font-medium">OPay Details</div>
                <div className="opacity-90">
                  Account Name: <span className="font-mono">AJIRIN PLACE</span><br />
                  Account Number: <span className="font-mono">1234567890</span><br />
                  Bank: <span className="font-mono">OPay</span>
                </div>
              </div>

              <button
                onClick={() => submit(p.slug)}
                disabled={loadingSlug === p.slug}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-medium shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {loadingSlug === p.slug ? 'Submitting…' : "I’ve paid — Submit for review"}
              </button>
            </div>
          ))}

          {plans.length === 0 && (
            <div className="col-span-full text-white/70">No plans available. Ask an admin to activate plans.</div>
          )}
        </div>
      </div>
    </main>
  )
}
