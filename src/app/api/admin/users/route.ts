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

    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        roles: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get ban status for each user
    const usersWithBans = await Promise.all(
      users.map(async (user) => {
        const activeBans = await prisma.ban.findMany({
          where: {
            userId: user.id,
            OR: [
              { bannedUntil: null },
              { bannedUntil: { gt: new Date() } }
            ]
          }
        })

        return {
          id: user.id,
          uid: user.uid,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          roles: user.roles.map(r => r.name),
          isBanned: activeBans.length > 0,
          banReason: activeBans[0]?.reason || null,
          banExpiry: activeBans[0]?.bannedUntil || null
        }
      })
    )

    // Format user data
    const formattedUsers = usersWithBans

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
