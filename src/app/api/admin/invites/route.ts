import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET() {
  try {
    const invites = await prisma.invites.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(invites)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetUid, count } = await req.json()
    const num = Math.max(1, count || 1)

    const invitesData = Array.from({ length: num }, () => ({
      code: Math.random().toString(36).substring(2, 10).toUpperCase(),
      issuerId: targetUid,
      enabled: true,
      usedBy: 0
    }))

    // Use createMany to insert all invites
    await prisma.invites.createMany({
      data: invitesData,
      skipDuplicates: true
    })

    // Return the created invite objects (simulate fetching them)
    return NextResponse.json(invitesData)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create invite(s)' }, { status: 500 })
  }
}
