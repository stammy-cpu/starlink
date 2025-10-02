'use client'

import { useEffect, useState } from 'react'

type Row = {
  id: string
  user_id: string
  email: string | null
  plan: string
  amount: number
  currency: string
  provider: string
  tx_ref: string | null
  evidence_url: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

const tabs = ['pending', 'approved', 'rejected'] as const

export default function AdminPaymentsPage() {
  const [active, setActive] = useState<(typeof tabs)[number]>('pending')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setErr(null)
    try {
      const r = await fetch(`/api/admin/payments?status=${active}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Failed to load')
      setRows(j.rows || [])
    } catch (e: any) {
      setErr(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [active])

  async function act(id: string, action: 'approve' | 'reject') {
    const r = await fetch('/api/admin/payments/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const j = await r.json()
    if (!r.ok) {
      alert(j?.error || 'Update failed')
      return
    }
    load()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Manual Payments (Admin)</h1>

        <div className="mt-4 flex gap-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`rounded-xl px-3 py-1 text-sm ${
                active === t
                  ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {err && <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">{err}</div>}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Provider</th>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="px-4 py-6 text-white/60" colSpan={8}>Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td className="px-4 py-6 text-white/60" colSpan={8}>No {active} payments</td></tr>
              )}
              {!loading && rows.map(r => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.email || r.user_id}</td>
                  <td className="px-4 py-3">{r.plan}</td>
                  <td className="px-4 py-3">₦{Number(r.amount).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.provider}</td>
                  <td className="px-4 py-3">{r.tx_ref || <span className="opacity-60">—</span>}</td>
                  <td className="px-4 py-3 max-w-[20rem] truncate" title={r.note || ''}>{r.note || <span className="opacity-60">—</span>}</td>
                  <td className="px-4 py-3 space-x-2">
                    {active === 'pending' ? (
                      <>
                        <button onClick={() => act(r.id, 'approve')} className="rounded bg-emerald-600/80 px-3 py-1 text-xs hover:opacity-90">Approve</button>
                        <button onClick={() => act(r.id, 'reject')} className="rounded bg-red-600/80 px-3 py-1 text-xs hover:opacity-90">Reject</button>
                      </>
                    ) : (
                      <span className="text-white/70">{r.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  )
}
