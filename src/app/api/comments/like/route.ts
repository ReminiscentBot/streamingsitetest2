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
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 })
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if comment exists
    const comment = await prisma.profileComment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: user.id
        }
      }
    })

    if (existingLike) {
      // Unlike the comment
      await prisma.commentLike.delete({
        where: { id: existingLike.id }
      })

      // Decrement like count
      await prisma.profileComment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } }
      })

      return NextResponse.json({ liked: false, likes: comment.likes - 1 })
    } else {
      // Like the comment
      await prisma.commentLike.create({
        data: {
          commentId,
          userId: user.id
        }
      })

      // Increment like count
      await prisma.profileComment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } }
      })

      return NextResponse.json({ liked: true, likes: comment.likes + 1 })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
