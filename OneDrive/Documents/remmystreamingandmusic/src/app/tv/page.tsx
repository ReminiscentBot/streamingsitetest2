'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import NotSignedIn from '@/components/NotSignedIn'

interface TVShow {
  id: number
  name: string
  poster_path: string
  overview: string
  first_air_date: string
  vote_average: number
  genre_ids: number[]
}

export default function TVPage() {
  const { data: session, status } = useSession()
  const [tvShows, setTvShows] = useState<TVShow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TVShow[]>([])

  // Load TV shows when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      loadPopularTVShows()
    }
  }, [status])

  // Show loading spinner while session is being checked
  if (status === 'loading') {
    return (
      <main className="flex items-center justify-center min-h-screen bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400"></div>
      </main>
    )
  }

  // If user is not signed in, show the same component as home
  if (status === "unauthenticated") {
    return <NotSignedIn />
  }

  const loadPopularTVShows = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tmdb/popular?type=tv')
      if (!response.ok) {
        throw new Error('Failed to fetch TV shows')
      }
      const data = await response.json()
      setTvShows(data.results || [])
    } catch (error) {
      console.error('Error loading TV shows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(searchQuery)}&type=tv`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Error searching TV shows:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayTVShows = searchResults.length > 0 ? searchResults : tvShows

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">TV Shows</h1>
          <p className="text-neutral-400">Discover and watch your favorite TV shows</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search TV shows..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {displayTVShows.map((tvShow) => (
              <Link
                key={tvShow.id}
                href={`/watch/${tvShow.id}?type=tv`}
                className="group bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden hover:bg-neutral-700/50 transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : '/placeholder.png'}
                    alt={tvShow.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-brand-400 transition-colors">
                    {tvShow.name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{new Date(tvShow.first_air_date).getFullYear()}</span>
                    <span>★ {tvShow.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {displayTVShows.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No TV shows found</p>
          </div>
        )}
      </div>
    </main>
  )
}
