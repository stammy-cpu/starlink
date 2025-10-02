import { redirect } from 'next/navigation'
import { createServer } from '@/lib/supabase/server'

export const metadata = { title: 'Choose a Plan' }

const plans = [
  {
    key: 'basic',
    name: 'Basic',
    price: '₦5,000 / mo',
    blurb: 'Good for starters.',
    features: ['Access to core features', 'Email support', '1 device'],
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₦15,000 / mo',
    blurb: 'For growing teams.',
    features: ['Everything in Basic', 'Priority support', 'Multi-device'],
    highlight: true,
  },
]

export default async function PayPage() {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth?next=/pay')

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pick a plan</h1>
        <p className="mt-2 text-sm text-gray-600">
          We accept manual bank transfer. Upload your receipt after payment.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {plans.map((p) => (
          <article
            key={p.key}
            className={[
              'rounded-2xl border p-6 shadow-sm transition',
              p.highlight ? 'border-black shadow-md' : 'border-gray-200',
            ].join(' ')}
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <div className="text-2xl font-bold">{p.price}</div>
            </div>
            <p className="mt-1 text-sm text-gray-600">{p.blurb}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={`/pay/transfer?plan=${p.key}`}
              className={[
                'mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-medium',
                p.highlight
                  ? 'bg-black text-white hover:opacity-90'
                  : 'border border-black hover:bg-black hover:text-white',
              ].join(' ')}
            >
              Pay by bank transfer
            </a>
          </article>
        ))}
      </section>

      <p className="mt-6 text-xs text-gray-500">
        After you upload your receipt, we’ll review and activate your plan.
      </p>
    </main>
  )
}
