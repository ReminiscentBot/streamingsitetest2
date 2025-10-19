import { NextRequest, NextResponse } from 'next/server'
import { tmdbGet } from '@/lib/tmdb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, results } = body
    
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }
    
    // Track search if user is authenticated
    const session = await getServerSession(authOptions)
    console.log('🔍 Search tracking POST - Session:', session ? 'Found' : 'Not found')
    
    if (session?.user?.email) {
      try {
        console.log('🔍 Looking up user for search tracking...')
        const user = await prisma.user.findUnique({ 
          where: { email: session.user.email },
          select: { id: true, name: true }
        })
        
        if (user) {
          console.log(`📝 Creating search record for user ${user.name} (${user.id})`)
          await prisma.search.create({
            data: {
              userId: user.id,
              query: query,
              results: results || 0
            }
          })
          console.log(`✅ Search recorded: "${query}" with ${results || 0} results`)
        } else {
          console.log('❌ User not found for search tracking')
        }
      } catch (error) {
        console.error('❌ Search tracking error:', error)
      }
    } else {
      console.log('❌ No session for search tracking')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Search tracking POST error:', error)
    return NextResponse.json({ error: 'Failed to track search' }, { status: 500 })
  }
}

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
    
    // Search tracking is now handled client-side by SearchTracker component
    
    return NextResponse.json({ ...data, results: filtered })
  } catch (e: any) {
    return NextResponse.json({ error: 'tmdb_error' }, { status: 502 })
  }
}


