"use client"
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/images'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Recommendations({ id, type }: { id: string; type: 'movie' | 'tv' }) {
  const { data } = useSWR(`/api/tmdb/recommendations?id=${id}&type=${type}`, fetcher)
  const items = data?.results || []
  if (!items.length) return null
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold">Recommended</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.slice(0, 12).map((it: any) => {
          const isTv = type === 'tv'
          const title = it.title || it.name
          return (
            <Link key={`${it.id}`} href={`/watch/${it.id}${isTv ? '?type=tv' : '?type=movie'}`} className="card overflow-hidden">
              <div className="relative w-full aspect-[2/3]">
                <Image src={getPosterUrl(it.poster_path)} alt={title} fill className="object-cover" />
              </div>
              <div className="p-3 text-sm">{title}</div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}


