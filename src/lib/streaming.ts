// Main streaming service that handles VidFast.pro, VideoEasy.net, and fallbacks
import { isAnimeContent, findAnilistMatch, AnilistAnime } from './anilist'
import { getVidFastUrl } from './vidfast'
import { getVideoEasyUrl } from './videasy'

export interface StreamingOptions {
  autoPlay?: boolean
  title?: boolean
  poster?: boolean
  theme?: string
  server?: string
  hideServer?: boolean
  fullscreenButton?: boolean
  chromecast?: boolean
  sub?: string
  startAt?: number
  nextButton?: boolean
  autoNext?: boolean
  color?: string
  overlay?: boolean
  episodeSelector?: boolean
  autoplayNextEpisode?: boolean
  dub?: boolean
}

export interface StreamingResult {
  url: string
  service: 'vidfast' | 'videasy'
  isAnime: boolean
  anilistData?: AnilistAnime
  fallbackUsed: boolean
}

// Main function to get streaming URL with intelligent fallback
export async function getStreamingUrl(
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
  tmdbData?: any,
  options: StreamingOptions = {}
): Promise<StreamingResult | null> {
  try {
    console.log('🎬 Getting streaming URL for:', { tmdbId, type, season, episode })

    // Check if content is anime
    const isAnime = tmdbData ? isAnimeContent(tmdbData) : false
    let anilistData: AnilistAnime | null = null

    // If it's anime, try to get Anilist data
    if (isAnime && tmdbData) {
      console.log('🎌 Detected anime content, finding Anilist match...')
      anilistData = await findAnilistMatch(tmdbData)
      
      if (anilistData) {
        console.log('✅ Found Anilist match:', anilistData.title.english || anilistData.title.romaji)
      } else {
        console.log('❌ No Anilist match found, treating as regular content')
      }
    }

    // Strategy 1: Try VidFast.pro first (for movies and TV shows)
    if (!isAnime || !anilistData) {
      console.log('🎯 Trying VidFast.pro...')
      const vidfastUrl = await getVidFastUrl(tmdbId, type, season, episode, options)
      
      if (vidfastUrl) {
        console.log('✅ VidFast.pro URL found:', vidfastUrl)
        return {
          url: vidfastUrl,
          service: 'vidfast',
          isAnime: false,
          fallbackUsed: false
        }
      }
      console.log('❌ VidFast.pro failed')
    }

    // Strategy 2: Try VideoEasy.net (for anime or as fallback)
    console.log('🎯 Trying VideoEasy.net...')
    const videasyUrl = await getVideoEasyUrl(
      tmdbId, 
      type, 
      season, 
      episode, 
      anilistData?.id,
      options
    )
    
    if (videasyUrl) {
      console.log('✅ VideoEasy.net URL found:', videasyUrl)
      return {
        url: videasyUrl,
        service: 'videasy',
        isAnime: isAnime,
        anilistData: anilistData || undefined,
        fallbackUsed: isAnime ? false : true
      }
    }
    console.log('❌ VideoEasy.net failed')

    // Strategy 3: If anime but no Anilist match, try VideoEasy with TMDB ID
    if (isAnime && anilistData) {
      console.log('🎯 Trying VideoEasy.net with TMDB ID as fallback...')
      const videasyFallbackUrl = await getVideoEasyUrl(tmdbId, type, season, episode, undefined, options)
      
      if (videasyFallbackUrl) {
        console.log('✅ VideoEasy.net fallback URL found:', videasyFallbackUrl)
        return {
          url: videasyFallbackUrl,
          service: 'videasy',
          isAnime: true,
          anilistData: anilistData,
          fallbackUsed: true
        }
      }
    }

    console.log('❌ All streaming services failed')
    return null

  } catch (error) {
    console.error('Error getting streaming URL:', error)
    return null
  }
}

// Get multiple streaming options for user selection
export async function getStreamingOptions(
  tmdbId: string,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number,
  tmdbData?: any,
  options: StreamingOptions = {}
): Promise<Array<StreamingResult & { priority: number }>> {
  const results: Array<StreamingResult & { priority: number }> = []

  try {
    const isAnime = tmdbData ? isAnimeContent(tmdbData) : false
    let anilistData: AnilistAnime | null = null

    if (isAnime && tmdbData) {
      anilistData = await findAnilistMatch(tmdbData)
    }

    // Try VidFast.pro
    if (!isAnime || !anilistData) {
      const vidfastUrl = await getVidFastUrl(tmdbId, type, season, episode, options)
      if (vidfastUrl) {
        results.push({
          url: vidfastUrl,
          service: 'vidfast',
          isAnime: false,
          fallbackUsed: false,
          priority: 1
        })
      }
    }

    // Try VideoEasy.net
    const videasyUrl = await getVideoEasyUrl(tmdbId, type, season, episode, anilistData?.id, options)
    if (videasyUrl) {
      results.push({
        url: videasyUrl,
        service: 'videasy',
        isAnime: isAnime,
        anilistData: anilistData || undefined,
        fallbackUsed: isAnime ? false : true,
        priority: isAnime ? 1 : 2
      })
    }

    // Sort by priority
    return results.sort((a, b) => a.priority - b.priority)

  } catch (error) {
    console.error('Error getting streaming options:', error)
    return []
  }
}

// Setup event listeners for both services
export function setupStreamingEventListeners() {
  // Import and setup VidFast listeners
  import('./vidfast').then(({ setupVidFastEventListeners }) => {
    setupVidFastEventListeners()
  })

  // Import and setup VideoEasy listeners
  import('./videasy').then(({ setupVideoEasyEventListeners }) => {
    setupVideoEasyEventListeners()
  })
}

// Get service status for debugging
export async function getServiceStatus() {
  try {
    const vidfastStatus = await import('./vidfast').then(m => m.getServerStatus())
    return {
      vidfast: vidfastStatus,
      videasy: { status: 'operational' } // VideoEasy doesn't have status API
    }
  } catch (error) {
    console.error('Error getting service status:', error)
    return {
      vidfast: null,
      videasy: { status: 'unknown' }
    }
  }
}
