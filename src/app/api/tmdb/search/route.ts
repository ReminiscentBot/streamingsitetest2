import { NextRequest, NextResponse } from 'next/server'
import { tmdbGet } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ results: [] })
  try {
    const data = await tmdbGet<any>('/search/multi', {
      query: q,
      include_adult: false,
      language: 'en-US',
    })
    const filtered = (data?.results || [])
      .filter((r: any) => r && (r.media_type === 'movie' || r.media_type === 'tv'))
      .sort((a: any, b: any) => {
        // Prioritize 1997 Titanic movie to the very top if present
        const aIs1997Titanic = a.media_type === 'movie' && (a.title || '').toLowerCase() === 'titanic' && (a.release_date || '').startsWith('1997')
        const bIs1997Titanic = b.media_type === 'movie' && (b.title || '').toLowerCase() === 'titanic' && (b.release_date || '').startsWith('1997')
        if (aIs1997Titanic && !bIs1997Titanic) return -1
        if (bIs1997Titanic && !aIs1997Titanic) return 1
        // Otherwise sort by popularity desc
        return (b.popularity || 0) - (a.popularity || 0)
      })
    return NextResponse.json({ ...data, results: filtered })
  } catch (e: any) {
    return NextResponse.json({ error: 'tmdb_error' }, { status: 502 })
  }
}


