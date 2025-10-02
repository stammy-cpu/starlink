'use client'

import Link from 'next/link'

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Check your email</h1>
        <p className="mt-2 text-center text-white/70">
          We sent a verification link to your inbox. Please click it, then log
          in again.
        </p>

        <ul className="mt-6 space-y-2 text-sm text-white/70">
          <li>• Check Spam or Promotions folder</li>
          <li>• Wait 2–3 minutes if it hasn’t arrived</li>
          <li>• You can request another link from the login page</li>
        </ul>

        <div className="mt-6 text-center">
          <Link
            href="/auth"
            className="inline-block rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-medium shadow-md transition hover:opacity-90"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  )
}
