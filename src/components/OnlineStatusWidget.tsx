"use client"
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faGlobe } from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'

interface OnlineStatusData {
  status: 'online' | 'idle' | 'dnd' | 'offline'
  activity?: {
    name: string
    type: string
    details?: string
  }
  currentPage?: string
}

export default function OnlineStatusWidget({ userId }: { userId: string }) {
  const [statusData, setStatusData] = useState<OnlineStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    async function fetchStatus() {
      try {
        // Fetch both Discord status and presence data
        const [discordRes, presenceRes] = await Promise.all([
          fetch('/api/discord/status'),
          fetch('/api/presence')
        ])
        
        const discordData = discordRes.ok ? await discordRes.json() : null
        const presenceData = presenceRes.ok ? await presenceRes.json() : null
        
        // Find the current user's presence data
        const userPresence = presenceData?.online?.find((p: any) => p.user.id === userId)
        
        setStatusData({
          status: discordData?.status || 'offline',
          activity: discordData?.activities?.[0],
          currentPage: userPresence?.currentPage
        })
      } catch (error) {
        console.error('Failed to fetch status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [userId])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || loading) {
    return (
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-neutral-600 rounded-full animate-pulse"></div>
          <span className="text-neutral-400 text-sm">Loading status...</span>
        </div>
      </div>
    )
  }

  if (!statusData) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400'
      case 'idle': return 'text-yellow-400'
      case 'dnd': return 'text-red-400'
      case 'offline': return 'text-neutral-400'
      default: return 'text-neutral-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online'
      case 'idle': return 'Idle'
      case 'dnd': return 'Do Not Disturb'
      case 'offline': return 'Offline'
      default: return 'Unknown'
    }
  }

  return (
    <div className="bg-gradient-to-br from-neutral-900/80 via-neutral-800/60 to-neutral-900/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4 shadow-lg">
      <div className="space-y-3">
        {/* Discord Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <FontAwesomeIcon 
              icon={faCircle} 
              className={`w-3 h-3 ${getStatusColor(statusData.status)}`}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              Discord Status: {getStatusText(statusData.status)}
            </div>
          </div>
        </div>
        
        
        {/* Current Page */}
        {statusData.currentPage && (
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faGlobe} className="text-neutral-500 text-sm" />
            <div className="flex-1">
              <div className="text-xs text-neutral-400 mb-1">Browsing</div>
              {statusData.currentPage.startsWith('Profile:') ? (
                <a
                  href={`/u/${statusData.currentPage.split(':')[1]}`}
                  className="text-sm text-brand-400 hover:text-brand-300 hover:underline cursor-pointer"
                >
                  Member Profile
                </a>
              ) : (
                <a
                  href={`/${statusData.currentPage.toLowerCase()}`}
                  className="text-sm text-brand-400 hover:text-brand-300 hover:underline cursor-pointer"
                >
                  {statusData.currentPage}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
