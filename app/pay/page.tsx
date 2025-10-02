import { redirect } from 'next/navigation'

// Ensure this route is always dynamic so the redirect runs at request time
export const dynamic = 'force-dynamic'

export default function PayIndex() {
  redirect('/') // send users to the glassy homepage
}
