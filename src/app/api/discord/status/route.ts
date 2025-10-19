import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user's presence data to determine real status
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        profile: true,
        presence: true
      }
    })

    if (!user) {
      await prisma.$disconnect()
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine real status based on presence data
    let status = 'offline'
    let activity = null

    // Check if user is currently active (within last 2 minutes for Discord - more strict)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000)
    const isCurrentlyActive = user.profile?.lastActiveAt && new Date(user.profile.lastActiveAt) > twoMinutesAgo

    if (isCurrentlyActive) {
      status = 'online'
      
      // If user has current page data, show that as activity
      if (user.presence?.currentPage) {
        activity = {
          name: user.presence.currentPage,
          type: 'PLAYING',
          details: 'On the streaming platform'
        }
      }
      
      // If user has current watching data, show that instead
      if (user.profile?.currentWatchingTitle) {
        activity = {
          name: user.profile.currentWatchingTitle,
          type: 'WATCHING',
          details: user.profile.currentWatchingType === 'tv' 
            ? `Season ${user.profile.currentWatchingSeason}, Episode ${user.profile.currentWatchingEpisode}`
            : 'Movie'
        }
      }
    }

    const result = {
      status,
      activities: activity ? [activity] : []
    }

    await prisma.$disconnect()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching Discord status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
