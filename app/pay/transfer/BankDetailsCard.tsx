'use client'

import { useState } from 'react'

export default function BankDetailsCard({
  bankName,
  accountName,
  accountNumber,
}: {
  bankName: string
  accountName: string
  accountNumber: string
}) {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <Row label="Bank Name" value={bankName} onCopy={() => copy(bankName, 'bank')} copied={copied==='bank'} />
      <Row label="Account Name" value={accountName} onCopy={() => copy(accountName, 'name')} copied={copied==='name'} />
      <Row label="Account Number" value={accountNumber} onCopy={() => copy(accountNumber, 'num')} copied={copied==='num'} />
    </div>
  )
}

function Row({
  label, value, onCopy, copied,
}: {
  label: string; value: string; onCopy: () => void; copied: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/15">
      <div className="text-[11px] uppercase tracking-wide text-white/60">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="truncate text-lg font-semibold">{value}</div>
        <button
          onClick={onCopy}
          className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs backdrop-blur-md transition hover:border-white/30 hover:bg-white/20"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
