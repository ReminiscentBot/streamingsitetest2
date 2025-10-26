import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const count = Number(body.count) || 1

    // Fetch all users (not just admin)
    const users = await prisma.user.findMany({ select: { uid: true } })

    const invitesData = []

    for (const user of users) {
      for (let i = 0; i < count; i++) {
        invitesData.push({
          code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          issuerId: user.uid.toString(),  // each user gets their own
          enabled: true,
          usedBy: 0,
        })
      }
    }

    await prisma.invites.createMany({
      data: invitesData,
      skipDuplicates: true,
    })

    return NextResponse.json(invitesData) // return full data for frontend table
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create mass invites' }, { status: 500 })
  }
}
