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
    const { commentId } = await req.json()

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findFirst({
      where: {
        commentId: commentId,
        userId: user.id
      }
    })

    if (existingLike) {
      // Unlike the comment
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      })
      return NextResponse.json({ liked: false })
    } else {
      // Like the comment
      await prisma.commentLike.create({
        data: {
          commentId: commentId,
          userId: user.id
        }
      })
      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('Error toggling comment like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}