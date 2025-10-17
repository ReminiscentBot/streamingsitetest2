"use client"
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle } from '@fortawesome/free-solid-svg-icons'

interface DiscordStatusData {
  status: string
  activities: Array<{
    name: string
    type: string
    details?: string
  }>
}

export default function DiscordStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<DiscordStatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/discord/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to fetch Discord status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <div className="w-2 h-2 bg-neutral-600 rounded-full animate-pulse"></div>
        <span>Loading status...</span>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400">
        <div className="w-2 h-2 bg-neutral-600 rounded-full"></div>
        <span>Status unavailable</span>
      </div>
    )
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
    <div className="flex items-center gap-2 text-sm">
      <FontAwesomeIcon 
        icon={faCircle} 
        className={`w-2 h-2 ${getStatusColor(status.status)}`}
      />
      <span className={getStatusColor(status.status)}>
        {getStatusText(status.status)}
      </span>
      {status.activities.length > 0 && (
        <span className="text-neutral-400">
          • {status.activities[0].name}
        </span>
      )}
    </div>
  )
}
