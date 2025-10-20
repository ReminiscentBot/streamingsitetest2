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
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { roles: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isAdmin = user.roles.some(role => ['owner', 'admin', 'developer'].includes(role.name))
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get all users with their roles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        uid: true,
        image: true,
        createdAt: true,
        roles: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}