import { NextRequest, NextResponse } from 'next/server'
import { tmdbGet } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const type = new URL(req.url).searchParams.get('type') || 'movie'
  const endpoint = type === 'tv' ? '/tv/popular' : '/movie/popular'
  try {
    const data = await tmdbGet<any>(endpoint)
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: 'tmdb_error' }, { status: 502 })
  }
}


