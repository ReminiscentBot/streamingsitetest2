"use client"
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/images'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Related({ id, type }: { id: string; type: 'movie' | 'tv' }) {
  const { data, error } = useSWR(`/api/tmdb/related?id=${id}&type=${type}`, fetcher)
  
  if (error) {
    return (
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">&gt; RELATED</h3>
        <div className="text-neutral-400 text-sm">Failed to load related content</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">&gt; RELATED</h3>
        <div className="text-neutral-400 text-sm">Loading related content...</div>
      </div>
    )
  }

  const items = data.results || []
  
  if (!items.length) {
    return (
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">&gt; RELATED</h3>
        <div className="text-neutral-400 text-sm">No related content found</div>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">&gt; RELATED</h3>
      <div className="space-y-2">
        {items.slice(0, 5).map((item: any) => {
          const isTv = item.media_type === 'tv' || type === 'tv'
          const title = item.title || item.name
          const mediaType = (item.media_type || (isTv ? 'tv' : 'movie')).toUpperCase()
          
          return (
            <Link 
              key={`${item.id}`} 
              href={`/watch/${item.id}${isTv ? '?type=tv' : '?type=movie'}`} 
              className="flex items-center gap-3 p-2 rounded hover:bg-neutral-800 transition-colors"
            >
              <div className="relative w-12 h-8 flex-shrink-0">
                <Image 
                  src={getPosterUrl(item.poster_path)} 
                  alt={title} 
                  fill 
                  className="object-cover rounded" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">{title}</div>
                <div className="text-neutral-400 text-xs">{mediaType}</div>
              </div>
              <div className="text-neutral-500 text-xs">
                {item.vote_average?.toFixed(1) || 'N/A'}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}