"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSession } from 'next-auth/react'
import NotSignedIn from '@/components/NotSignedIn'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()

    useEffect(() => {
      if (status === 'authenticated') {
        router.replace("/") // redirect immediately
      }
    }, [status, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-6 relative">
      {/* Card */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-2xl p-10 backdrop-blur-sm shadow-xl max-w-lg w-full">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">
          Welcome Back to <span className="text-brand-400">CacheTomb</span>
        </h1>
        <p className="text-lg text-neutral-400 mb-8 text-center">
          Sign in to explore trending movies and TV shows, save your favorites, and access personalized recommendations.
        </p>

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <a href="/auth/register" className="px-6 py-3 text-lg font-semibold text-white bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-all duration-200 text-center">
            Create Account
          </a>
          <button
            onClick={() =>
              signIn("discord", { callbackUrl: "/" }) // redirect to home after login
            }
            className="px-6 py-3 text-lg font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-all duration-200"
          >
            Sign in with Discord
          </button>

        </div>
      </div>

      {/* Subtle gradient glow */}
      <div className="absolute w-[600px] h-[600px] bg-brand-500/10 blur-[200px] rounded-full -z-10"></div>
    </main>
  )
}
