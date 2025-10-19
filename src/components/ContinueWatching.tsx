"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/images'
import Link from 'next/link'
import { ProgressTracker } from '@/lib/progressTracker'

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
        
        // Use the new ProgressTracker
        const recentProgress = ProgressTracker.getRecentProgress(12)
        console.log('Recent progress from ProgressTracker:', recentProgress)
        
        // Don't create sample data automatically - let users add their own progress
        setItems(recentProgress)
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

  const addTestData = () => {
    ProgressTracker.saveProgress({
      id: 'test-lenox-hill',
      type: 'tv',
      title: 'Lenox Hill',
      poster_path: '/placeholder.png', // Use local placeholder
      progress: { watched: 1847, duration: 3001 }, // 30:47 / 50:01
      last_season_watched: '1',
      last_episode_watched: '1'
    })
    
    // Reload the items
    const updatedProgress = ProgressTracker.getRecentProgress(12)
    setItems(updatedProgress)
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
        {items.length === 0 && (
          <button
            onClick={addTestData}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm rounded-lg transition-colors"
          >
            Add Test Data
          </button>
        )}
      </div>
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
            <div key={`${it.type}-${it.id}`} className="group relative bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden hover:bg-neutral-700/50 transition-all duration-300 hover:scale-105">
              <Link href={href} className="block">
                <div className="relative w-full aspect-[2/3]">
                  <Image 
                    src={imageSrc} 
                    alt={it.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-300" 
                    onError={(e) => {
                      // Fallback to a default image if the poster fails
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/300x450/1f2937/9ca3af?text=No+Image'
                    }}
                    onLoad={(e) => {
                      // If the image loads but is the placeholder, we can handle it here if needed
                      const target = e.target as HTMLImageElement
                      if (target.src.includes('placeholder.png')) {
                        // This is our local placeholder, which should work
                      }
                    }}
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
              
              {/* Delete button - appears on hover */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  ProgressTracker.removeProgress(it.id)
                  // Reload the items
                  const updatedProgress = ProgressTracker.getRecentProgress(12)
                  setItems(updatedProgress)
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                title="Remove from Continue Watching"
              >
                ×
              </button>
            </div>
          )
        })}
        </div>
      )}
    </section>
  )
}


