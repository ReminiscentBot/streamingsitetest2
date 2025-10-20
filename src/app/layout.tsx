import './globals.css'
import type { Metadata } from 'next'
import Providers from './providers'
import Header from '@/components/Header'
import PresenceHeartbeat from '@/components/PresenceHeartbeat'

export const metadata: Metadata = {
  title: 'CacheTomb Streaming',
  description: 'Streaming with Vidsrc + TMDB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <link rel="manifest" href="/manifest.webmanifest" />
        <Providers>
          <Header />
          <PresenceHeartbeat />
          {children}
        </Providers>
      </body>
    </html>
  )
}


