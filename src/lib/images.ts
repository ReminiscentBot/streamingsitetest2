export function getPosterUrl(path?: string | null) {
  if (!path) return '/placeholder.png'
  
  // If it's already a full URL or starts with /, return as is
  if (path.startsWith('http') || path.startsWith('/')) {
    return path
  }
  
  // Otherwise, prepend the TMDB base URL
  return `https://image.tmdb.org/t/p/w300${path}`
}


