'use client'

export default function StatusBadge({
  status,
}: {
  status: 'pending' | 'paid' | 'rejected' | string
}) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const cls =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ' +
    (map[status] || 'bg-gray-100 text-gray-700')
  return <span className={cls}>{status}</span>
}
