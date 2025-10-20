"use client"
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Recommendations from './Recommendations'
import Related from './Related'
import EpisodeList from '@/components/EpisodeList'
import ShowDetails from '@/components/ShowDetails'
import VideoPlayer from '@/components/VideoPlayer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faSearch, faBell, faUser, faTh, faList, faFilter } from '@fortawesome/free-solid-svg-icons'
import { getStreamingUrl, setupStreamingEventListeners, StreamingResult } from '@/lib/streaming'

export default function WatchPage({ params }: { params: { id: string } }) {
  const search = useSearchParams()
  const type = (search?.get('type') || 'movie').toLowerCase()
  const [season, setSeason] = useState(1)
  const [episode, setEpisode] = useState(1)
  const [apiVersion, setApiVersion] = useState<'1' | '2' | '3' | '4'>('3')
  const fallbackOrder: Array<'3'|'4'|'1'|'2'> = ['3','4','1','2']
  const [autoTried, setAutoTried] = useState<Record<string, boolean>>({}) // APIs that produced MEDIA_DATA
  const [attempted, setAttempted] = useState<Record<string, boolean>>({})   // APIs we've already tried this session
  const [autoMode, setAutoMode] = useState(true)
  const [userInteracted, setUserInteracted] = useState(false)
  const [allApisFailed, setAllApisFailed] = useState(false)
  const [sslError, setSslError] = useState(false)
  const [blurPlayer, setBlurPlayer] = useState(false)
  const isTv = type === 'tv'
  const keyBase = `${params.id}-${isTv ? 'tv' : 'movie'}`
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

  // Track activity when user starts watching
  const trackActivity = async (title: string, poster: string) => {
    try {
      console.log('🎬 Tracking activity:', { title, poster, tmdbId: params.id, type: isTv ? 'tv' : 'movie' })
      const response = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: parseInt(params.id),
          type: isTv ? 'tv' : 'movie',
          season: isTv ? season : undefined,
          episode: isTv ? episode : undefined,
          title,
          poster
        })
      })
      
      if (response.ok) {
        console.log('✅ Activity tracked successfully')
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to track activity:', response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }

  // Track presence for watch pages
  const trackPresence = async () => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPage: isTv ? 'Watching TV Shows' : 'Watching Movies',
          pageType: 'watching',
          mediaType: isTv ? 'tv' : 'movie'
        })
      })
    } catch (error) {
      console.error('Failed to track presence:', error)
    }
  }

  // Setup streaming event listeners on mount
  useEffect(() => {
    setupStreamingEventListeners()
  }, [])

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
    if (!streamingResult) return ''
    return streamingResult.url
  }, [streamingResult])

  // Mark the current API as attempted whenever we switch to it
  useEffect(() => {
    setAttempted((prev) => ({ ...prev, [apiVersion]: true }))
  }, [apiVersion])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const allowed = event.origin === 'https://vidsrc.wtf' || event.origin === 'https://www.vidsrc.wtf'
      if (!allowed) return
      if ((event as any).data?.type === 'MEDIA_DATA') {
        try {
          const mediaData = (event as any).data.data
          setMediaData(mediaData)
          const key = 'vidsrcwtf-Progress'
          localStorage.setItem(key, JSON.stringify(mediaData))
          // Mark current apiVersion as good and persist preference
          setAutoTried((prev) => ({ ...prev, [apiVersion]: true }))
          try {
            const prefKey = 'vidsrc-preferred-api'
            const map = JSON.parse(localStorage.getItem(prefKey) || '{}')
            map[keyBase] = apiVersion
            localStorage.setItem(prefKey, JSON.stringify(map))
          } catch {}
          // Lock once we get media data to avoid switching away
          setUserInteracted(true)
        } catch {}
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Prefill season/episode from localStorage if available
  useEffect(() => {
    if (!isTv) return
    try {
      const raw = localStorage.getItem('vidsrcwtf-Progress')
      if (!raw) return
      const data = JSON.parse(raw)
      const entry = data?.[params.id]
      if (entry?.type === 'tv') {
        const s = parseInt(entry.last_season_watched || '1')
        const e = parseInt(entry.last_episode_watched || '1')
        if (s > 0) setSeason(s)
        if (e > 0) setEpisode(e)
      }
    } catch {}
  }, [isTv, params.id])

  // Load preferred API if we have one
  useEffect(() => {
    try {
      const prefKey = 'vidsrc-preferred-api'
      const map = JSON.parse(localStorage.getItem(prefKey) || '{}')
      const pref = map[keyBase]
      if (pref && ['1','2','3','4'].includes(pref)) setApiVersion(pref)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch original language to deprioritize API 2 unless it matches
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/tmdb/details?id=${params.id}&type=${isTv ? 'tv' : 'movie'}`)
        const d = await res.json()
        setOriginalLang(d?.original_language || '')
      } catch {}
    }
    load()
  }, [params.id, isTv])

  // Fetch show data from TMDB
  useEffect(() => {
    const fetchShowData = async () => {
      try {
        console.log('🔍 Fetching TMDB data for:', { id: params.id, type: isTv ? 'tv' : 'movie' })
        const response = await fetch(`/api/tmdb/details?id=${params.id}&type=${isTv ? 'tv' : 'movie'}`)
        const data = await response.json()
        console.log('📊 TMDB data received:', { title: data.title || data.name, poster: data.poster_path })
        setShowData(data)
      } catch (error) {
        console.error('Failed to fetch show data:', error)
      }
    }
    fetchShowData()
  }, [params.id, isTv])

  // Track activity when we have proper TMDB data (only once per show)
  useEffect(() => {
    console.log('🔍 Activity tracking useEffect triggered:', { 
      mediaData: !!mediaData, 
      showData: !!showData,
      showDataTitle: showData?.title || showData?.name,
      showDataPoster: showData?.poster_path
    })
    if (showData && (showData.title || showData.name)) {
      // Only use TMDB data for accurate titles
      const title = showData.title || showData.name
      const poster = showData.poster_path ? `https://image.tmdb.org/t/p/w500${showData.poster_path}` : ''
      const showKey = `${title}-${params.id}` // Unique key for this show
      
      // Only track if this is a different show than last tracked
      if (showKey !== lastTrackedShow) {
        console.log('🎬 Calling trackActivity with TMDB data:', { title, poster, showKey })
        setLastTrackedShow(showKey)
        trackActivity(title, poster)
      } else {
        console.log('⏭️ Skipping duplicate activity tracking for:', title)
      }
    } else {
      console.log('⏳ Waiting for proper TMDB data...', { 
        hasShowData: !!showData,
        hasTitle: !!(showData?.title || showData?.name)
      })
    }
  }, [showData, params.id, lastTrackedShow])

  // Fetch current episode data for TV shows
  useEffect(() => {
    if (!isTv) return
    
    const fetchEpisodeData = async () => {
      try {
        const response = await fetch(`/api/tmdb/episodes?id=${params.id}&season=${season}`)
        const data = await response.json()
        const currentEp = data.episodes?.find((ep: any) => ep.episode_number === episode)
        setCurrentEpisodeData(currentEp)
      } catch (error) {
        console.error('Failed to fetch episode data:', error)
      }
    }

    fetchEpisodeData()
  }, [isTv, params.id, season, episode])

  // Auto-pick best working API: if no MEDIA_DATA received within timeout, try next in order
  useEffect(() => {
    const key = `${params.id}-${isTv ? 'tv' : 'movie'}-${season}-${episode}`
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (cancelled) return
      // Only auto-switch if we haven't received media data, user hasn't manually selected, and we haven't tried this API yet
      if (autoMode && !userInteracted && !autoTried[apiVersion] && !attempted[apiVersion]) {
        // move to next not-yet-attempted API; keep API 2 strictly last
        const tried = new Set(Object.keys(attempted).filter(k => attempted[k]))
        let candidates = fallbackOrder.filter(v => !tried.has(v))
        // If multiple remain and one of them is '2', hold it back unless it's the only one left
        if (candidates.length > 1) {
          candidates = candidates.filter(v => v !== '2')
        }
        const next = candidates[0]
        if (next && next !== apiVersion) {
          setApiVersion(next)
        } else {
          // nothing else to try; stop auto mode to prevent bouncing
          setAutoMode(false)
        }
      }
    }, 10000) // Increased to 10s to give more time for loading
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // re-run when these change
  }, [params.id, isTv, season, episode, apiVersion, autoTried, autoMode, userInteracted, attempted])

  // Report activity when selection changes (fallback)
  useEffect(() => {
    const report = async () => {
      try {
        console.log('Reporting activity fallback:', { tmdbId: params.id, type: isTv ? 'tv' : 'movie', season, episode })
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdbId: Number(params.id),
            type: isTv ? 'tv' : 'movie',
            season,
            episode,
            title: `TMDB ${isTv ? 'TV' : 'Movie'} ${params.id}`,
            poster: ''
          }),
        })
      } catch (error) {
        console.error('Failed to report activity:', error)
      }

    }
    report()
  }, [params.id, isTv, season, episode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      <div className="flex">
        {/* Left Sidebar - Empty for now */}
        <div className="w-16 bg-neutral-900/70">
          {/* Empty left column as shown in screenshots */}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Center Column - Video Player and Show Details */}
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
                          {streamingResult.service === 'vidfast' ? 'VidFast.pro' : 'VideoEasy.net'}
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
                  
                  {/* Legacy API controls (hidden for now) */}
                  <div className="hidden">
                    <select 
                      value={apiVersion} 
                      onChange={(e) => {
                        setApiVersion(e.target.value as any)
                        setUserInteracted(true)
                      }} 
                      className="rounded-md bg-neutral-800 border border-neutral-700 px-3 py-1 text-white text-xs"
                    >
                      <option value="1">API 1</option>
                      <option value="2">API 2</option>
                      <option value="3">API 3</option>
                      <option value="4">API 4</option>
                    </select>
                    <label className="text-white flex items-center gap-1">
                      <input type="checkbox" checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} className="rounded" />
                      Auto
                    </label>
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
                  setAllApisFailed(false)
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

              {/* Episode Information - Below Player */}
              {isTv && currentEpisodeData && (
                <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {episode}. {currentEpisodeData.name}
                  </h2>
                  {currentEpisodeData.air_date && (
                    <p className="text-neutral-400 text-sm mb-3">
                      {(() => {
                        try {
                          const date = new Date(currentEpisodeData.air_date)
                          if (isNaN(date.getTime())) return currentEpisodeData.air_date
                          return date.toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        } catch (error) {
                          return currentEpisodeData.air_date
                        }
                      })()}
                    </p>
                  )}
                  {currentEpisodeData.overview && (
                    <p className="text-neutral-300 text-base leading-relaxed">
                      {currentEpisodeData.overview}
                    </p>
                  )}
                </div>
              )}

              {/* Show Details */}
              <div className="flex justify-center">
                <div className="w-full max-w-6xl -ml-2">
                  <ShowDetails
                    tmdbId={params.id}
                    type={isTv ? 'tv' : 'movie'}
                    currentEpisode={episode}
                    currentSeason={season}
                  />
                </div>
              </div>
            </div>

            {/* Right Sidebar - Episodes, Related, and Recommendations */}
            <div className="flex flex-col space-y-6">
              {/* Episodes List - Original size */}
              {isTv && (
                <div>
                  <EpisodeList
                    tmdbId={params.id}
                    season={season}
                    currentEpisode={episode}
                    onEpisodeSelect={setEpisode}
                    onSeasonChange={setSeason}
                    onBlurToggle={setBlurPlayer}
                    blurPlayer={blurPlayer}
                  />
                </div>
              )}

              {/* Related Content */}
              <Related id={params.id} type={isTv ? 'tv' : 'movie'} />

              {/* Recommendations */}
              <Recommendations id={params.id} type={isTv ? 'tv' : 'movie'} />
            </div>
          </div>
        </div>
      </div>


      {/* Error Modal */}
      {allApisFailed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-900 rounded-lg p-8 max-w-md mx-4">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-white text-xl font-semibold mb-4">
              {sslError ? 'SSL Security Error' : 'Stream Not Available'}
            </h2>
            <div className="text-neutral-400 text-sm mb-6">
              {sslError ? (
                <>
                  <div className="text-red-300 mb-3">
                    ERR_SSL_PROTOCOL_ERROR detected
                  </div>
                  <div className="mb-3">
                    This is a browser security issue. Try:
                  </div>
                  <ul className="space-y-1">
                    <li>• Use incognito/private mode</li>
                    <li>• Try a different browser</li>
                    <li>• Disable browser extensions</li>
                    <li>• Use mobile data instead of WiFi</li>
                    <li>• Check antivirus/firewall settings</li>
                  </ul>
                </>
              ) : (
                <>
                  All streaming sources are currently unavailable. This might be due to:
                  <ul className="mt-2 space-y-1">
                    <li>• Geographic restrictions</li>
                    <li>• Network connectivity issues</li>
                    <li>• SSL/Certificate errors</li>
                    <li>• Browser security settings</li>
                    <li>• Corporate/school network blocking</li>
                  </ul>
                  <div className="mt-3 text-xs text-neutral-500">
                    Try: Different browser, incognito mode, or mobile data
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => {
                setAllApisFailed(false)
                setSslError(false)
                setApiVersion('3')
                setAttempted({})
                setAutoTried({})
              }}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


