"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/images'
import Link from 'next/link'

type MediaProgress = {
  [tmdbId: string]: {
    id: string
    type: 'movie' | 'tv'
    title: string
    poster_path?: string
    progress?: { watched: number; duration: number }
    last_updated?: number
    last_season_watched?: string
    last_episode_watched?: string
  }
}

export default function ContinueWatching() {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    const loadItems = () => {
      try {
        // Debug: Log all localStorage keys
        console.log('All localStorage keys:', Object.keys(localStorage))
        
        // Get movies/TV shows progress - try multiple possible keys
        const possibleKeys = [
          'vidsrcwtf-Progress',
          'vidsrc-Progress', 
          'streaming-progress',
          'watch-progress',
          'continue-watching'
        ]
        
        let raw = null
        let usedKey = null
        for (const key of possibleKeys) {
          raw = localStorage.getItem(key)
          if (raw) {
            usedKey = key
            console.log(`Found data in key: ${key}`)
            break
          }
        }
        
        console.log('Used key:', usedKey, 'Data:', raw)
        
        let movieTvItems: any[] = []
        if (raw) {
          try {
            const data: MediaProgress = JSON.parse(raw)
            console.log('Parsed progress data:', data)
            movieTvItems = Object.values(data)
              .sort((a, b) => (b.last_updated || 0) - (a.last_updated || 0))
              .slice(0, 12)
          } catch (parseError) {
            console.error('Error parsing progress data:', parseError)
          }
        }

        console.log('Final movieTvItems:', movieTvItems)
        setItems(movieTvItems)
      } catch (error) {
        console.error('Error loading continue watching:', error)
      }
    }

    // Load immediately
    loadItems()

    // Refresh every 30 seconds to get updated content
    const interval = setInterval(loadItems, 30000)

    return () => clearInterval(interval)
  }, [])

  // Always show the section for testing, even if no items
  // if (!items.length) return null

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-6">Continue Watching</h2>
      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-neutral-400 text-lg mb-2">No content to continue watching</p>
          <p className="text-neutral-500 text-sm">Start watching movies or TV shows to see your progress here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((it) => {
          const isTv = it.type === 'tv'
          
          let href = ''
          if (isTv) {
            href = `/watch/${it.id}?type=tv&s=${it.last_season_watched || '1'}&e=${it.last_episode_watched || '1'}`
          } else {
            href = `/watch/${it.id}?type=movie`
          }

          const pct = it.progress?.duration ? Math.min(100, Math.round((it.progress.watched / it.progress.duration) * 100)) : 0
          const imageSrc = getPosterUrl(it.poster_path)
          
          return (
            <Link 
              key={`${it.type}-${it.id}`} 
              href={href} 
              className="group bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden hover:bg-neutral-700/50 transition-all duration-300 hover:scale-105"
            >
              <div className="relative w-full aspect-[2/3]">
                <Image 
                  src={imageSrc} 
                  alt={it.title} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-3">
                <div className="text-white font-medium text-sm truncate mb-2">{it.title}</div>
                <div className="h-1.5 w-full bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-600 transition-all duration-300" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
                <div className="text-xs text-neutral-500 mt-1">{pct}% complete</div>
              </div>
            </Link>
          )
        })}
        </div>
      )}
    </section>
  )
}


