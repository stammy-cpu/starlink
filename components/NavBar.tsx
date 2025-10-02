'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type NavUser = { email?: string | null } | null

export default function NavBar({ user }: { user: NavUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const email = user?.email ?? null
  const isAdmin =
    !!email &&
    (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .includes(email.toLowerCase())

  async function handleLogout() {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const linkStyle = (path: string) =>
    `px-3 py-2 rounded-lg text-sm transition ${
      pathname === path
        ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    }`

  return (
    <nav
      className="
        sticky top-0 z-50 w-full border-b border-white/10 text-white
        bg-gradient-to-r from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f]
      "
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Left: Brand */}
        <Link href="/" className="text-lg font-bold text-white">
          STAMMY<span className="text-fuchsia-400">Tech</span>
        </Link>

        {/* Middle: Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className={linkStyle('/')}>
            Dashboard
          </Link>
          <Link href="/billing" className={linkStyle('/billing')}>
            Billing
          </Link>
          {isAdmin && (
            <Link href="/admin/payments" className={linkStyle('/admin/payments')}>
              Admin
            </Link>
          )}
        </div>

        {/* Right: Profile */}
        {email ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">{email}</span>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-3 py-1 text-xs font-medium shadow hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '...' : 'Logout'}
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-3 py-1 text-xs font-medium shadow hover:opacity-90"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
