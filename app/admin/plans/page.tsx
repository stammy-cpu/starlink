'use client'

import { useEffect, useState } from 'react'

type Plan = {
  slug: string
  name: string
  amount: number
  currency: string
  features: string[] | null
  is_active: boolean
  sort_order: number | null
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Plan>>({ slug: '', name: '', amount: 0, features: [], sort_order: 0, is_active: true })

  async function load() {
    setErr(null)
    const res = await fetch('/api/plans?all=1') // admin can see all
    const data = await res.json()
    if (!res.ok) { setErr(data?.error || 'Failed to load plans'); return }
    setPlans(data.plans || [])
  }

  useEffect(() => { load() }, [])

  async function upsertPlan(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr(null)
    const res = await fetch('/api/admin/plans/upsert', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: form.slug?.toString().trim().toLowerCase(),
        name: form.name,
        amount: Number(form.amount),
        features: form.features,
        is_active: !!form.is_active,
        sort_order: Number(form.sort_order) || 0,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(data?.error || 'Save failed'); return }
    setForm({ slug: '', name: '', amount: 0, features: [], sort_order: 0, is_active: true })
    load()
  }

  async function toggle(slug: string, is_active: boolean) {
    const res = await fetch('/api/admin/plans/toggle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, is_active }),
    })
    const data = await res.json()
    if (!res.ok) { alert(data?.error || 'Toggle failed'); return }
    load()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">Plans (Admin)</h1>
        {err && <div className="mt-3 rounded border border-red-400/40 bg-red-500/10 p-3 text-red-200 text-sm">{err}</div>}

        <form onSubmit={upsertPlan} className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 sm:grid-cols-2">
          <input placeholder="slug (e.g. pro-team)" value={form.slug ?? ''} onChange={e=>setForm(f=>({ ...f, slug: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"/>
          <input placeholder="name" value={form.name ?? ''} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"/>
          <input placeholder="amount (NGN)" type="number" value={form.amount ?? 0} onChange={e=>setForm(f=>({ ...f, amount: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"/>
          <input placeholder='features (comma-separated)' value={(form.features ?? []).join(', ')} onChange={e=>setForm(f=>({ ...f, features: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"/>
          <input placeholder="sort order" type="number" value={form.sort_order ?? 0} onChange={e=>setForm(f=>({ ...f, sort_order: Number(e.target.value) }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"/>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_active} onChange={e=>setForm(f=>({ ...f, is_active: e.target.checked }))}/>
            Active
          </label>
          <div className="sm:col-span-2">
            <button disabled={saving} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-medium shadow disabled:opacity-50">
              {saving ? 'Saving…' : 'Save / Update'}
            </button>
          </div>
        </form>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Active</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.slug} className="border-t border-white/10">
                  <td className="px-4 py-3">{p.slug}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">₦{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.is_active ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={()=>toggle(p.slug, !p.is_active)} className="rounded bg-indigo-600/80 px-3 py-1 text-xs hover:opacity-90">
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={()=>setForm({ ...p })} className="rounded bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
                      Edit in form
                    </button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td className="px-4 py-6 text-white/60" colSpan={5}>No plans yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
