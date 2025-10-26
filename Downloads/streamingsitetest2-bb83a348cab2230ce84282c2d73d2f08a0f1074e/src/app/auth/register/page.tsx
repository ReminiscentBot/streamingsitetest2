"use client"

import { useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useSession } from 'next-auth/react'
import NotSignedIn from '@/components/NotSignedIn'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setInvitation] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace("/") // redirect immediately
    }
  }, [status, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, code }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }

      // Automatically sign in after registration
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (signInRes?.error) setError(signInRes.error)
      else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-6 relative">
      {/* Card */}
      <div className="bg-neutral-900/60 border border-neutral-700 rounded-2xl p-10 backdrop-blur-sm shadow-xl max-w-lg w-full">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">
          Join <span className="text-brand-400">CacheTomb</span>
        </h1>
        <p className="text-lg text-neutral-400 mb-8 text-center">
          Create an account to explore trending movies and TV shows, save your favorites, and get personalized recommendations.
        </p>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3 rounded-lg bg-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
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
          <input
            type="text"
            placeholder="Invitation Code"
            value={code}
            onChange={(e) => setInvitation(e.target.value)}
            className="p-3 rounded-lg bg-neutral-700 text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold transition"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

        {/* Links & Discord */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <a href="/auth/signin" className="px-6 py-3 text-lg font-semibold text-white bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-all duration-200 text-center">
            Already have an account? Sign In
          </a>
          <button
            onClick={() => signIn("discord")}
            className="px-6 py-3 text-lg font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-all duration-200"
          >
            Register with Discord
          </button>
        </div>
      </div>

      {/* Subtle gradient glow */}
      <div className="absolute w-[600px] h-[600px] bg-brand-500/10 blur-[200px] rounded-full -z-10"></div>
    </main>
  )
}
