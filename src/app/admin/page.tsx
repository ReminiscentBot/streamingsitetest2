"use client"

import { useState, useEffect } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faCrown,
  faShield,
  faUser,
  faPlus,
  faTrash,
  faToggleOn,
  faToggleOff,
  faCopy,
} from "@fortawesome/free-solid-svg-icons"

interface AdminData {
  isOwner: boolean
  isDeveloper: boolean
  isAdmin: boolean
  isTrialMod: boolean
  roles: string[]
  uid: number
}

interface Invite {
  id: string
  code: string
  issuerId: string
  enabled: boolean
  usedBy: number | null
  createdAt: string
}

export default function AdminPage() {
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  // Roles
  const [targetUid, setTargetUid] = useState("")
  const [role, setRole] = useState("trial_mod")
  const [assigning, setAssigning] = useState(false)
  const [removeTargetUid, setRemoveTargetUid] = useState("")
  const [removeRole, setRemoveRole] = useState("trial_mod")
  const [removing, setRemoving] = useState(false)

  // Invites
  const [invites, setInvites] = useState<Invite[]>([])
  const [search, setSearch] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [createUid, setCreateUid] = useState("")
  const [inviteCount, setInviteCount] = useState(1)

  // Fetch admin status & invites
  useEffect(() => {
    async function fetchData() {
      try {
        const [adminRes, invitesRes] = await Promise.all([
          fetch("/api/admin/check"),
          fetch("/api/admin/invites"),
        ])
        if (adminRes.ok) setAdminData(await adminRes.json())
        if (invitesRes.ok) setInvites(await invitesRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Roles
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetUid.trim()) return
    setAssigning(true)
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUid: targetUid.trim(), role }),
      })
      if (res.ok) {
        alert("Role assigned!")
        setTargetUid("")
      } else {
        const err = await res.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert("Failed to assign role")
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!removeTargetUid.trim()) return
    setRemoving(true)
    try {
      const res = await fetch("/api/admin/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUid: removeTargetUid.trim(), role: removeRole }),
      })
      if (res.ok) {
        alert("Role removed!")
        setRemoveTargetUid("")
      } else {
        const err = await res.json()
        alert(`Error: ${err.error}`)
      }
    } catch {
      alert("Failed to remove role")
    } finally {
      setRemoving(false)
    }
  }

  // Invites
  const toggleInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/invites/${id}/toggle`, { method: "POST" })
      if (res.ok) {
        const updated = await res.json()
        setInvites((prev) => prev.map((i) => (i.id === id ? updated : i)))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const deleteInvite = async (id: string) => {
    if (!confirm("Delete invite?")) return
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" })
      if (res.ok) setInvites((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const createInviteForUid = async () => {
    if (!createUid.trim()) return alert("UID required")
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUid: createUid.trim(), count: inviteCount }),
      })
      if (res.ok) {
        const data = await res.json()
        const newInvites = Array.isArray(data) ? data : [data]
        setInvites((prev) => [...newInvites, ...prev])
        setCreateUid("")
        alert(`Created ${newInvites.length} invite(s) for UID ${createUid}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const createInviteForAll = async () => {
    if (!confirm(`Generate ${inviteCount} invite(s) for each user?`)) return
    try {
      const res = await fetch('/api/admin/invites/mass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: inviteCount })
      })
      if (res.ok) {
        const newInvites = await res.json()
        setInvites(prev => [...newInvites, ...prev])
        alert('Mass invites created!')
      }
    } catch (err) {
      console.error(err)
    }
  }


  const filteredInvites = invites.filter(
    (i) => i.issuerId && i.issuerId.includes(search)
  )

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </main>
    )

  if (!adminData?.isAdmin && !adminData?.isOwner && !adminData?.isDeveloper)
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-neutral-400">You don't have admin permissions.</p>
        </div>
      </main>
    )

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-white">Admin Panel</h1>
        <p className="text-neutral-400 mb-6">Manage roles and invitations</p>

        {/* Role Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assign */}
          <div className="p-6 bg-neutral-900/50 border border-neutral-700/50 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faPlus} className="text-brand-400" /> Assign Role
            </h3>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <input
                type="number"
                value={targetUid}
                onChange={(e) => setTargetUid(e.target.value)}
                placeholder="Target UID"
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
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
              <button
                type="submit"
                disabled={assigning}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-700 text-white py-2 px-4 rounded-md"
              >
                {assigning ? "Assigning..." : "Assign Role"}
              </button>
            </form>
          </div>

          {/* Remove */}
          <div className="p-6 bg-neutral-900/50 border border-neutral-700/50 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faShield} className="text-red-400" /> Remove Role
            </h3>
            <form onSubmit={handleRemoveRole} className="space-y-4">
              <input
                type="number"
                value={removeTargetUid}
                onChange={(e) => setRemoveTargetUid(e.target.value)}
                placeholder="Target UID"
                className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
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
              <button
                type="submit"
                disabled={removing}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 text-white py-2 px-4 rounded-md"
              >
                {removing ? "Removing..." : "Remove Role"}
              </button>
            </form>
          </div>
        </div>

        {/* Invite Management */}
        <div className="p-6 bg-neutral-900/50 border border-neutral-700/50 rounded-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">Invitation Management</h3>

          {/* Count + create */}
          <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
            <input
              type="number"
              min={1}
              value={inviteCount}
              onChange={(e) => setInviteCount(Number(e.target.value))}
              className="w-20 rounded-md bg-neutral-700 border border-neutral-600 px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="number"
              placeholder="Specific UID"
              value={createUid}
              onChange={(e) => setCreateUid(e.target.value)}
              className="flex-1 rounded-md bg-neutral-700 border border-neutral-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={createInviteForUid}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-md"
            >
              Create Invite
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
            <button
              onClick={createInviteForAll}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Generate Mass Invites
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by issuer UID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
          />

          {/* Invite table */}
          {inviteLoading ? (
            <p className="text-neutral-400">Loading invites...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-neutral-400">Code</th>
                    <th className="px-4 py-2 text-neutral-400">Issuer UID</th>
                    <th className="px-4 py-2 text-neutral-400">Used By</th>
                    <th className="px-4 py-2 text-neutral-400">Enabled</th>
                    <th className="px-4 py-2 text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvites.map((inv) => (
                    <tr key={inv.id} className="border-t border-neutral-700">
                      <td className="px-4 py-2">
                        {inv.code}{" "}
                        <button
                          onClick={() => navigator.clipboard.writeText(inv.code)}
                          className="ml-2 text-sm text-brand-400 hover:underline"
                        >
                          <FontAwesomeIcon icon={faCopy} />
                        </button>
                      </td>
                      <td className="px-4 py-2">{inv.issuerId || "N/A"}</td>
                      <td className="px-4 py-2">{inv.usedBy ?? "None"}</td>
                      <td className="px-4 py-2">
                        {inv.enabled ? (
                          <FontAwesomeIcon
                            icon={faToggleOn}
                            className="text-green-400 cursor-pointer"
                            onClick={() => toggleInvite(inv.id)}
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faToggleOff}
                            className="text-red-400 cursor-pointer"
                            onClick={() => toggleInvite(inv.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => deleteInvite(inv.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredInvites.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-neutral-400 px-4 py-2 text-center">
                        No invites found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
