"use client"
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Recommendations from './Recommendations'
import RatingStars from '@/components/RatingStars'

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
  const isTv = type === 'tv'
  const keyBase = `${params.id}-${isTv ? 'tv' : 'movie'}`
  const [originalLang, setOriginalLang] = useState<string>('')
  const [mediaData, setMediaData] = useState<any>(null)

  // Track activity when user starts watching
  const trackActivity = async (title: string, poster: string) => {
    try {
      console.log('Tracking activity:', { title, poster, tmdbId: params.id, type: isTv ? 'tv' : 'movie' })
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
        console.log('Activity tracked successfully')
      } else {
        console.error('Failed to track activity:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }

  const src = useMemo(() => {
    return isTv
      ? `https://vidsrc.wtf/api/${apiVersion}/tv/?id=${params.id}&s=${season}&e=${episode}`
      : `https://vidsrc.wtf/api/${apiVersion}/movie/?id=${params.id}`
  }, [isTv, params.id, season, episode, apiVersion])

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

  // Track activity when media data is received
  useEffect(() => {
    if (mediaData && mediaData.title) {
      trackActivity(mediaData.title, mediaData.poster || '')
    }
  }, [mediaData])

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
    <main className="max-w-6xl mx-auto p-6">
      <div className="space-y-4">
        {/* Rating Section */}
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Rate this {isTv ? 'show' : 'movie'}</h3>
          <RatingStars 
            tmdbId={parseInt(params.id)} 
            type={isTv ? 'tv' : 'movie'} 
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap" onClick={() => setUserInteracted(true)}>
          <label className="text-sm">Player</label>
          <select value={apiVersion} onChange={(e) => {
            setApiVersion(e.target.value as any)
            setUserInteracted(true) // Disable auto-mode when user manually selects
          }} className="rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2">
            <option value="1">API 1 (Multi Server)</option>
            <option value="2">API 2 (Multi Language)</option>
            <option value="3">API 3 (Multi Embeds)</option>
            <option value="4">API 4 (Premium Embeds)</option>
          </select>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={autoMode} onChange={(e) => setAutoMode(e.target.checked)} /> Auto
          </label>
          {isTv && (
            <>
              <label className="text-sm">Season</label>
              <input type="number" min={1} value={season} onChange={(e) => setSeason(parseInt(e.target.value || '1'))} className="w-24 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2" />
              <label className="text-sm">Episode</label>
              <input type="number" min={1} value={episode} onChange={(e) => setEpisode(parseInt(e.target.value || '1'))} className="w-24 rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2" />
            </>
          )}
        </div>

        {allApisFailed ? (
          <div className="w-full h-[60vh] rounded-lg border border-neutral-800 bg-neutral-900 flex items-center justify-center flex-col space-y-4">
            <div className="text-red-400 text-xl">⚠️</div>
            <div className="text-white text-lg font-semibold">
              {sslError ? 'SSL Security Error' : 'Stream Not Available'}
            </div>
            <div className="text-neutral-400 text-center max-w-md">
              {sslError ? (
                <>
                  <div className="text-red-300 mb-3">
                    ERR_SSL_PROTOCOL_ERROR detected
                  </div>
                  <div className="text-sm">
                    This is a browser security issue. Try:
                  </div>
                  <ul className="mt-2 text-sm space-y-1">
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
                  <ul className="mt-2 text-sm space-y-1">
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
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 rounded text-white"
            >
              Try Again
            </button>
          </div>
        ) : (
          <iframe
            src={src}
            allowFullScreen
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-[60vh] rounded-lg border border-neutral-800"
            onLoad={() => { /* reset interaction lock on new src; wait for MEDIA_DATA */ setUserInteracted(false) }}
            onError={() => {
              console.log('Iframe failed to load, trying next API...')
              // Check if it's an SSL error
              if (window.location.protocol === 'https:' && src.includes('vidsrc')) {
                setSslError(true)
              }
              // Try next API in fallback order
              const fallbackOrder = ['3','4','1','2']
              const currentIndex = fallbackOrder.indexOf(apiVersion)
              if (currentIndex < fallbackOrder.length - 1) {
                const nextApi = fallbackOrder[currentIndex + 1] as '1' | '2' | '3' | '4'
                setApiVersion(nextApi)
              } else {
                setAllApisFailed(true)
              }
            }}
            onClick={() => setUserInteracted(true)}
            onMouseDown={() => setUserInteracted(true)}
          />
        )}
      </div>
      <Recommendations id={params.id} type={isTv ? 'tv' : 'movie'} />
    </main>
  )
}


