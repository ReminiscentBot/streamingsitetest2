import SearchBar from '@/components/SearchBar'
import SectionGrid from '@/components/SectionGrid'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import NotSignedIn from "@/components/NotSignedIn";

async function fetchJson(path: string) {
  const base = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${base}${path}`, { next: { revalidate: 60 } })
  if (!res.ok) return { results: [] }
  return res.json()
}

export default async function Home() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return (<NotSignedIn />)
    }
  
  const [trending, popularMovies, popularTv] = await Promise.all([
    fetchJson('/api/tmdb/trending'),
    fetchJson('/api/tmdb/popular?type=movie'),
    fetchJson('/api/tmdb/popular?type=tv'),
  ])

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-brand-400">CacheTomb</span>
          </h1>
          <p className="text-xl text-neutral-400 mb-8">
            Your ultimate destination for movies and TV shows
          </p>
          
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          <SectionGrid title="Trending Now" items={trending.results || []} />
          <SectionGrid title="Popular Movies" items={popularMovies.results || []} />
          <SectionGrid title="Popular TV Shows" items={popularTv.results || []} />
        </div>
      
        {/* Quick Access to All Content Types */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Explore Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a href="/movies" className="group bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6 hover:from-blue-600/30 hover:to-cyan-600/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">Movies</h3>
                  <p className="text-neutral-400">Watch the latest movies</p>
                </div>
              </div>
            </a>
            
            <a href="/tv" className="group bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 hover:from-green-600/30 hover:to-emerald-600/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📺</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-green-400 transition-colors">TV Shows</h3>
                  <p className="text-neutral-400">Binge your favorite series</p>
                </div>
              </div>
            </a>
            
          </div>
        </div>
      </div>
    </main>
  )
}

