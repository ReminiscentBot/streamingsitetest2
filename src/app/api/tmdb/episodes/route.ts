import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Episodes API - request.url:', request.url)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const season = searchParams.get('season')

    if (!id || !season) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Validate that id is numeric for TMDB API
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${id}/season/${season}?api_key=${TMDB_API_KEY}&language=en-US`
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      episodes: data.episodes || [],
      season_number: data.season_number,
      name: data.name,
      overview: data.overview,
      air_date: data.air_date,
      poster_path: data.poster_path
    })
  } catch (error) {
    console.error('Error fetching episodes:', error)
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 })
  }
}