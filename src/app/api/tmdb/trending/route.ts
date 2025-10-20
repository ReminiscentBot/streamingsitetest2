import { NextResponse } from 'next/server'
import { tmdbGet } from '@/lib/tmdb'

export async function GET() {
  try {
    const data = await tmdbGet<any>('/trending/all/week')
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: 'tmdb_error' }, { status: 502 })
  }
}


