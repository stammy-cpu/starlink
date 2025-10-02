import { redirect } from 'next/navigation'
import { createServer } from '@/lib/supabase/server'
import BankDetailsCard from '@/app/pay/transfer/BankDetailsCard'
import TransferForm from '@/app/pay/transfer/TransferForm'

type Props = { searchParams: { [k: string]: string | string[] | undefined } }

function getPlanMeta(key: string | undefined) {
  const k = (key || '').toLowerCase()
  const map: Record<string, { label: string; amount: number; devices: string; blurb: string }> = {
    '1device':   { label: '₦5,000 / mo',  amount: 5000,  devices: '1 device',           blurb: 'Essentials for individuals.' },
    '2devices':  { label: '₦10,000 / mo', amount: 10000, devices: '2 devices',          blurb: 'Perfect for two devices.' },
    '3devices':  { label: '₦15,000 / mo', amount: 15000, devices: '3 devices',          blurb: 'Smooth for three devices.' },
    '4devices':  { label: '₦20,000 / mo', amount: 20000, devices: '4 devices',          blurb: 'Great for small families.' },
    '8devices':  { label: '₦25,000 / mo', amount: 25000, devices: 'Up to 8 devices',    blurb: 'Unlimited access up to 8 devices.' },
    'unlimited': { label: '₦35,000 / mo', amount: 35000, devices: 'Unlimited devices',  blurb: 'Truly unlimited devices.' },
  }
  return map[k] ?? map['1device']
}

export const metadata = { title: 'Complete Transfer' }

export default async function TransferPage({ searchParams }: Props) {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth?next=/pay/transfer')

  const planKey = (searchParams.plan as string) || '1device'
  const plan = getPlanMeta(planKey)
  const email = session.user.email ?? ''

  const bankName = process.env.PAYMENT_BANK_NAME || 'Your Bank'
  const accountName = process.env.PAYMENT_ACCOUNT_NAME || 'Your Account Name'
  const accountNumber = process.env.PAYMENT_ACCOUNT_NUMBER || '0000000000'

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#140a2f] to-[#0f0a1f] text-white">
      {/* background glows */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-3xl" />

      <section className="relative mx-auto max-w-5xl px-6 py-14">
        {/* Title */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Complete Your Bank Transfer</h1>
          <p className="mt-3 text-base text-white/70">
            Transfer the amount for your plan, then upload your receipt. We’ll verify and activate your access fast.
          </p>
        </header>

        {/* Progress mini-steps */}
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3">
          <Step n={1} title="Plan" active />
          <Step n={2} title="Transfer" />
          <Step n={3} title="Upload" />
        </div>

        {/* Layout: Plan Summary + Bank Details + Upload */}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {/* Left column */}
          <section
            className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-lg transition-transform duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(124,58,237,0.35)]"
          >
            <h2 className="text-lg font-semibold">Plan summary</h2>
            <p className="mt-1 text-sm text-white/70">Confirm your package before paying.</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{plan.label}</div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{plan.devices}</span>
              </div>
              <p className="mt-2 text-sm text-white/75">{plan.blurb}</p>
              <p className="mt-3 text-xs text-white/60">
                Email: <span className="font-medium text-white/80">{email}</span>
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70">
              Tip: include your <span className="text-white">email</span> or <span className="text-white">plan</span> in the transfer narration for quicker verification.
            </div>
          </section>

          {/* Right column */}
          <section
            className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-lg transition-transform duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(124,58,237,0.35)]"
          >
            <h2 className="text-lg font-semibold">Where to pay</h2>
            <p className="mt-1 text-sm text-white/70">Use the account below. Then upload your receipt.</p>

            <BankDetailsCard
              bankName={bankName}
              accountName={accountName}
              accountNumber={accountNumber}
            />
          </section>
        </div>

        {/* Upload card full width */}
        <section
          className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-lg transition-transform duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_25px_80px_rgba(124,58,237,0.35)]"
        >
          <h2 className="text-lg font-semibold">Upload receipt</h2>
          <p className="mt-1 text-xs text-white/70">
            JPG, PNG, WEBP, HEIC, or PDF (max 10MB). We’ll notify you in the app once verified.
          </p>
          <div className="mt-4">
            <TransferForm plan={planKey} email={email} />
          </div>

          <div className="mt-4 grid gap-3 text-xs text-white/70 md:grid-cols-3">
            <InfoItem title="Private & secure">Your file is private to your account.</InfoItem>
            <InfoItem title="Fast review">We aim to verify within a short time.</InfoItem>
            <InfoItem title="Need help?">Reply on your receipt row in Billing.</InfoItem>
          </div>
        </section>
      </section>
    </main>
  )
}

function Step({ n, title, active = false }: { n: number; title: string; active?: boolean }) {
  return (
    <div className={[
      'flex items-center gap-3 rounded-2xl border p-3 text-sm backdrop-blur-xl transition',
      active ? 'border-fuchsia-400/40 bg-fuchsia-400/10' : 'border-white/10 bg-white/10',
      'hover:-translate-y-0.5 hover:bg-white/15'
    ].join(' ')}>
      <div className={[
        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
        active ? 'bg-gradient-to-br from-fuchsia-500 to-indigo-500' : 'bg-white/10'
      ].join(' ')}>
        {n}
      </div>
      <div className="font-medium">{title}</div>
    </div>
  )
}

function InfoItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-white/90">{title}</div>
      <div className="mt-1 text-white/70">{children}</div>
    </div>
  )
}
