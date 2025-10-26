import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Toggle invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const invite = await prisma.invites.findUnique({ where: { id } })
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

    const updated = await prisma.invites.update({
      where: { id },
      data: { enabled: !invite.enabled }
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to toggle invite' }, { status: 500 })
  }
}

// DELETE invite
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.invites.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 })
  }
}
