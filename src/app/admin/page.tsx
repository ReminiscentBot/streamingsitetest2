"use client"
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrown, faShield, faUser, faPlus } from '@fortawesome/free-solid-svg-icons'

interface AdminData {
  isOwner: boolean
  isDeveloper: boolean
  isAdmin: boolean
  isTrialMod: boolean
  roles: string[]
  uid: number
}

export default function AdminPage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [targetUid, setTargetUid] = useState('')
  const [role, setRole] = useState('trial_mod')
  const [assigning, setAssigning] = useState(false)
  const [removeTargetUid, setRemoveTargetUid] = useState('')
  const [removeRole, setRemoveRole] = useState('trial_mod')
  const [removing, setRemoving] = useState(false)

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

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUid.trim()) return

    setAssigning(true)
    try {
      const res = await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: targetUid.trim(), role })
      })

      if (res.ok) {
        alert('Role assigned successfully!')
        setTargetUid('')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to assign role')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!removeTargetUid.trim()) return

    setRemoving(true)
    try {
      const res = await fetch('/api/admin/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: removeTargetUid.trim(), role: removeRole })
      })

      if (res.ok) {
        alert('Role removed successfully!')
        setRemoveTargetUid('')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Failed to remove role')
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    )
  }

  if (!adminData?.isAdmin && !adminData?.isOwner && !adminData?.isDeveloper) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-neutral-400">You don't have admin permissions.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-neutral-400">Manage user roles and permissions</p>
          <div className="mt-4">
            <a 
              href="/admin/reports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              <span>📋</span>
              <span>View Reports</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Assign Roles */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="text-brand-400" />
              Assign Role
            </h3>
            
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Target User UID
                </label>
                <input
                  type="number"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  placeholder="Enter user UID"
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="trial_mod">Trial Moderator</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                  {(adminData.isOwner || adminData.isDeveloper) && (
                    <>
                      <option value="developer">Developer</option>
                      <option value="owner">Owner</option>
                    </>
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={assigning}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {assigning ? 'Assigning...' : 'Assign Role'}
              </button>
            </form>
          </div>

          {/* Current Status */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUser} className="text-brand-400" />
              Your Status
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">UID:</span>
                <span className="text-white font-medium">{adminData.uid}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Owner:</span>
                <span className={`font-medium ${adminData.isOwner ? 'text-green-400' : 'text-red-400'}`}>
                  {adminData.isOwner ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Developer:</span>
                <span className={`font-medium ${adminData.isDeveloper ? 'text-green-400' : 'text-red-400'}`}>
                  {adminData.isDeveloper ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Admin:</span>
                <span className={`font-medium ${adminData.isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                  {adminData.isAdmin ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Trial Mod:</span>
                <span className={`font-medium ${adminData.isTrialMod ? 'text-green-400' : 'text-red-400'}`}>
                  {adminData.isTrialMod ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-300">Roles:</span>
                <div className="flex gap-2">
                  {adminData.roles.map((role) => (
                    <span
                      key={role}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        role === 'admin' 
                          ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                          : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Remove Role Section */}
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShield} className="text-red-400" />
            Remove Role
          </h3>
          
          <form onSubmit={handleRemoveRole} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Target User UID
              </label>
              <input
                type="number"
                value={removeTargetUid}
                onChange={(e) => setRemoveTargetUid(e.target.value)}
                placeholder="Enter user UID"
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Role to Remove
              </label>
              <select
                value={removeRole}
                onChange={(e) => setRemoveRole(e.target.value)}
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="trial_mod">Trial Moderator</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
                {(adminData.isOwner || adminData.isDeveloper) && (
                  <>
                    <option value="developer">Developer</option>
                    <option value="owner">Owner</option>
                  </>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={removing}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {removing ? 'Removing...' : 'Remove Role'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
