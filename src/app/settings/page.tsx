'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import SettingsForm from './SettingsForm'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'

type SettingsTab = 'profile' | 'discord' | 'privacy' | 'notifications'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    async function fetchUser() {
      if (status === 'authenticated' && session?.user?.email) {
        try {
          // Get current user's UID first
          const adminRes = await fetch('/api/admin/check')
          if (adminRes.ok) {
            const adminData = await adminRes.json()
            const res = await fetch(`/api/profiles?uid=${adminData.uid}`)
            if (res.ok) {
              const data = await res.json()
              setUser(data.user)
            } else {
              showError('Failed to load user data')
            }
          } else {
            showError('Failed to load user data')
          }
        } catch (error) {
          console.error('Error fetching user:', error)
          showError('Failed to load user data')
        } finally {
          setLoading(false)
        }
      } else if (status === 'unauthenticated') {
        setLoading(false)
      }
    }

    fetchUser()
  }, [session, status, showError])

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    )
  }

  if (!session || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Authenticated</h1>
          <p className="text-neutral-400">Please sign in to access settings.</p>
        </div>
      </main>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'discord', label: 'Discord', icon: '🎮' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-neutral-400">Customize your profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
                  <SettingsForm user={user} />
                </div>
              )}

              {activeTab === 'discord' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Discord Integration</h2>
                  
                  {/* Profile Preview */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Current Discord Data</h3>
                    <div className="bg-neutral-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-neutral-600">
                          <Image
                            src={user.image || '/placeholder.png'}
                            alt={user.name || 'User'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-sm text-neutral-400">Discord ID: {user.discordId || 'Not connected'}</div>
                        </div>
                      </div>
                      
                      {user.banner && user.discordId && (
                        <div className="relative h-24 w-full bg-gradient-to-r from-brand-800 to-brand-700 rounded-lg overflow-hidden">
                          <Image
                            src={`https://cdn.discordapp.com/banners/${user.discordId}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`}
                            alt="Discord banner"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/discord/refresh', { method: 'POST' })
                          if (res.ok) {
                            showSuccess('Discord data refreshed successfully')
                            // Refresh user data
                            const userRes = await fetch('/api/profiles')
                            if (userRes.ok) {
                              const data = await userRes.json()
                              setUser(data.user)
                            }
                          } else {
                            showError('Failed to refresh Discord data')
                          }
                        } catch (error) {
                          console.error('Error refreshing Discord data:', error)
                          showError('Failed to refresh Discord data')
                        }
                      }}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Refresh Discord Data
                    </button>
                    
                    <div className="text-sm text-neutral-400">
                      <p>• Your Discord avatar and banner are automatically synced</p>
                      <p>• Click "Refresh Discord Data" to update your information</p>
                      <p>• Changes to your Discord profile will be reflected here</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-neutral-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Profile Visibility</h3>
                      <p className="text-neutral-400 text-sm mb-4">Control who can see your profile information</p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-white">Show profile to other users</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-white">Show last active status</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="rounded" />
                          <span className="text-white">Show what I'm watching</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Notification Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-neutral-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Email Notifications</h3>
                      <p className="text-neutral-400 text-sm mb-4">Choose what email notifications you want to receive</p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-white">New comments on my profile</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="text-white">Profile mentions</span>
                        </label>
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="rounded" />
                          <span className="text-white">Weekly activity summary</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  )
}