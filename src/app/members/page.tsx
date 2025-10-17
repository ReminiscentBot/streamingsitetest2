import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import Image from 'next/image'
import { formatLastActive, isCurrentlyActive } from '@/lib/timeUtils'

const prisma = new PrismaClient()

async function getMembersStats() {
  try {
    // Get most liked movies/shows (placeholder - we'll implement rating system)
    const mostLikedMovies = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'asc' }, // Placeholder until we have ratings
      select: {
        id: true,
        name: true,
        image: true,
        uid: true,
        profile: {
          select: {
            lastActiveAt: true,
            lastWatchingTitle: true,
            lastWatchingPoster: true,
          }
        }
      }
    })

    // Get most time online (users with most recent activity)
    const mostActiveUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        profile: {
          lastActiveAt: 'desc'
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        uid: true,
        profile: {
          select: {
            lastActiveAt: true,
            lastWatchingTitle: true,
            lastWatchingPoster: true,
          }
        }
      }
    })

    // Get staff members (users with any staff roles)
    const staffMembers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            name: {
              in: ['owner', 'developer', 'admin', 'trial_mod']
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        image: true,
        uid: true,
        roles: {
          select: {
            name: true
          }
        },
        profile: {
          select: {
            lastActiveAt: true,
            lastWatchingTitle: true,
            lastWatchingPoster: true,
          }
        }
      }
    })

    // Get online users (active in last 5 minutes) from presence table
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const onlinePresence = await prisma.presence.findMany({
      where: {
        updatedAt: {
          gte: fiveMinutesAgo
        }
      },
      select: {
        currentPage: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            uid: true,
            profile: {
              select: {
                lastActiveAt: true,
                lastWatchingTitle: true,
                lastWatchingPoster: true,
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    const onlineUsers = onlinePresence.map(p => ({
      ...p.user,
      currentPage: p.currentPage
    }))

    return {
      mostLikedMovies,
      mostActiveUsers,
      staffMembers,
      onlineUsers
    }
  } catch (error) {
    console.error('Error fetching members stats:', error)
    return {
      mostLikedMovies: [],
      mostActiveUsers: [],
      staffMembers: [],
      onlineUsers: []
    }
  }
}

export default async function MembersPage() {
  const session = await getServerSession(authOptions)
  const stats = await getMembersStats()

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Members Hub</h1>
          <p className="text-neutral-400">Discover the community and see who's online</p>
        </div>

        {/* Online Now Section */}
        <div className="mb-8">
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              Online Now ({stats.onlineUsers.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.onlineUsers.map((user) => (
                <Link key={user.id} href={`/members/${user.uid}`} className="group">
                  <div className="bg-neutral-800/50 rounded-lg p-4 hover:bg-neutral-700/50 transition-colors">
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <Image
                        src={user.image || '/placeholder.png'}
                        alt={user.name || 'User'}
                        fill
                        className="object-cover rounded-full"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-900"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-white truncate">{user.name}</div>
                      <div className="text-xs text-neutral-400">UID: {user.uid}</div>
                      {user.currentPage && (
                        <a 
                          href={`/${user.currentPage.toLowerCase()}`}
                          className="text-xs text-brand-400 mt-1 truncate hover:text-brand-300 hover:underline cursor-pointer block"
                        >
                          {user.currentPage}
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Most Liked Movies/Shows */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-400">⭐</span>
              Most Liked Movies/Shows
            </h3>
            <div className="space-y-3">
              {stats.mostLikedMovies.map((user, index) => (
                <Link key={user.id} href={`/members/${user.uid}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors">
                  <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="relative w-10 h-10">
                    <Image
                      src={user.image || '/placeholder.png'}
                      alt={user.name || 'User'}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-sm text-neutral-400">UID: {user.uid}</div>
                  </div>
                  {user.profile?.lastWatchingTitle && (
                    <div className="text-right">
                      <div className="text-xs text-neutral-400">Watching</div>
                      <div className="text-sm text-white truncate max-w-24">{user.profile.lastWatchingTitle}</div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Most Time Online */}
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-400">⏰</span>
              Most Active Users
            </h3>
            <div className="space-y-3">
              {stats.mostActiveUsers.slice(0, 5).map((user, index) => (
                <Link key={user.id} href={`/members/${user.uid}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors">
                  <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="relative w-10 h-10">
                    <Image
                      src={user.image || '/placeholder.png'}
                      alt={user.name || 'User'}
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-sm text-neutral-400">UID: {user.uid}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-400">Last active</div>
                    <div className="text-sm text-white">
                      {user.profile?.lastActiveAt ? formatLastActive(user.profile.lastActiveAt) : '—'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Section */}
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-brand-400">👑</span>
            Staff Members
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.staffMembers.map((user) => (
              <Link key={user.id} href={`/members/${user.uid}`} className="group">
                <div className="bg-gradient-to-br from-brand-600/20 to-brand-700/20 rounded-lg p-4 hover:from-brand-600/30 hover:to-brand-700/30 transition-colors border border-brand-600/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-12 h-12">
                      <Image
                        src={user.image || '/placeholder.png'}
                        alt={user.name || 'User'}
                        fill
                        className="object-cover rounded-full"
                      />
                    </div>
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-sm text-brand-400">
                        {user.roles.map(role => role.name).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-400">
                    UID: {user.uid} • Last active: {user.profile?.lastActiveAt ? formatLastActive(user.profile.lastActiveAt) : '—'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Future Stats Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-400">🎬</span>
              Longest Time Watching Movies
            </h3>
            <div className="text-neutral-400 text-sm">Coming soon with rating system</div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-400">📺</span>
              Longest Time Watching TV Shows
            </h3>
            <div className="text-neutral-400 text-sm">Coming soon with rating system</div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-400">🎌</span>
              Longest Time Watching Anime
            </h3>
            <div className="text-neutral-400 text-sm">Coming soon with rating system</div>
          </div>
        </div>
      </div>
    </main>
  )
}