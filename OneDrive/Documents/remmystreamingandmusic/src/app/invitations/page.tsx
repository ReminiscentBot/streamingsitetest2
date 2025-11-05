'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Invite {
  id: string
  code: string
  issuerId: string
  enabled: boolean
  usedBy: number
  createdAt: string
  usedByUser?: {
    uid: number
    name: string | null
    deleted?: boolean
  } | null
  issuerUser?: {
    uid: number
    name: string | null
    deleted?: boolean
  } | null
}

export default function InvitationsPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await fetch('/api/invitations')
        if (!res.ok) throw new Error('Failed to fetch invites')
        const data = await res.json()
        setInvites(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load invites.')
      } finally {
        setLoading(false)
      }
    }
    fetchInvites()
  }, [])

  if (loading) return <main className="p-8 text-white">Loading your invitations...</main>
  if (error) return <main className="p-8 text-red-400">{error}</main>

  return (
    <main className="min-h-screen bg-neutral-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-neutral-400">My Invitations</h1>

      {invites.length === 0 ? (
         <p className="font-semibold text-brand-400">You haven't received any invites yet, please contact an admin to request one.</p>
      ) : (
        <div className="overflow-x-auto bg-neutral-800 rounded-xl border border-neutral-700">
          <table className="w-full border-collapse">
            <thead className="bg-neutral-800/80 text-neutral-300">
              <tr>
                <th className="text-left p-4">Code</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Issuer</th>
                <th className="text-left p-4">Usage</th>
                <th className="text-left p-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id} className="border-t border-neutral-700/50 hover:bg-neutral-700/30 transition">
                  <td className="p-4 font-mono">{inv.code}</td>
                  <td className="p-4">
                    {inv.enabled ? (
                      <span className="text-green-400 font-medium">Enabled</span>
                    ) : (
                      <span className="text-red-400 font-medium">Disabled</span>
                    )}
                  </td>
                  <td className="p-4">
                    {inv.issuerUser ? (
                      inv.issuerUser.deleted ? (
                        <span className="flex items-center gap-2">
                          <span className="text-red-400 line-through font-medium">
                            {inv.issuerUser.name || 'Unknown User'}
                          </span>
                          <span className="text-neutral-500 text-sm">
                            (UID: {inv.issuerUser.uid})
                          </span>
                          <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded border border-red-700/50">
                            BANNED
                          </span>
                        </span>
                      ) : (
                        <Link 
                          href={`/u/${inv.issuerUser.uid}`}
                          className="text-brand-400 hover:text-brand-300 font-medium transition-colors underline"
                        >
                          {inv.issuerUser.name}
                        </Link>
                      )
                    ) : (
                      <span className="text-neutral-500">Unknown</span>
                    )}
                  </td>
                  <td className="p-4">
                    {inv.usedBy === -1 ? (
                      <span className="flex items-center gap-2">
                        <span className="text-orange-400 font-medium">Registration Denied</span>
                        <span className="bg-orange-900/30 text-orange-400 text-xs px-2 py-0.5 rounded border border-orange-700/50">
                          DISABLED
                        </span>
                      </span>
                    ) : inv.usedBy > 0 && inv.usedByUser ? (
                      inv.usedByUser.deleted ? (
                        <span className="flex items-center gap-2">
                          <span className="text-red-400 line-through font-medium">
                            {inv.usedByUser.name || 'Unknown User'}
                          </span>
                          <span className="text-neutral-500 text-sm">
                            (UID: {inv.usedByUser.uid})
                          </span>
                          <span className="bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded border border-red-700/50">
                            BANNED
                          </span>
                        </span>
                      ) : (
                        <Link 
                          href={`/u/${inv.usedByUser.uid}`}
                          className="text-brand-400 hover:text-brand-300 font-medium transition-colors underline"
                        >
                          {inv.usedByUser.name}
                        </Link>
                      )
                    ) : (
                      <span className="text-blue-400">Not Used</span>
                    )}
                  </td>
                  <td className="p-4 text-neutral-400 text-sm">
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
