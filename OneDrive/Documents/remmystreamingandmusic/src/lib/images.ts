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

export function getUserAvatar(imagePath?: string | null) {
  // Default avatar for users without Discord profile picture
  if (!imagePath) return '/UnknownUser1024.png'
  
  // If it's a placeholder, use our default
  if (imagePath === '/placeholder.png') return '/UnknownUser1024.png'
  
  // Return the provided image path (could be Discord CDN URL or custom avatar)
  return imagePath
}


