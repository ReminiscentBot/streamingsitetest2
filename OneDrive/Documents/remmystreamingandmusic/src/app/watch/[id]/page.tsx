"use client"
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Recommendations from './Recommendations'
import Related from './Related'
import EpisodeList from '@/components/EpisodeList'
import ShowDetails from '@/components/ShowDetails'
import VideoPlayer from '@/components/VideoPlayer'
import PopupBlockerBanner from '@/components/PopupBlockerBanner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faSearch, faBell, faUser, faTh, faList, faFilter } from '@fortawesome/free-solid-svg-icons'
import { getStreamingUrl, setupStreamingEventListeners, StreamingResult } from '@/lib/streaming'
import { useSession } from 'next-auth/react'
import NotSignedIn from '@/components/NotSignedIn'

export default function WatchPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const search = useSearchParams()
  const type = (search?.get('type') || 'movie').toLowerCase()
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [blurPlayer, setBlurPlayer] = useState(false)
  const isTv = type === 'tv'
  const [originalLang, setOriginalLang] = useState<string>('')
  const [mediaData, setMediaData] = useState<any>(null)
  const [currentEpisodeData, setCurrentEpisodeData] = useState<any>(null)
  const [showData, setShowData] = useState<any>(null)
  const [lastTrackedShow, setLastTrackedShow] = useState<string | null>(null)

  // New streaming service states
  const [streamingResult, setStreamingResult] = useState<StreamingResult | null>(null)
  const [streamingLoading, setStreamingLoading] = useState(false)
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [isAnime, setIsAnime] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)
  const [showBanner, setShowBanner] = useState(true)

  // If user is not signed in, show the same component as home
  if (status === "unauthenticated") {
    return <NotSignedIn />
  }

  // Track presence when component mounts
  useEffect(() => {
    trackPresence()
  }, [isTv])

  // Stop watching when component unmounts
  useEffect(() => {
    return () => {
      // Call stop watching API when user leaves the watch page
      fetch('/api/activity/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).catch(error => {
        console.error('Failed to stop watching:', error)
      })
    }
  }, [])

  // Setup streaming event listeners on mount
  useEffect(() => {
    setupStreamingEventListeners()
  }, [])

  // Load last watched episode for TV shows on mount
  useEffect(() => {
    if (!isTv || !params.id) return
    
    const loadLastWatched = async () => {
      try {
        const response = await fetch('/api/watchlist')
        if (response.ok) {
          const data = await response.json()
          const item = data.items.find((i: any) => i.tmdbId === parseInt(params.id))
          
          if (item && item.lastSeason && item.lastEpisode) {
            console.log('📺 Loading last watched: S', item.lastSeason, 'E', item.lastEpisode)
            setSeason(item.lastSeason)
            setEpisode(item.lastEpisode)
          }
        }
      } catch (error) {
        console.error('Failed to load last watched episode:', error)
      }
    }
    
    loadLastWatched()
  }, [params.id, isTv]) // Only run once on mount

  // Save last watched episode whenever season/episode changes (TV shows only)
  useEffect(() => {
    if (!isTv || !params.id || !showData) return
    
    const saveLastWatched = async () => {
      try {
        const payload = {
          tmdbId: parseInt(params.id),
          type: 'tv',
          title: showData.name || showData.title || 'Unknown',
          poster: showData.poster_path ? `https://image.tmdb.org/t/p/w500${showData.poster_path}` : null,
          lastSeason: season,
          lastEpisode: episode
        }
        console.log('📤 Saving last watched:', payload)
        
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('❌ Failed to save last watched:', errorData)
          return
        }
        
        console.log('💾 Saved last watched: S', season, 'E', episode)
      } catch (error) {
        console.error('❌ Exception saving last watched episode:', error)
      }
    }
    
    // Add a small delay to avoid too many API calls during rapid changes
    const timeoutId = setTimeout(saveLastWatched, 1000)
    return () => clearTimeout(timeoutId)
  }, [season, episode, isTv, params.id, showData])

  // Get streaming URL when parameters change
  useEffect(() => {
    const getStreamingUrlAsync = async () => {
      if (!params.id) return

      setStreamingLoading(true)
      setStreamingError(null)

      try {
        console.log('🎬 Getting streaming URL for:', { tmdbId: params.id, type, season, episode })

        const result = await getStreamingUrl(
          params.id,
          type as 'movie' | 'tv',
          isTv ? season : undefined,
          isTv ? episode : undefined,
          showData, // Pass TMDB data for anime detection
          {
            autoPlay: true,
            title: true,
            poster: true,
            nextButton: isTv,
            autoNext: isTv,
            episodeSelector: isTv,
            overlay: true
          }
        )

        if (result) {
          setStreamingResult(result)
          setIsAnime(result.isAnime)
          console.log('✅ Streaming URL found:', result.url)
          console.log('🎌 Is anime:', result.isAnime)
          console.log('🔧 Service:', result.service)
        } else {
          setStreamingError('No streaming sources available')
          console.log('❌ No streaming sources found')
        }
      } catch (error) {
        console.error('❌ Error getting streaming URL:', error)
        setStreamingError('Failed to load streaming sources')
      } finally {
        setStreamingLoading(false)
      }
    }

    getStreamingUrlAsync()
  }, [params.id, type, season, episode, showData])

  // Get the current streaming URL
  const src = useMemo(() => {
    if (!streamingResult || !streamingResult.url) return ''
    // Validate URL to prevent constructor errors
    try {
      new URL(streamingResult.url)
      return streamingResult.url
    } catch (error) {
      console.error('❌ Invalid streaming URL:', streamingResult.url, error)
      return ''
    }
  }, [streamingResult])

  const trackActivity = async (title: string, poster: string) => {
    try {
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: params.id,
          type: type,
          season: isTv ? season : 1,
          episode: isTv ? episode : 1,
          title: title,
          poster: poster
        })
      })

      if (!response.ok) {
        throw new Error('Activity tracking failed')
      }

      console.log('✅ Activity tracked successfully')
    } catch (error) {
      console.error('❌ Activity tracking error:', error)
    }
  }

  const trackPresence = async () => {
    try {
      const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPage: `/watch/${params.id}`,
          pageType: type,
          mediaType: type
        })
      })

      if (!response.ok) {
        throw new Error('Presence tracking failed')
      }
    } catch (error) {
      console.error('❌ Presence tracking error:', error)
    }
  }

  // Track activity when show data changes
  useEffect(() => {
    if (showData) {
      const showKey = `${showData.title}-${params.id}`
      
      try {
        //console.log('🎬 Calling trackActivity with TMDB data: ', showData.poster_path)
        
        trackActivity(showData.name || showData.title, `https://image.tmdb.org/t/p/w500${showData.poster_path}`)
        setLastTrackedShow(showKey)
      } catch (error) {
        console.log('I AHTE PEOPLE I HATE POEPL:', error)
      }
    }
  }, [showData, params.id, lastTrackedShow])

  const load = async () => {
    try {
      await fetchShowData()
      if (isTv) {
        await fetchEpisodeData()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const fetchShowData = async () => {
    try {
      const response = await fetch(`/api/tmdb/details?id=${params.id}&type=${type}`)
      if (!response.ok) throw new Error('Failed to fetch show data')
      
      const data = await response.json()
      console.log('📊 TMDB data received:', {
        title: data.title || data.name,
        poster: data.poster_path
      })
      
      setShowData(data)
      setOriginalLang(data.original_language || '')
    } catch (error) {
      console.error('Error fetching show data:', error)
    }
  }

  const fetchEpisodeData = async () => {
    try {
      const response = await fetch(`/api/tmdb/episodes?id=${params.id}&season=${season}`)
      if (!response.ok) throw new Error('Failed to fetch episode data')
      
      const data = await response.json()
      const currentEp = data.episodes.find((ep: any) => ep.episode_number === episode)
      
      if (currentEp) {
        setCurrentEpisodeData({
          ...currentEp,
          nextEpisode: currentEp.episode_number < data.episodes.length ? currentEp.episode_number + 1 : null,
          prevEpisode: currentEp.episode_number > 1 ? currentEp.episode_number - 1 : null
        })
      }
    } catch (error) {
      console.error('Error fetching episode data:', error)
    }
  }

  const report = async () => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Streaming Issue',
          details: `Streaming failed for ${type} ${params.id}`,
          tmdbId: params.id,
          type: type
        })
      })

      if (!response.ok) throw new Error('Report failed')
      alert('Issue reported successfully')
    } catch (error) {
      console.error('Error reporting issue:', error)
      alert('Failed to report issue')
    }
  }

  // Load data on mount
  useEffect(() => {
    load()
  }, [params.id, type])

  // Load episode data when season/episode changes
  useEffect(() => {
    if (!isTv || !params.id) return
    
    const loadEpisodeData = async () => {
      try {
        console.log(`📺 Fetching episode data: S${season} E${episode}`)
        const response = await fetch(`/api/tmdb/episodes?id=${params.id}&season=${season}`)
        if (!response.ok) throw new Error('Failed to fetch episode data')
        
        const data = await response.json()
        const currentEp = data.episodes.find((ep: any) => ep.episode_number === episode)
        
        if (currentEp) {
          console.log(`✅ Found episode data: ${currentEp.name}`)
          setCurrentEpisodeData({
            ...currentEp,
            nextEpisode: currentEp.episode_number < data.episodes.length ? currentEp.episode_number + 1 : null,
            prevEpisode: currentEp.episode_number > 1 ? currentEp.episode_number - 1 : null
          })
        } else {
          console.log(`⚠️ Episode not found: S${season} E${episode}`)
        }
      } catch (error) {
        console.error('Error fetching episode data:', error)
      }
    }
    
    loadEpisodeData()
  }, [season, episode, params.id, isTv])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="flex">
        <div className="w-16 bg-neutral-900/70"></div>
        <div className="flex-1 p-6">
          {/* Popup Blocker Banner */}
          {showBanner && (
            <PopupBlockerBanner onClose={() => setShowBanner(false)} />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Streaming Status - Above Player */}
              <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <label className="text-white">Streaming Service</label>
                    {streamingLoading && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span>Loading...</span>
                      </div>
                    )}
                    {streamingResult && (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          streamingResult.service === 'vidfast'
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                        }`}>
                          Reminiscent.fm Player
                        </span>
                        {streamingResult.isAnime && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-600/20 text-purple-400 border border-purple-600/30">
                            🎌 Anime
                          </span>
                        )}
                        {streamingResult.fallbackUsed && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                            Fallback
                          </span>
                        )}
                      </div>
                    )}
                    {streamingError && (
                      <div className="text-red-400 text-xs">
                        {streamingError}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Player */}
              <VideoPlayer
                src={src}
                title={showData?.title || showData?.name || 'Loading...'}
                blurPlayer={blurPlayer}
                onError={() => {
                  console.log('🚨 Streaming service failed, trying fallback...')
                  setStreamingError('Streaming service unavailable, trying fallback...')
                  // The streaming service will automatically try fallbacks
                  // This is just for UI feedback
                }}
                onLoad={() => {
                  console.log('✅ Video player loaded successfully')
                  setStreamingError(null)
                }}
                onPlayerStart={() => {
                  setBlurPlayer(false)
                  setUserInteracted(true)
                }}
                onNextEpisode={() => {
                  if (isTv && currentEpisodeData?.nextEpisode) {
                    setEpisode(currentEpisodeData.nextEpisode)
                  }
                }}
                onPrevEpisode={() => {
                  if (isTv && currentEpisodeData?.prevEpisode) {
                    setEpisode(currentEpisodeData.prevEpisode)
                  }
                }}
                hasNextEpisode={isTv && !!currentEpisodeData?.nextEpisode}
                hasPrevEpisode={isTv && !!currentEpisodeData?.prevEpisode}
              />

              {/* Error Modal */}
              {streamingError && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-red-400 text-lg">⚠️</div>
                    <div>
                      <h3 className="text-red-400 font-medium">Streaming Error</h3>
                      <p className="text-red-300 text-sm mt-1">{streamingError}</p>
                    </div>
                    <button
                      onClick={report}
                      className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      Report Issue
                    </button>
                  </div>
                </div>
              )}

              {/* Episode Details Window */}
              {isTv && currentEpisodeData && (
                <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {episode}. {currentEpisodeData.name}
                    </h2>
                    <p className="text-neutral-400 text-sm">
                      {currentEpisodeData.air_date ? new Date(currentEpisodeData.air_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'Release date not available'}
                    </p>
                  </div>
                  
                  {currentEpisodeData.overview && (
                    <div className="text-neutral-300 leading-relaxed">
                      <p>{currentEpisodeData.overview}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-neutral-400">
                    {currentEpisodeData.runtime && (
                      <span>Duration: {Math.floor(currentEpisodeData.runtime / 60)}h {currentEpisodeData.runtime % 60}m</span>
                    )}
                    {currentEpisodeData.vote_average > 0 && (
                      <span>Rating: {currentEpisodeData.vote_average.toFixed(1)}/10</span>
                    )}
                  </div>
                </div>
              )}

              {/* Show Details */}
              {showData && (
                <ShowDetails
                  tmdbId={params.id}
                  type={type as 'movie' | 'tv'}
                  currentEpisode={isTv ? episode : undefined}
                  currentSeason={isTv ? season : undefined}
                />
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Episode List for TV Shows */}
              {isTv && (
                <EpisodeList
                  tmdbId={params.id}
                  season={season}
                  currentEpisode={episode}
                  onEpisodeSelect={setEpisode}
                  onSeasonChange={setSeason}
                  onBlurToggle={setBlurPlayer}
                  blurPlayer={blurPlayer}
                />
              )}

              {/* Related Content */}
              <Related id={params.id} type={type as 'movie' | 'tv'} />
              
              {/* Recommendations */}
              <Recommendations id={params.id} type={type as 'movie' | 'tv'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}