// Central streaming service with intelligent fallback
import { isAnimeContent, findAnilistMatch, AnilistAnime } from './anilist'
import { getVidFastUrl, setupVidFastEventListeners } from './vidfast'
import { getVideoEasyUrl, setupVideoEasyEventListeners } from './videasy'

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
  type: 'movie' | 'tv' | 'anime',
  season?: number,
  episode?: number,
  tmdbData?: any,
  options: StreamingOptions = {}
): Promise<StreamingResult | null> {
  try {
    console.log('🎬 Getting streaming URL for:', { tmdbId, type, season, episode })

    // Detect if content is anime
    const isAnime = type === 'anime' || (tmdbData && isAnimeContent(tmdbData))
    console.log('🎌 Is anime:', isAnime)

    let anilistData: AnilistAnime | null = null
    if (isAnime) {
      try {
        anilistData = await findAnilistMatch(tmdbData)
        console.log('🎌 Anilist data found:', anilistData?.title.english || anilistData?.title.romaji)
      } catch (error) {
        console.warn('⚠️ Could not get Anilist data:', error)
      }
    }

    // Determine service priority based on content type
    const services = isAnime 
      ? ['videasy', 'vidfast'] // Anime: VideoEasy first, VidFast fallback
      : ['vidfast', 'videasy'] // Movies/TV: VidFast first, VideoEasy fallback

    console.log('🔧 Service priority:', services)

    // Try each service in order
    for (let i = 0; i < services.length; i++) {
      const service = services[i]
      const isFallback = i > 0

      try {
        console.log(`🔍 Trying ${service}${isFallback ? ' (fallback)' : ''}...`)

        let url: string | null = null

        if (service === 'vidfast') {
          url = await getVidFastUrl(tmdbId, type, season, episode, {
            autoPlay: options.autoPlay ?? true,
            title: options.title ?? true,
            poster: options.poster ?? true,
            theme: options.theme,
            server: options.server,
            hideServer: options.hideServer,
            fullscreenButton: options.fullscreenButton,
            chromecast: options.chromecast,
            sub: options.sub,
            startAt: options.startAt,
            nextButton: options.nextButton ?? (type === 'tv'),
            autoNext: options.autoNext ?? (type === 'tv')
          })
               } else if (service === 'videasy') {
                 // For VideoEasy, if we have anime type but no anilist data, treat as TV
                 const videoEasyType = (type === 'anime' && !anilistData) ? 'tv' : type
                 // Ensure we have valid season/episode for TV shows
                 const videoEasySeason = (videoEasyType === 'tv' || type === 'anime') ? (season || 1) : undefined
                 const videoEasyEpisode = (videoEasyType === 'tv' || type === 'anime') ? (episode || 1) : undefined
                 
                 url = await getVideoEasyUrl(
                   tmdbId, 
                   videoEasyType as 'movie' | 'tv', 
                   videoEasySeason, 
                   videoEasyEpisode,
                   anilistData?.id,
                   {
                     color: options.color,
                     progress: options.startAt,
                     overlay: options.overlay ?? true,
                     nextEpisode: options.nextButton ?? (type === 'tv'),
                     episodeSelector: options.episodeSelector ?? (type === 'tv'),
                     autoplayNextEpisode: options.autoplayNextEpisode ?? (type === 'tv'),
                     dub: options.dub ?? false
                   }
                 )
        }

        if (url) {
          console.log(`✅ ${service} URL found:`, url)
          return {
            url,
            service: service as 'vidfast' | 'videasy',
            isAnime,
            anilistData: anilistData || undefined,
            fallbackUsed: isFallback
          }
        } else {
          console.log(`❌ ${service} failed to generate URL`)
        }
      } catch (error) {
        console.error(`❌ ${service} error:`, error)
      }
    }

    console.log('❌ All streaming services failed')
    return null
  } catch (error) {
    console.error('❌ Error in getStreamingUrl:', error)
    return null
  }
}

// Get all available streaming options with priorities
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
    const isAnime = isAnimeContent(tmdbData)
    const services = isAnime 
      ? ['videasy', 'vidfast'] 
      : ['vidfast', 'videasy']

    for (let i = 0; i < services.length; i++) {
      const service = services[i]
      const priority = i + 1

      try {
        let url: string | null = null

        if (service === 'vidfast') {
          url = await getVidFastUrl(tmdbId, type, season, episode, options)
        } else if (service === 'videasy') {
          url = await getVideoEasyUrl(tmdbId, type, season, episode, undefined, options)
        }

        if (url) {
          results.push({
            url,
            service: service as 'vidfast' | 'videasy',
            isAnime,
            fallbackUsed: false,
            priority
          })
        }
      } catch (error) {
        console.error(`Error getting ${service} URL:`, error)
      }
    }
  } catch (error) {
    console.error('Error getting streaming options:', error)
  }

  return results
}

// Setup event listeners for both services
export function setupStreamingEventListeners() {
  setupVidFastEventListeners()
  setupVideoEasyEventListeners()
}

// Get service status
export async function getServiceStatus() {
  try {
    const vidfastStatus = await import('./vidfast').then(m => m.getServerStatus())
    return {
      vidfast: vidfastStatus,
      videasy: { status: 'unknown' } // VideoEasy doesn't have status API
    }
  } catch (error) {
    console.error('Error getting service status:', error)
    return {
      vidfast: null,
      videasy: { status: 'unknown' }
    }
  }
}
