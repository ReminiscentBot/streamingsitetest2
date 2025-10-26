import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tmdbId = searchParams.get('tmdbId')
  const type = searchParams.get('type')

  if (!tmdbId || !type) {
    return NextResponse.json({ error: 'tmdbId and type required' }, { status: 400 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's rating for this item
    const userRating = await prisma.rating.findUnique({
      where: {
        user_tmdb_type: {
          userId: user.id,
          tmdbId: parseInt(tmdbId),
          type: type
        }
      }
    })

    // Get average rating for this item
    const avgRating = await prisma.rating.aggregate({
      where: {
        tmdbId: parseInt(tmdbId),
        type: type
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })

    return NextResponse.json({
      userRating: userRating?.rating || null,
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating || 0
    })
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { tmdbId, type, rating } = await req.json()

    if (!tmdbId || !type || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating data' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert rating
    const ratingRecord = await prisma.rating.upsert({
      where: {
        user_tmdb_type: {
          userId: user.id,
          tmdbId: parseInt(tmdbId),
          type: type
        }
      },
      update: {
        rating: rating
      },
      create: {
        userId: user.id,
        tmdbId: parseInt(tmdbId),
        type: type,
        rating: rating
      }
    })

    // Get updated average rating
    const avgRating = await prisma.rating.aggregate({
      where: {
        tmdbId: parseInt(tmdbId),
        type: type
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })

    return NextResponse.json({
      success: true,
      rating: ratingRecord.rating,
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating || 0
    })
  } catch (error) {
    console.error('Error saving rating:', error)
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}
