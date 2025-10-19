import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 })
  
  const body = await req.json().catch(() => ({}))
  const { currentPage } = body
  
  // Get the user ID from the database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (!user) return NextResponse.json({ ok: false }, { status: 404 })
  
  await prisma.presence.upsert({
    where: { userId: user.id },
    update: { 
      updatedAt: new Date(),
      currentPage: currentPage || null
    },
    create: { 
      userId: user.id,
      currentPage: currentPage || null,
      updatedAt: new Date()
    },
  })

  // Clear watching data if user is not on a watch page
  if (currentPage && !currentPage.startsWith('watch/')) {
    await prisma.profile.updateMany({
      where: { userId: user.id },
      data: {
        lastWatchingId: null,
        lastWatchingTitle: null,
        lastWatchingType: null,
        lastWatchingSeason: null,
        lastWatchingEpisode: null,
        lastWatchingPoster: null,
        lastWatchingTmdbId: null
      }
    })
  }
  
  // Also update the user's profile lastActiveAt
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      lastActiveAt: new Date()
    },
    create: {
      userId: user.id,
      lastActiveAt: new Date()
    }
  })
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
          uid: true
        }
      }
    }
  })
  return NextResponse.json({ online })
}


