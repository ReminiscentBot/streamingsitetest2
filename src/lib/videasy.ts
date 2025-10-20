// VideoEasy.net service for anime and fallback streaming
const VIDEASY_BASE_URL = 'https://player.videasy.net'

// Generate VideoEasy.net URL for movies
export function generateVideoEasyMovieUrl(tmdbId: string, options: {
  color?: string
  progress?: number
  overlay?: boolean
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.color) params.set('color', options.color)
  if (options.progress) params.set('progress', options.progress.toString())
  if (options.overlay) params.set('overlay', 'true')

  const queryString = params.toString()
  return `${VIDEASY_BASE_URL}/movie/${tmdbId}${queryString ? `?${queryString}` : ''}`
}

// Generate VideoEasy.net URL for TV shows
export function generateVideoEasyTVUrl(tmdbId: string, season: number, episode: number, options: {
  color?: string
  progress?: number
  overlay?: boolean
  nextEpisode?: boolean
  episodeSelector?: boolean
  autoplayNextEpisode?: boolean
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.color) params.set('color', options.color)
  if (options.progress) params.set('progress', options.progress.toString())
  if (options.overlay) params.set('overlay', 'true')
  if (options.nextEpisode) params.set('nextEpisode', 'true')
  if (options.episodeSelector) params.set('episodeSelector', 'true')
  if (options.autoplayNextEpisode) params.set('autoplayNextEpisode', 'true')

  const queryString = params.toString()
  return `${VIDEASY_BASE_URL}/tv/${tmdbId}/${season}/${episode}${queryString ? `?${queryString}` : ''}`
}

// Generate VideoEasy.net URL for anime shows
export function generateVideoEasyAnimeUrl(anilistId: number, episode: number, options: {
  dub?: boolean
  color?: string
  progress?: number
  overlay?: boolean
  nextEpisode?: boolean
  episodeSelector?: boolean
  autoplayNextEpisode?: boolean
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.dub) params.set('dub', 'true')
  if (options.color) params.set('color', options.color)
  if (options.progress) params.set('progress', options.progress.toString())
  if (options.overlay) params.set('overlay', 'true')
  if (options.nextEpisode) params.set('nextEpisode', 'true')
  if (options.episodeSelector) params.set('episodeSelector', 'true')
  if (options.autoplayNextEpisode) params.set('autoplayNextEpisode', 'true')

  const queryString = params.toString()
  return `${VIDEASY_BASE_URL}/anime/${anilistId}/${episode}${queryString ? `?${queryString}` : ''}`
}

// Generate VideoEasy.net URL for anime movies
export function generateVideoEasyAnimeMovieUrl(anilistId: number, options: {
  dub?: boolean
  color?: string
  progress?: number
  overlay?: boolean
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.dub) params.set('dub', 'true')
  if (options.color) params.set('color', options.color)
  if (options.progress) params.set('progress', options.progress.toString())
  if (options.overlay) params.set('overlay', 'true')

  const queryString = params.toString()
  return `${VIDEASY_BASE_URL}/anime/${anilistId}${queryString ? `?${queryString}` : ''}`
}

// Test if VideoEasy.net URL is accessible
export async function testVideoEasyUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    })
    return true // If we can make the request, assume it's working
  } catch (error) {
    console.error('VideoEasy URL test failed:', error)
    return false
  }
}

// Get VideoEasy.net URL with fallback
export async function getVideoEasyUrl(
  tmdbId: string, 
  type: 'movie' | 'tv', 
  season?: number, 
  episode?: number,
  anilistId?: number,
  options: any = {}
): Promise<string | null> {
  try {
    let url: string

    if (anilistId) {
      // Anime content
      if (type === 'movie') {
        url = generateVideoEasyAnimeMovieUrl(anilistId, options)
      } else if (type === 'tv' && episode) {
        url = generateVideoEasyAnimeUrl(anilistId, episode, options)
      } else {
        return null
      }
    } else {
      // Regular movies/TV shows
      if (type === 'movie') {
        url = generateVideoEasyMovieUrl(tmdbId, options)
      } else if (type === 'tv' && season && episode) {
        url = generateVideoEasyTVUrl(tmdbId, season, episode, options)
      } else {
        return null
      }
    }

    // Test the URL
    const isAccessible = await testVideoEasyUrl(url)
    if (isAccessible) {
      return url
    }

    return null
  } catch (error) {
    console.error('Error getting VideoEasy URL:', error)
    return null
  }
}

// Event listener for VideoEasy player events
export function setupVideoEasyEventListeners() {
  window.addEventListener('message', ({ origin, data }) => {
    if (origin !== VIDEASY_BASE_URL || !data) {
      return
    }

    if (typeof data === 'string') {
      try {
        const messageData = JSON.parse(data)
        console.log('VideoEasy message:', messageData)
        
        // Handle VideoEasy events here
        // You can dispatch custom events or update state
      } catch (error) {
        console.log('VideoEasy raw message:', data)
      }
    }
  })
}
