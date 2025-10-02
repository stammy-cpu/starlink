'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED = ['image/jpeg','image/png','image/webp','image/heic','application/pdf']

export default function TransferForm({ plan, email }: { plan: string; email: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [amount, setAmount] = useState<number>(plan === 'pro' ? 15000 : 5000)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  function onChoose(f?: File) {
    setErr(null); setOk(null)
    const chosen = f || null
    if (!chosen) return setFile(null)
    if (chosen.size > MAX_SIZE) return setErr('File too large (max 10MB).')
    if (!ALLOWED.includes(chosen.type)) return setErr('Only JPG, PNG, WEBP, HEIC, or PDF.')
    setFile(chosen)
    if (chosen.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(chosen))
    else setPreviewUrl(null)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null); setOk(null)
    if (!file) return setErr('Please choose an image or PDF of the receipt.')

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return setErr('Not signed in.') }

    const path = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g,'_')}`

    const { error: upErr } = await supabase.storage
      .from('payment_proofs')
      .upload(path, file, { upsert: false })
    if (upErr) { setLoading(false); return setErr(upErr.message) }

    const res = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan, amount_ngn: amount, proof_path: path, note })
    })
    setLoading(false)

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      return setErr(j.error || 'Could not submit payment.')
    }

    setOk('Submitted. We’ll review and mark it as paid.')
    setTimeout(() => router.push('/pay/return?status=submitted&plan=' + encodeURIComponent(plan)), 700)
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <Tip>Use your bank app to transfer, then upload the receipt screenshot or PDF.</Tip>

      <Labeled label="Email"><div className="rounded border px-3 py-2">{email}</div></Labeled>
      <Labeled label="Plan"><div className="rounded border px-3 py-2 capitalize">{plan}</div></Labeled>

      <Labeled label="Amount (NGN)">
        <input
          type="number"
          className="w-full rounded border px-3 py-2"
          value={amount}
          onChange={e => setAmount(Number(e.target.value || 0))}
          min={0}
          required
        />
      </Labeled>

      <Labeled label="Upload proof (JPG, PNG, WEBP, HEIC, PDF; max 10MB)">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={e => onChoose(e.target.files?.[0] || undefined)}
          className="block w-full"
          required
        />
        {previewUrl && (
          <img src={previewUrl} alt="preview" className="mt-3 max-h-56 rounded border" />
        )}
      </Labeled>

      <Labeled label="Note (optional)">
        <textarea
          className="w-full rounded border px-3 py-2"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Sender name, bank used, or transfer reference"
        />
      </Labeled>

      <button
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Submitting…' : 'Submit for review'}
      </button>

      {ok && <p className="text-sm text-green-600">{ok}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}
    </form>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{children}</div>
}
