"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

export default function SearchBar() {
  const [q, setQ] = useState('')
  const router = useRouter()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/search?q=${encodeURIComponent(q.trim())}`)
      }}
      className="flex items-center gap-2 w-full max-w-xl"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies, TV shows..."
        className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-4 py-2 outline-none"
      />
      <button className="btn" aria-label="Search">
        <FontAwesomeIcon icon={faSearch} />
        Search
      </button>
    </form>
  )
}


