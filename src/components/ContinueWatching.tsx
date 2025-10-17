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
    try {
      const raw = localStorage.getItem('vidsrcwtf-Progress')
      if (!raw) return
      const data: MediaProgress = JSON.parse(raw)
      const arr = Object.values(data)
        .sort((a, b) => (b.last_updated || 0) - (a.last_updated || 0))
        .slice(0, 12)
      setItems(arr)
    } catch {}
  }, [])

  if (!items.length) return null

  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold">Continue Watching</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((it) => {
          const isTv = it.type === 'tv'
          const href = isTv
            ? `/watch/${it.id}?type=tv&s=${it.last_season_watched || '1'}&e=${it.last_episode_watched || '1'}`
            : `/watch/${it.id}?type=movie`
          const pct = it.progress?.duration ? Math.min(100, Math.round((it.progress.watched / it.progress.duration) * 100)) : 0
          return (
            <Link key={`${it.type}-${it.id}`} href={href} className="card overflow-hidden">
              <div className="relative w-full aspect-[2/3]">
                <Image src={getPosterUrl(it.poster_path)} alt={it.title} fill className="object-cover" />
              </div>
              <div className="p-3 text-sm">
                <div className="truncate">{it.title}</div>
                <div className="mt-2 h-2 w-full bg-neutral-800 rounded">
                  <div className="h-2 bg-brand-600 rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}


