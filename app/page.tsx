import Link from 'next/link'
import { createServer } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard' }

export default async function HomePage() {
  const supabase = await createServer()
  await supabase.auth.getSession() // not showing email anymore

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      {/* glowing background shapes */}
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        {/* header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold md:text-5xl">
            Welcome to STAMMY&apos;s Tech World
          </h1>
          <p className="mt-3 text-base text-white/70 md:text-lg">
            Pick a package that fits your needs. Make payment. Upload proof, get activated asapu.
          </p>
        </header>

        {/* packages grid */}
        <div className="grid gap-8 md:grid-cols-2">
          <PackageCard
            tier="₦5,000 / mo"
            tagline="Essentials for individuals"
            features={['Single device access']}
            href="/pay/transfer?plan=1device"
          />
          <PackageCard
            tier="₦10,000 / mo"
            tagline="For 2 devices"
            features={['Two devices supported']}
            href="/pay/transfer?plan=2devices"
          />

          <PackageCard
            tier="₦15,000 / mo"
            tagline="For 3 devices"
            features={['Three devices supported']}
            href="/pay/transfer?plan=3devices"
          />
          <PackageCard
            tier="₦20,000 / mo"
            tagline="For 4 devices"
            features={['Four devices supported']}
            href="/pay/transfer?plan=4devices"
          />

          <PackageCard
            tier="₦25,000 / mo"
            tagline="Up to 8 devices"
            features={['Unlimited access (capped at 8 devices)']}
            href="/pay/transfer?plan=8devices"
          />
          <PackageCard
            tier="₦35,000 / mo"
            tagline="Truly unlimited"
            features={['Unlimited device support']}
            href="/pay/transfer?plan=unlimited"
          />
        </div>

        {/* steps */}
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          <Step n={1} title="Select a package" text="Pick the plan that fits your device needs." />
          <Step n={2} title="Pay via transfer" text="Send to our account, then upload your receipt." />
          <Step n={3} title="We activate your plan" text="Quick verification. Instant access." />
        </div>
      </div>
    </main>
  )
}

function PackageCard({ tier, tagline, features, href }: {
  tier: string, tagline: string, features: string[], href: string
}) {
  return (
    <article
      className="group relative rounded-3xl p-[1px] transition-transform duration-500 ease-out hover:-translate-y-3 hover:scale-105"
    >
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-lg transition-transform duration-500 ease-out group-hover:scale-105 group-hover:shadow-[0_30px_80px_rgba(124,58,237,0.45)]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{tier}</h2>
        </div>
        <p className="mt-2 text-sm text-white/70">{tagline}</p>
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/60" />
              {f}
            </li>
          ))}
        </ul>
        <Link
          href={href}
          className="mt-6 block w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-center text-sm font-medium shadow-md hover:opacity-90"
        >
          Select Package
        </Link>
      </div>
    </article>
  )
}

function Step({ n, title, text }: { n: number, title: string, text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl hover:bg-white/15 transition">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-sm font-bold">
          {n}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-white/70">{text}</p>
    </div>
  )
}
