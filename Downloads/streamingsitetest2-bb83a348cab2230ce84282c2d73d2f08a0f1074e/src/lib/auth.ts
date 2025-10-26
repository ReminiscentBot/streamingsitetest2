import type { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Extend the default Session and JWT types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name: string
    email: string
    image: string
  }

  interface JWT {
    user?: User
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null
      
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
      
        if (!user || !user.password) return null
      
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
      
        return {
          id: user.id,
          email: user.email ?? "",   // ensure string
          name: user.name ?? "",     // ensure string
          image: user.image ?? "/placeholder.png",
        }
      },
    }),

    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.user = user
      return token
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user, // now includes image
        }
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
