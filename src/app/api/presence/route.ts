import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 })
  
  const body = await req.json().catch(() => ({}))
  const { currentPage, pageType, mediaType } = body
  
  // Get the user ID from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (!user) return NextResponse.json({ ok: false }, { status: 404 })
  
  await prisma.presence.upsert({
    where: { userId: user.id },
    update: { 
      updatedAt: new Date(),
      currentPage: currentPage || null,
      pageType: pageType || null,
      mediaType: mediaType || null
    },
    create: { 
      userId: user.id,
      currentPage: currentPage || null,
      pageType: pageType || null,
      mediaType: mediaType || null,
      updatedAt: new Date()
    },
  })

  // Only clear current watching data if user is not on a watch page
  // Keep lastWatching data for "Last Watching" display
  if (currentPage && !currentPage.startsWith('watch/')) {
    await prisma.profile.updateMany({
      where: { userId: user.id },
      data: {
        // Only clear current watching, keep last watching
        currentWatchingId: null,
        currentWatchingTitle: null,
        currentWatchingType: null,
        currentWatchingSeason: null,
        currentWatchingEpisode: null,
        currentWatchingPoster: null,
        currentWatchingTmdbId: null
      }
    })
  }
  
  // Update the user's profile with time tracking
  const now = new Date()
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id }
  })

  if (profile) {
    // If user has a session start time, calculate time spent and add to total
    if (profile.sessionStartTime) {
      const sessionDuration = Math.floor((now.getTime() - profile.sessionStartTime.getTime()) / (1000 * 60)) // minutes
      const newTotalTime = profile.totalTimeOnSite + sessionDuration
      
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          lastActiveAt: now,
          totalTimeOnSite: newTotalTime,
          sessionStartTime: now // Start new session
        }
      })
    } else {
      // First time tracking for this user, start session
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          lastActiveAt: now,
          sessionStartTime: now
        }
      })
    }
  } else {
    // Create new profile with session start
    await prisma.profile.create({
      data: {
        userId: user.id,
        lastActiveAt: now,
        sessionStartTime: now
      }
    })
  }
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const fiveMin = new Date(Date.now() - 5 * 60 * 1000)
  const online = await prisma.presence.findMany({ 
    where: { updatedAt: { gt: fiveMin } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          uid: true,
          profile: {
            select: {
              totalTimeOnSite: true,
              sessionStartTime: true,
              lastActiveAt: true
            }
          }
        }
      }
    }
  })
  return NextResponse.json({ online })
}


