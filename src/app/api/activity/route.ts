import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Activity API called')
    const session = await getServerSession(authOptions)
    console.log('🔍 Session:', session ? 'Found' : 'Not found')
    console.log('🔍 User email:', session?.user?.email)
    
    if (!session?.user?.email) {
      console.log('❌ No session or email found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { tmdbId, type, season, episode, title, poster } = body
    
    console.log('📊 Activity tracked:', body)
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create profile with current watching data
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        lastActiveAt: new Date(),
        lastWatchingTitle: title,
        lastWatchingType: type,
        lastWatchingSeason: season || null,
        lastWatchingEpisode: episode || null,
        lastWatchingPoster: poster || null,
        lastWatchingTmdbId: tmdbId || null
      },
      create: {
        userId: user.id,
        lastActiveAt: new Date(),
        lastWatchingTitle: title,
        lastWatchingType: type,
        lastWatchingSeason: season || null,
        lastWatchingEpisode: episode || null,
        lastWatchingPoster: poster || null,
        lastWatchingTmdbId: tmdbId || null
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activity tracking error:', error)
    return NextResponse.json({ error: 'Failed to track activity' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}