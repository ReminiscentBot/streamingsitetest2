import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.email || ''
  if (!userId) return NextResponse.json({ items: [] }, { status: 401 })
  const items = await prisma.watchlist.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.email || ''
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const item = await prisma.watchlist.upsert({
    where: { userId_tmdbId: { userId, tmdbId: body.tmdbId } },
    update: { title: body.title, type: body.type, poster: body.poster },
    create: { userId, tmdbId: body.tmdbId, type: body.type, title: body.title, poster: body.poster },
  })
  return NextResponse.json({ item })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.email || ''
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const tmdbId = parseInt(new URL(req.url).searchParams.get('tmdbId') || '0')
  await prisma.watchlist.deleteMany({ where: { userId, tmdbId } })
  return NextResponse.json({ ok: true })
}


