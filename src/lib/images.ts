export function getPosterUrl(path?: string | null) {
  if (!path) return '/placeholder.png'
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) {
    return path
  }
  
  // If it starts with / and is a known local file, return as is
  if (path.startsWith('/') && (path === '/placeholder.png' || path.startsWith('/public/'))) {
    return path
  }
  
  // If it starts with / but is not a local file, it's a TMDB path, prepend the base URL
  if (path.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${path}`
  }
  
  // Otherwise, it's a TMDB path, prepend the base URL
  return `https://image.tmdb.org/t/p/w500/${path}`
}


