export function getPosterUrl(path?: string | null) {
  if (path) return `https://image.tmdb.org/t/p/w300${path}`
  return '/placeholder.png'
}


