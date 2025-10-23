"use client"

import { useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") router.push("/") // or /movies
  }, [status, router])

  if (status === "loading") return null // wait for session check


  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-center px-6">
      {/* Glowing accent orb */}
      <div className="absolute w-[700px] h-[700px] bg-brand-500/10 blur-[250px] rounded-full top-1/2 -translate-y-1/2"></div>

      {/* Subtle noise texture */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.08] pointer-events-none"></div>

      {/* Card */}
      <div className="relative z-10 bg-neutral-900/70 border border-neutral-700 backdrop-blur-md rounded-3xl shadow-2xl max-w-md w-full p-10 animate-fadeIn">
        {/* App Logo or Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-white mb-3">
            Welcome to <span className="text-brand-400">CacheTomb</span>
          </h1>
          <p className="text-neutral-400 text-lg">
            Sign in with Discord to unlock your personalized movie experience.
          </p>
        </div>

        {/* Discord Sign In Button */}
        <button
          onClick={() => signIn("discord", { callbackUrl: "/" })}
          className="group flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] transition-all duration-300 shadow-lg hover:shadow-brand-500/40 hover:scale-[1.03]"
        >
          <Image
            src="/discord-mark-white.svg"
            alt="Discord Logo"
            width={28}
            height={28}
            className="group-hover:rotate-6 transition-transform"
          />
          <span className="text-white text-lg font-semibold tracking-wide">
            Sign in with Discord
          </span>
        </button>

        {/* Small divider / text */}
        <div className="mt-10 border-t border-neutral-700 pt-6 text-sm text-neutral-500">
          <p>
            By signing in, you agree to our{" "}
            <a href="/terms" className="text-brand-400 hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-brand-400 hover:underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-neutral-600 text-sm">
        © {new Date().getFullYear()} CacheTomb. All rights reserved.
      </footer>
    </main>
  )
}
