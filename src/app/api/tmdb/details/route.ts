import { NextRequest, NextResponse } from 'next/server'
import { tmdbGet } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const type = (url.searchParams.get('type') || 'movie').toLowerCase()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const data = await tmdbGet<any>(`/${type}/${id}`)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'tmdb_error' }, { status: 502 })
  }
}


