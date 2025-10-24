import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, code } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const invite = await prisma.invites.findUnique({ where: { code } })
    if (!invite || !invite.enabled) {
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 400 })
    }
    if (invite.usedBy >= 1) {
      return NextResponse.json({ error: 'Invitation code already used' }, { status: 400 })
    }

    // Check if user already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const existingName = await prisma.user.findUnique({ where: { name } })
    if (existingName) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const newUid = await getNextUid()

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        uid: newUid,
        profile: { create: { bio: '' } },
        image: 'https://cdn.discordapp.com/attachments/1008528902748119110/1431052716796547072/UnknownUser1024.png?ex=68fc0333&is=68fab1b3&hm=74cfcaf824829e06f6bb04e730c7e8cfe314647b38d8947d63d61dae1da4ea99&'
      },
    })

    // Mark invite as used
    await prisma.invites.update({
      where: { code },
      data: { usedBy: newUid },
    })

    return NextResponse.json({ ok: true, user })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// same getNextUid function you had
async function getNextUid(): Promise<number> {
  const existingUids = await prisma.user.findMany({ select: { uid: true }, orderBy: { uid: 'asc' } })
  const uidSet = new Set(existingUids.map(u => u.uid))
  for (let i = 1; i <= 1000; i++) if (!uidSet.has(i)) return i
  const lastUser = await prisma.user.findFirst({ orderBy: { uid: 'desc' }, select: { uid: true } })
  return (lastUser?.uid || 0) + 1
}
