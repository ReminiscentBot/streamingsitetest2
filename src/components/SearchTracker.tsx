'use client'

import { useEffect } from 'react'

interface SearchTrackerProps {
  query: string
  results: any[]
}

export default function SearchTracker({ query, results }: SearchTrackerProps) {
  useEffect(() => {
    if (!query || results.length === 0) return

    // Track the search on the client side
    const trackSearch = async () => {
      try {
        await fetch('/api/tmdb/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            results: results.length
          })
        })
        console.log(`✅ Search tracked: "${query}" with ${results.length} results`)
      } catch (error) {
        console.error('❌ Failed to track search:', error)
      }
    }

    trackSearch()
  }, [query, results])

  return null // This component doesn't render anything
}
