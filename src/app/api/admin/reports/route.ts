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

    // Fetch reports with related data
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            name: true,
            image: true,
            uid: true
          }
        },
        comment: {
          include: {
            author: {
              select: {
                name: true,
                image: true,
                uid: true
              }
            },
            profile: {
              include: {
                user: {
                  select: {
                    name: true,
                    uid: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { reportId, status } = await req.json()
    
    if (!reportId || !status) {
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

    // Update report status
    const report = await prisma.report.update({
      where: { id: reportId },
      data: { status }
    })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
  }
}
