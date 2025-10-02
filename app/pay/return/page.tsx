import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServer } from '@/lib/supabase/server'

type Props = { searchParams: { [k: string]: string | string[] | undefined } }

export default async function PayReturnPage({ searchParams }: Props) {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth?next=/pay/return')

  const status = (searchParams.status as string) || 'submitted'
  const plan = (searchParams.plan as string) || 'basic'

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      {status === 'submitted' ? (
        <>
          <h1 className="text-2xl font-semibold">Receipt submitted ✅</h1>
          <p className="mt-2 text-gray-600">
            We’ll review your proof and mark your <b>{plan}</b> plan as paid soon.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/billing" className="inline-flex items-center rounded-lg border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white">
              See my billing
            </Link>
            <Link href="/" className="inline-flex items-center rounded-lg border px-4 py-2 text-sm">
              Go to dashboard
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Payment status: {status}</h1>
          <p className="mt-2 text-gray-600">If this seems wrong, try again.</p>
          <div className="mt-6">
            <Link href="/pay" className="inline-flex items-center rounded-lg border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white">
              Back to plans
            </Link>
          </div>
        </>
      )}
    </main>
  )
}
