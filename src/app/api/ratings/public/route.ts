import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tmdbId = searchParams.get('tmdbId')
  const type = searchParams.get('type')

  if (!tmdbId || !type) {
    return NextResponse.json({ error: 'tmdbId and type required' }, { status: 400 })
  }

  try {
    // Get average rating for this item (public, no authentication required)
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
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating || 0
    })
  } catch (error) {
    console.error('Error fetching public ratings:', error)
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 })
  }
}
