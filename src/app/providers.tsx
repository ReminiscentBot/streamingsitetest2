"use client"
import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ping = async () => {
      try { await fetch('/api/presence', { method: 'POST' }) } catch {}
    }
    ping()
    const id = setInterval(ping, 30000)
    return () => clearInterval(id)
  }, [])
  return <SessionProvider>{children}</SessionProvider>
}


