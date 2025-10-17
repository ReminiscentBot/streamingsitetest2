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
    const { userId, reason } = await req.json()
    
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

    // Check if user has trial_mod or higher
    const hasPermission = user.roles.some(r => 
      ['owner', 'developer', 'admin', 'moderator', 'trial_mod'].includes(r.name)
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create warning record (you might want to add a Warning model to your schema)
    // For now, we'll just log it or store it in a simple way
    console.log(`User ${user.id} warned user ${userId} for: ${reason}`)
    
    // You could add a Warning model to track warnings:
    // const warning = await prisma.warning.create({
    //   data: {
    //     userId,
    //     warnedBy: user.id,
    //     reason,
    //     createdAt: new Date()
    //   }
    // })

    return NextResponse.json({ success: true, message: 'User warned successfully' })
  } catch (error) {
    console.error('Error warning user:', error)
    return NextResponse.json({ error: 'Failed to warn user' }, { status: 500 })
  }
}
