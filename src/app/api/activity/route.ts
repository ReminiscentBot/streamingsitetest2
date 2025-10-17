import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 })
  const body = await req.json()
  const { tmdbId, type, season, episode, title, poster } = body
  
  // If we don't have proper title/poster, fetch from TMDB
  let finalTitle = title
  let finalPoster = poster
  
  if (!finalTitle || finalTitle.includes('TMDB')) {
    try {
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${process.env.TMDB_API_KEY}`
      )
      if (tmdbResponse.ok) {
        const tmdbData = await tmdbResponse.json()
        finalTitle = tmdbData.name || tmdbData.title || `TMDB ${type.toUpperCase()} ${tmdbId}`
        finalPoster = tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : poster
      }
    } catch (error) {
      console.error('Failed to fetch TMDB data:', error)
    }
  }
  
  // Ensure we have a User row and use its primary key as the foreign key
  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {},
    create: {
      email: session.user.email,
      name: session.user.name || undefined,
      image: session.user.image || undefined,
    },
  })

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      lastActiveAt: new Date(),
      lastWatchingId: tmdbId,
      lastWatchingType: type,
      lastWatchingSeason: season,
      lastWatchingEpisode: episode,
      lastWatchingTitle: finalTitle,
      lastWatchingPoster: finalPoster,
    },
    create: {
      userId: user.id,
      lastWatchingId: tmdbId,
      lastWatchingType: type,
      lastWatchingSeason: season,
      lastWatchingEpisode: episode,
      lastWatchingTitle: finalTitle,
      lastWatchingPoster: finalPoster,
    },
  })
  return NextResponse.json({ ok: true })
}


