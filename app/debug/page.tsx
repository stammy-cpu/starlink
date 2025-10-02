import { createServer } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = await createServer()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <pre className="p-4 text-sm">
      {JSON.stringify(
        {
          hasSession: Boolean(session),
          user: session?.user?.email ?? null,
          accessTokenPresent: Boolean(session?.access_token),
        },
        null,
        2
      )}
    </pre>
  )
}
