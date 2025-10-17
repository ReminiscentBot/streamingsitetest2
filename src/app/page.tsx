import SearchBar from '@/components/SearchBar'
import ContinueWatching from '@/components/ContinueWatching'
import SectionGrid from '@/components/SectionGrid'

async function fetchJson(path: string) {
  const base = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = await fetch(`${base}${path}`, { next: { revalidate: 60 } })
  if (!res.ok) return { results: [] }
  return res.json()
}

export default async function Home() {
  const [trending, popularMovies, popularTv] = await Promise.all([
    fetchJson('/api/tmdb/trending'),
    fetchJson('/api/tmdb/popular?type=movie'),
    fetchJson('/api/tmdb/popular?type=tv'),
  ])

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      <section className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reminiscent Streaming</h1>
      </section>

      <SearchBar />

      <SectionGrid title="Trending" items={trending.results || []} />
      <SectionGrid title="Popular Movies" items={popularMovies.results || []} />
      <SectionGrid title="Popular TV" items={popularTv.results || []} />

      <ContinueWatching />
    </main>
  )
}

 

 


