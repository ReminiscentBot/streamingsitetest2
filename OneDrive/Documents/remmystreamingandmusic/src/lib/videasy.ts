// VideoEasy.net service integration
export function generateVideoEasyMovieUrl(tmdbId: string, options: {
  color?: string
  progress?: number
  overlay?: boolean
} = {}): string {
  const baseUrl = 'https://player.videasy.net/movie'
  const params = new URLSearchParams()

  if (options.color) params.set('color', options.color)
  if (options.progress !== undefined) params.set('progress', options.progress.toString())
  if (options.overlay !== undefined) params.set('overlay', options.overlay.toString())

  const queryString = params.toString()
  return `${baseUrl}/${tmdbId}${queryString ? `?${queryString}` : ''}`
}

export function generateVideoEasyTVUrl(tmdbId: string, season: number, episode: number, options: {
  color?: string
  progress?: number
  overlay?: boolean
  nextEpisode?: boolean
  episodeSelector?: boolean
  autoplayNextEpisode?: boolean
} = {}): string {
  const baseUrl = 'https://player.videasy.net/tv'
  const params = new URLSearchParams()

  if (options.color) params.set('color', options.color)
  if (options.progress !== undefined) params.set('progress', options.progress.toString())
  if (options.overlay !== undefined) params.set('overlay', options.overlay.toString())
  if (options.nextEpisode !== undefined) params.set('nextEpisode', options.nextEpisode.toString())
  if (options.episodeSelector !== undefined) params.set('episodeSelector', options.episodeSelector.toString())
  if (options.autoplayNextEpisode !== undefined) params.set('autoplayNextEpisode', options.autoplayNextEpisode.toString())

  const queryString = params.toString()
  return `${baseUrl}/${tmdbId}/${season}/${episode}${queryString ? `?${queryString}` : ''}`
}

export function generateVideoEasyAnimeUrl(anilistId: number, episode: number, options: {
  dub?: boolean
  color?: string
  progress?: number
  overlay?: boolean
  nextEpisode?: boolean
  episodeSelector?: boolean
  autoplayNextEpisode?: boolean
} = {}): string {
  const baseUrl = 'https://player.videasy.net/anime'
  const params = new URLSearchParams()

  if (options.dub !== undefined) params.set('dub', options.dub.toString())
  if (options.color) params.set('color', options.color)
  if (options.progress !== undefined) params.set('progress', options.progress.toString())
  if (options.overlay !== undefined) params.set('overlay', options.overlay.toString())
  if (options.nextEpisode !== undefined) params.set('nextEpisode', options.nextEpisode.toString())
  if (options.episodeSelector !== undefined) params.set('episodeSelector', options.episodeSelector.toString())
  if (options.autoplayNextEpisode !== undefined) params.set('autoplayNextEpisode', options.autoplayNextEpisode.toString())

  const queryString = params.toString()
  return `${baseUrl}/${anilistId}/${episode}${queryString ? `?${queryString}` : ''}`
}

export function generateVideoEasyAnimeMovieUrl(anilistId: number, options: {
  dub?: boolean
  color?: string
  progress?: number
  overlay?: boolean
} = {}): string {
  const baseUrl = 'https://player.videasy.net/anime'
  const params = new URLSearchParams()

  if (options.dub !== undefined) params.set('dub', options.dub.toString())
  if (options.color) params.set('color', options.color)
  if (options.progress !== undefined) params.set('progress', options.progress.toString())
  if (options.overlay !== undefined) params.set('overlay', options.overlay.toString())

  const queryString = params.toString()
  return `${baseUrl}/${anilistId}${queryString ? `?${queryString}` : ''}`
}

// Test if VideoEasy URL is accessible
export async function testVideoEasyUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    return response.ok
  } catch (error) {
    console.error('Error testing VideoEasy URL:', error)
    return false
  }
}

// Get VideoEasy URL with fallback logic
export async function getVideoEasyUrl(
  tmdbId: string, 
  type: 'movie' | 'tv' | 'anime', 
  season?: number, 
  episode?: number,
  anilistId?: number,
  options: any = {}
): Promise<string | null> {
  try {
    let url: string

    if (type === 'movie') {
      // Always treat movies as regular movies, not anime
      url = generateVideoEasyMovieUrl(tmdbId, options)
    } else if (type === 'anime') {
      if (anilistId) {
        // Anime with Anilist ID
        const animeEpisode = episode || 1
        url = generateVideoEasyAnimeUrl(anilistId, animeEpisode, options)
      } else {
        // Anime without Anilist ID - treat as TV show
        const animeSeason = season || 1
        const animeEpisode = episode || 1
        url = generateVideoEasyTVUrl(tmdbId, animeSeason, animeEpisode, options)
      }
    } else {
      if (anilistId) {
        // Anime TV show
        if (!episode) throw new Error('Episode required for anime TV shows')
        url = generateVideoEasyAnimeUrl(anilistId, episode, options)
      } else {
        // Regular TV show
        if (!season || !episode) throw new Error('Season and episode required for TV shows')
        url = generateVideoEasyTVUrl(tmdbId, season, episode, options)
      }
    }

    // Skip URL testing due to CORS restrictions
    // The iframe will handle loading and show appropriate errors
    console.log('VideoEasy URL generated:', url)

    return url
  } catch (error) {
    console.error('Error getting VideoEasy URL:', error)
    return null
  }
}

// Setup VideoEasy event listeners
export function setupVideoEasyEventListeners() {
  window.addEventListener('message', function (event) {
    try {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data)
        console.log('VideoEasy message received:', data)
        
        // Store progress data
        if (data.id && data.progress !== undefined) {
          localStorage.setItem('videoEasyProgress', JSON.stringify(data))
        }
      }
    } catch (error) {
      // Ignore non-JSON messages
    }
  })
}
