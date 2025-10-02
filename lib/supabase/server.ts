import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

export function createServer() {
  const cookieStore = cookies()
  // return a client directly (NOT async)
  return createServerComponentClient({ cookies: () => cookieStore })
}
