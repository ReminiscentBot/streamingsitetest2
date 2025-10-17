"use client"
import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrown, faShield } from '@fortawesome/free-solid-svg-icons'

interface AdminData {
  isOwner: boolean
  isDeveloper: boolean
  isAdmin: boolean
  isTrialMod: boolean
  roles: string[]
  uid: number
}

export default function AdminBadge({ userId }: { userId: string }) {
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAdminStatus() {
      try {
        const res = await fetch('/api/admin/check')
        if (res.ok) {
          const data = await res.json()
          setAdminData(data)
        }
      } catch (error) {
        console.error('Failed to fetch admin status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStatus()
  }, [])

  if (loading || !adminData) {
    return null
  }

  if (adminData.isOwner) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium border border-purple-600/30">
          <FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
          <span>Owner</span>
        </div>
      </div>
    )
  }

  if (adminData.isDeveloper) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-600/30">
          <FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
          <span>Developer</span>
        </div>
      </div>
    )
  }

  if (adminData.isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium border border-yellow-600/30">
          <FontAwesomeIcon icon={faCrown} className="w-3 h-3" />
          <span>Admin</span>
        </div>
      </div>
    )
  }

  if (adminData.isTrialMod) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-600/30">
          <FontAwesomeIcon icon={faShield} className="w-3 h-3" />
          <span>Trial Mod</span>
        </div>
      </div>
    )
  }

  return null
}
