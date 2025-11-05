"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NotSignedIn from "@/components/NotSignedIn";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export default function MoviesPage() {
  const { data: session, status } = useSession();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      loadPopularMovies();
    }
  }, [status]);

  const loadPopularMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tmdb/popular?type=movie");
      if (response.ok) {
        const data = await response.json();
        setMovies(data.results || []);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(searchQuery)}&type=movie`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayMovies = searchResults.length > 0 ? searchResults : movies;

  // 🔒 If user is not signed in
  if (status === "unauthenticated") {
    return <NotSignedIn />;
  }

  // ⏳ Loading session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Movies</h1>
          <p className="text-neutral-400">Discover and watch your favorite movies</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies..."
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-neutral-700 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "Searching..." : "Search"}
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
            {displayMovies.map((movie) => (
              <Link
                key={movie.id}
                href={`/watch/${movie.id}?type=movie`}
                className="group bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 overflow-hidden hover:bg-neutral-700/50 transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : "/placeholder.png"
                    }
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-brand-400 transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                    <span>★ {movie.vote_average.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {displayMovies.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-neutral-400">No movies found</p>
          </div>
        )}
      </div>
    </main>
  );
}
