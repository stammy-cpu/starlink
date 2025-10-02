import { requirePlan } from '@/lib/requirePlan'

export const metadata = {
  title: 'Pro Area',
}

export default async function ProArea() {
  await requirePlan('pro')
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Welcome to Pro</h1>
      <p className="mt-2 text-gray-600">You have access to Pro features.</p>
    </main>
  )
}
