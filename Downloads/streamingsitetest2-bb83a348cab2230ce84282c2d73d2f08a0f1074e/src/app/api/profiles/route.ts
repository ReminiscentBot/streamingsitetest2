import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('uid')
  if (!key) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  // Get current session for profile view tracking
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.email ? 
    (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id : null

  // Resolve to internal user id from either numeric uid, email, or direct userId
  let user = null as any
  // Try numeric uid
  if (/^\d+$/.test(key)) {
    user = await prisma.user.findFirst({ where: { uid: Number(key) } })
  }
  // Try email
  if (!user && key.includes('@')) {
    user = await prisma.user.findFirst({ where: { email: key } })
  }
  // Fallback: assume it's the internal userId (cuid)
  if (!user) {
    user = await prisma.user.findFirst({ where: { id: key } })
  }

  // If no user found, return 404
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  const presence = await prisma.presence.findUnique({ where: { userId: user.id } })
  
  // Track profile view if user is authenticated and viewing someone else's profile
  if (currentUserId && user && currentUserId !== user.id && profile) {
    try {
      await prisma.profileView.create({
        data: {
          profileId: profile.id,
          viewerId: currentUserId
        }
      })
    } catch (error) {
      // Ignore duplicate view errors
      console.log('Profile view already tracked or error:', error)
    }
  }
  
  // If user is viewing a profile, fetch that profile's info
  let viewedProfile = null
  if (presence?.currentPage?.startsWith('Profile:')) {
    const viewedUid = presence.currentPage.split(':')[1]
    const viewedUser = await prisma.user.findFirst({ where: { uid: Number(viewedUid) } })
    if (viewedUser) {
      viewedProfile = {
        uid: viewedUser.uid,
        name: viewedUser.name
      }
    }
  }
  
  const views = profile ? await prisma.profileView.findMany({ 
    where: { profileId: profile.id }, 
    orderBy: { createdAt: 'desc' }, 
    take: 50 
  }) : []

  // Manually fetch viewer information for each view
  const viewsWithViewers = await Promise.all(
    views.map(async (view) => {
      if (view.viewerId) {
        const viewer = await prisma.user.findUnique({
          where: { id: view.viewerId },
          select: { uid: true, name: true, image: true }
        })
        return { ...view, viewer }
      }
      return { ...view, viewer: null }
    })
  )
  const comments = profile ? await prisma.profileComment.findMany({ 
    where: { profileId: profile.id }, 
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          uid: true
        }
      },
      likedBy: {
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }, 
    take: 50 
  }) : []
  return NextResponse.json({ 
    user: user ? { 
      id: user.id, 
      uid: user.uid, 
      name: user.name, 
      image: user.image,
      email: user.email,
      createdAt: user.createdAt,
      discordId: user.discordId,
      banner: user.banner
    } : null, 
    profile, 
    presence,
    viewedProfile,
    views: viewsWithViewers, 
    comments 
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { 
      bio, 
      themeAccent, 
      customAvatar, 
      customBanner,
      profileLayout,
      showStats,
      showLastWatching,
      showComments,
      customCss,
      profileBadges,
      profileEffects
    } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { roles: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has premium/vip for advanced features
    const isPremium = user.roles.some(r => r.name === 'premium')
    const isVip = user.roles.some(r => r.name === 'vip')
    
    const updateData: any = {
      bio: bio || null,
      themeAccent: themeAccent || null,
      customAvatar: customAvatar || null,
      customBanner: customBanner || null,
      profileLayout: profileLayout || 'default',
      showStats: showStats !== false,
      showLastWatching: showLastWatching !== false,
      showComments: showComments !== false
    }

    // Only allow VIP features for VIP users
    if (isVip) {
      updateData.customCss = customCss || null
      updateData.profileBadges = profileBadges || []
      updateData.profileEffects = profileEffects || []
    }

    // Update profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
        lastActiveAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}


