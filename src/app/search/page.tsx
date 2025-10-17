import SectionGrid from '@/components/SectionGrid'

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q || '').trim()
  const base = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const res = q ? await fetch(`${base}/api/tmdb/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' }) : null
  const data = res && res.ok ? await res.json() : { results: [] }
  const results = data.results || []

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-xl">Search results for "{q}"</h1>
      <SectionGrid title="Results" items={results} />
    </main>
  )
}


