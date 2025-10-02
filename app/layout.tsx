import './globals.css'
import { Inter } from 'next/font/google'
import { createServer } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import ClientBoot from './ClientBoot'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dashboard',
  description: 'Glassy purple plans',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServer() // not async
  const { data: { user } } = await supabase.auth.getUser() // server-verified

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
  <NavBar user={user ? { email: user.email ?? null } : null} />
  <ClientBoot />
  {children}
</body>
    </html>
  )
}
