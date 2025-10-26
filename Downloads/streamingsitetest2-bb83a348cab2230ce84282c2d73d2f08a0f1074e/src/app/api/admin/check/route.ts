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
    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')
    
    // If userId is provided, check that user's roles, otherwise check current user
    const user = await prisma.user.findUnique({
      where: targetUserId ? { id: targetUserId } : { email: session.user.email },
      include: { roles: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isOwner = user.roles.some(r => r.name === 'owner')
    const isDeveloper = user.roles.some(r => r.name === 'developer')
    const isAdmin = user.roles.some(r => r.name === 'admin')
    const isModerator = user.roles.some(r => r.name === 'moderator')
    const isTrialMod = user.roles.some(r => r.name === 'trial_mod')
    const isPremium = user.roles.some(r => r.name === 'premium')
    const isVip = user.roles.some(r => r.name === 'vip')
    const roles = user.roles.map(r => r.name)

    return NextResponse.json({ 
      isOwner,
      isDeveloper,
      isAdmin,
      isModerator,
      isTrialMod,
      isPremium,
      isVip,
      roles,
      uid: user.uid,
      status: user.roles.map(r => r.name).join(', ') || 'user'
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
}
