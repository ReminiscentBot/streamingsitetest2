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
    const { targetUid, role } = await req.json()

    // Check if current user has permission to assign roles
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { roles: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isOwner = currentUser.roles.some(r => r.name === 'owner')
    const isDeveloper = currentUser.roles.some(r => r.name === 'developer')
    const isAdmin = currentUser.roles.some(r => r.name === 'admin')
    
    // Only owner, developer, and admin can assign roles
    if (!isOwner && !isDeveloper && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Only owner and developer can assign owner/developer roles
    if ((role === 'owner' || role === 'developer') && !isOwner && !isDeveloper) {
      return NextResponse.json({ error: 'Only owner/developer can assign owner/developer roles' }, { status: 403 })
    }

    // Find target user by UID
    const targetUser = await prisma.user.findFirst({
      where: { uid: Number(targetUid) }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Assign role
    await prisma.role.upsert({
      where: {
        userId_name: {
          userId: targetUser.id,
          name: role
        }
      },
      update: {},
      create: {
        userId: targetUser.id,
        name: role
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning role:', error)
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 })
  }
}
