import { NextResponse } from 'next/server'
import { tmdbGet } from '@/lib/tmdb'
import { withRequestLogging } from '@/lib/security/api-request-logger-wrapper'
import { NextRequest } from 'next/server'

async function getHandler(req: NextRequest) {
  try {
    const data = await tmdbGet<any>('/trending/all/week')
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: 'tmdb_error' }, { status: 502 })
  }
}

export const GET = withRequestLogging(getHandler)


