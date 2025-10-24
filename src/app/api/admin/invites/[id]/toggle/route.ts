// app/api/admin/invites/[id]/toggle/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const invite = await prisma.invites.findUnique({ where: { id: params.id } })
  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.invites.update({
    where: { id: params.id },
    data: { enabled: !invite.enabled },
  })

  return NextResponse.json(updated)
}
