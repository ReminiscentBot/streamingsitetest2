'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function PresenceHeartbeat() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    if (status !== 'authenticated' || !session) return

    // Get a friendly page name from the pathname
    const getPageName = (path: string) => {
      if (path === '/') return 'Home'
      if (path.startsWith('/search')) return 'Search'
      if (path.startsWith('/watch/')) return 'Watching'
      if (path.startsWith('/u/')) {
        // Extract the UID from the path to show which profile
        const uid = path.split('/u/')[1]
        return `Profile:${uid}`
      }
      if (path.startsWith('/members')) return 'Members'
      if (path.startsWith('/settings')) return 'Settings'
      if (path.startsWith('/admin')) return 'Admin Panel'
      if (path.startsWith('/customize')) return 'Customize Profile'
      return 'Browsing'
    }

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPage: getPageName(pathname) })
        })
      } catch (error) {
        console.error('Failed to send presence heartbeat:', error)
      }
    }

    // Send heartbeat immediately
    sendHeartbeat()

    // Set up interval to send heartbeat every 2 minutes
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000)

    // Cleanup on unmount
    return () => clearInterval(interval)
  }, [session, status, pathname])

  return null // This component doesn't render anything
}
