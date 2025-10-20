import type { NextAuthOptions } from 'next-auth'
import DiscordProvider from 'next-auth/providers/discord'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getNextUid(): Promise<number> {
  // Get all existing UIDs in ascending order
  const existingUids = await prisma.user.findMany({
    select: { uid: true },
    orderBy: { uid: 'asc' }
  })
  
  const uidSet = new Set(existingUids.map(u => u.uid))
  
  // Find the first available UID starting from 1
  for (let i = 1; i <= 1000; i++) { // Reasonable limit
    if (!uidSet.has(i)) {
      return i
    }
  }
  
  // Fallback: if all UIDs 1-1000 are taken, find the highest + 1
  const lastUser = await prisma.user.findFirst({
    orderBy: { uid: 'desc' },
    select: { uid: true }
  })
  
  return (lastUser?.uid || 0) + 1
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  events: {
    async signIn(message) {
      const account = message.account
      const profile = message.profile as any
      const user = message.user
      try {
        // Fetch Discord user data to get banner and avatar decoration
        let discordBanner = null;
        let discordAvatarDecoration = null;
        
        if (account?.provider === 'discord' && account?.access_token) {
          try {
            const discordResponse = await fetch('https://discord.com/api/users/@me', {
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
              },
            });
            
            if (discordResponse.ok) {
              const discordUser = await discordResponse.json();
              discordBanner = discordUser.banner;
              discordAvatarDecoration = discordUser.avatar_decoration;
            }
          } catch (error) {
            console.error('Failed to fetch Discord user data:', error);
          }
        }

        const dbUser = await prisma.user.upsert({
          where: { email: user.email || '' },
          update: {
            name: user.name || profile?.global_name || profile?.username || undefined,
            image: user.image || profile?.avatar_url || undefined,
            discordId: account?.providerAccountId,
            banner: discordBanner,
          },
          create: {
            email: user.email || undefined,
            name: user.name || profile?.global_name || profile?.username || undefined,
            image: user.image || profile?.avatar_url || undefined,
            discordId: account?.providerAccountId,
            banner: discordBanner,
            uid: await getNextUid(),
          },
        });

        // Also update/create Profile with Discord data
        await prisma.profile.upsert({
          where: { userId: dbUser.id },
          update: {
            lastActiveAt: new Date(),
            banner: discordBanner,
          },
          create: {
            userId: dbUser.id,
            lastActiveAt: new Date(),
            banner: discordBanner,
          },
        });
      } catch (error) {
        console.error('SignIn error:', error);
      }
    },
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (token?.accessToken) {
        ;(session as any).accessToken = token.accessToken
      }
      return session
    },
  },
}


