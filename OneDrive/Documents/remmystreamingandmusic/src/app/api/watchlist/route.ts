import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRequestLogging } from '@/lib/security/api-request-logger-wrapper'

const prisma = new PrismaClient()

async function getHandler(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ items: [] }, { status: 401 })
  
  // Find the user by email to get their ID
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (!user) return NextResponse.json({ items: [] }, { status: 404 })
  
  const items = await prisma.watchlist.findMany({ 
    where: { userId: user.id }, 
    orderBy: { createdAt: 'desc' } 
  })
  return NextResponse.json({ items })
}

async function postHandler(req: NextRequest) {
  try {
    // Block public API keys from write operations
    const { blockPublicApiWrites } = await import('@/lib/security/auth')
    const writeBlock = await blockPublicApiWrites()(req)
    if (writeBlock) return writeBlock

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    
    // Find the user by email to get their ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    
    const body = await req.json()
    
    console.log('📝 Watchlist POST:', { userId: user.id, tmdbId: body.tmdbId, lastSeason: body.lastSeason, lastEpisode: body.lastEpisode })
    
    // Prepare update/create data
    const data: any = {
      title: body.title,
      type: body.type,
      poster: body.poster
    }
    
    // Only update lastSeason/lastEpisode if provided (for TV shows)
    if (body.lastSeason !== undefined) {
      data.lastSeason = body.lastSeason
    }
    if (body.lastEpisode !== undefined) {
      data.lastEpisode = body.lastEpisode
    }
    
    const item = await prisma.watchlist.upsert({
      where: { userId_tmdbId: { userId: user.id, tmdbId: body.tmdbId } },
      update: data,
      create: { userId: user.id, tmdbId: body.tmdbId, ...data },
    })
    
    console.log('✅ Watchlist saved successfully')
    return NextResponse.json({ item })
  } catch (error) {
    console.error('❌ Watchlist POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

async function deleteHandler(req: NextRequest) {
  // Block public API keys from write operations
  const { blockPublicApiWrites } = await import('@/lib/security/auth')
  const writeBlock = await blockPublicApiWrites()(req)
  if (writeBlock) return writeBlock

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  
  // Find the user by email to get their ID
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })
  
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  
  const tmdbId = parseInt(new URL(req.url).searchParams.get('tmdbId') || '0')
  await prisma.watchlist.deleteMany({ where: { userId: user.id, tmdbId } })
  return NextResponse.json({ ok: true })
}

export const GET = withRequestLogging(getHandler)
export const POST = withRequestLogging(postHandler)
export const DELETE = withRequestLogging(deleteHandler)


