import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { userId, reason, duration } = await req.json()
    
    if (!userId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the current user and check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { roles: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has admin or higher (only admins can ban)
    const hasPermission = user.roles.some(r => 
      ['owner', 'developer', 'admin'].includes(r.name)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Calculate ban expiry
    const expiresAt = duration ? new Date(Date.now() + duration) : null

    // Create ban record
    const ban = await prisma.ban.create({
      data: {
        userId,
        reason,
        bannedUntil: expiresAt
      }
    })

    return NextResponse.json({ success: true, ban })
  } catch (error) {
    console.error('Error banning user:', error)
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
  }
}
