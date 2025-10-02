'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  async function syncSession(access_token: string, refresh_token: string) {
    // write tokens into server cookies so SSR sees you as logged in
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token, refresh_token }),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error

        if (data.session?.access_token && data.session?.refresh_token) {
          await syncSession(data.session.access_token, data.session.refresh_token)
        }

        router.replace(next)
        router.refresh()
        return
      }

      // SIGNUP
      if (password.length < 8) throw new Error('Password must be at least 8 characters long.')
      if (password !== confirm) throw new Error('Passwords do not match.')

      const { error: suErr } = await supabase.auth.signUp({ email, password })
      if (suErr) throw suErr

      await supabase.auth.signOut()
      router.replace('/verify')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-lg">
        <h1 className="text-center text-2xl font-bold">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="mt-1 text-center text-sm text-white/70">
          {mode === 'login'
            ? 'Login to continue'
            : 'Sign up to get started'}
        </p>

        {mode === 'signup' && (
          <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-200">
            You’ll need to verify your email after signing up. Check your inbox for the link.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-fuchsia-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-fuchsia-400 focus:outline-none"
              placeholder="••••••••"
            />
            {mode === 'signup' && (
              <p className="mt-1 text-xs text-white/60">At least 8 characters.</p>
            )}
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-white/70">Confirm Password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-fuchsia-400 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-medium shadow-md transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setMode('signup')} className="underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')} className="underline">
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
