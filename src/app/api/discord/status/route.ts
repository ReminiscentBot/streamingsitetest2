import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user's last watching activity
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    })

    let activity = {
      name: 'Streaming Platform',
      type: 'PLAYING',
      details: 'Browsing movies and TV shows'
    }

    // If user has last watching data, show that instead
    if (user?.profile?.lastWatchingTitle) {
      activity = {
        name: user.profile.lastWatchingTitle,
        type: 'WATCHING',
        details: user.profile.lastWatchingType === 'tv' 
          ? `Season ${user.profile.lastWatchingSeason}, Episode ${user.profile.lastWatchingEpisode}`
          : 'Movie'
      }
    }

    const status = {
      status: 'online',
      activities: [activity]
    }

    await prisma.$disconnect()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching Discord status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
