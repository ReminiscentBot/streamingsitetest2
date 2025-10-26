import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user UID from email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { uid: true }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const invites = await prisma.invites.findMany({
      where: { issuerId: user.uid.toString() },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invites)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}
