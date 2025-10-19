import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Check if current user has admin permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { roles: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const hasPermission = user.roles.some(r => 
      ['owner', 'developer', 'admin', 'moderator'].includes(r.name)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get all users with their roles and ban status
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        bans: {
          where: {
            OR: [
              { bannedUntil: null },
              { bannedUntil: { gt: new Date() } }
            ]
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      roles: user.roles.map(r => r.name),
      isBanned: user.bans.length > 0,
      banReason: user.bans[0]?.reason || null,
      banExpiry: user.bans[0]?.bannedUntil || null
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
