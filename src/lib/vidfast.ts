// VidFast.pro service with server status monitoring and fallback
const VIDFAST_BASE_URL = 'https://vidfast.pro'
const VIDFAST_DOMAINS = [
  'https://vidfast.pro',
  'https://vidfast.in',
  'https://vidfast.io',
  'https://vidfast.me',
  'https://vidfast.net',
  'https://vidfast.pm',
  'https://vidfast.xyz'
]

interface VidFastServer {
  name: string
  status: 'operational' | 'offline' | 'degraded'
  responseTime: number
  uptime: number
  lastUpdated: string
}

interface VidFastStatus {
  scrapers: VidFastServer[]
  proxies: VidFastServer[]
}

// Cache for server status
let serverStatusCache: VidFastStatus | null = null
let lastStatusCheck = 0
const STATUS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Get server status from VidFast.pro status page
export async function getServerStatus(): Promise<VidFastStatus | null> {
  const now = Date.now()
  
  // Return cached status if still valid
  if (serverStatusCache && (now - lastStatusCheck) < STATUS_CACHE_DURATION) {
    return serverStatusCache
  }

  try {
    // Try to fetch status from their status page
    // Note: This is a mock implementation since we don't have direct API access
    // In a real implementation, you'd parse their status page or use their API
    
    // For now, we'll assume all servers are operational
    // In production, you'd implement actual status checking
    const mockStatus: VidFastStatus = {
      scrapers: [
        { name: 'Alpha', status: 'operational', responseTime: 500, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Beta', status: 'operational', responseTime: 300, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Charlie', status: 'operational', responseTime: 400, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Cobra', status: 'operational', responseTime: 350, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Delta', status: 'operational', responseTime: 600, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Echo', status: 'operational', responseTime: 450, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Fury', status: 'operational', responseTime: 520, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Iron', status: 'operational', responseTime: 800, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Jiraiya', status: 'operational', responseTime: 460, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Kirito', status: 'operational', responseTime: 550, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Luffy', status: 'operational', responseTime: 420, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Meliodas', status: 'operational', responseTime: 700, uptime: 100, lastUpdated: new Date().toISOString() }
      ],
      proxies: [
        { name: 'Proxy-01', status: 'operational', responseTime: 50, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Proxy-02', status: 'operational', responseTime: 45, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Proxy-03', status: 'operational', responseTime: 55, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Proxy-04', status: 'operational', responseTime: 40, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Proxy-05', status: 'operational', responseTime: 60, uptime: 100, lastUpdated: new Date().toISOString() },
        { name: 'Proxy-06', status: 'operational', responseTime: 35, uptime: 100, lastUpdated: new Date().toISOString() }
      ]
    }

    serverStatusCache = mockStatus
    lastStatusCheck = now
    return mockStatus
  } catch (error) {
    console.error('Error fetching VidFast status:', error)
    return null
  }
}

// Get the best available server
async function getBestServer(): Promise<string> {
  const status = await getServerStatus()
  if (!status) return VIDFAST_BASE_URL

  // Find the best operational scraper
  const operationalScrapers = status.scrapers.filter(s => s.status === 'operational')
  if (operationalScrapers.length === 0) return VIDFAST_BASE_URL

  // Sort by response time and uptime
  const bestServer = operationalScrapers.sort((a, b) => {
    const aScore = a.responseTime + (100 - a.uptime) * 10
    const bScore = b.responseTime + (100 - b.uptime) * 10
    return aScore - bScore
  })[0]

  return VIDFAST_BASE_URL // Use base URL for now, server selection would be handled by VidFast
}

// Generate VidFast.pro URL for movies
export function generateVidFastMovieUrl(tmdbId: string, options: {
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
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.autoPlay !== false) params.set('autoPlay', 'true')
  if (options.title) params.set('title', 'true')
  if (options.poster) params.set('poster', 'true')
  if (options.theme) params.set('theme', options.theme)
  if (options.server) params.set('server', options.server)
  if (options.hideServer) params.set('hideServer', 'true')
  if (options.fullscreenButton) params.set('fullscreenButton', 'true')
  if (options.chromecast) params.set('chromecast', 'true')
  if (options.sub) params.set('sub', options.sub)
  if (options.startAt) params.set('startAt', options.startAt.toString())

  const queryString = params.toString()
  return `${VIDFAST_BASE_URL}/movie/${tmdbId}${queryString ? `?${queryString}` : ''}`
}

// Generate VidFast.pro URL for TV shows
export function generateVidFastTVUrl(tmdbId: string, season: number, episode: number, options: {
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
} = {}): string {
  const params = new URLSearchParams()
  
  if (options.autoPlay !== false) params.set('autoPlay', 'true')
  if (options.title) params.set('title', 'true')
  if (options.poster) params.set('poster', 'true')
  if (options.theme) params.set('theme', options.theme)
  if (options.server) params.set('server', options.server)
  if (options.hideServer) params.set('hideServer', 'true')
  if (options.fullscreenButton) params.set('fullscreenButton', 'true')
  if (options.chromecast) params.set('chromecast', 'true')
  if (options.sub) params.set('sub', options.sub)
  if (options.startAt) params.set('startAt', options.startAt.toString())
  if (options.nextButton) params.set('nextButton', 'true')
  if (options.autoNext) params.set('autoNext', 'true')

  const queryString = params.toString()
  return `${VIDFAST_BASE_URL}/tv/${tmdbId}/${season}/${episode}${queryString ? `?${queryString}` : ''}`
}

// Test if VidFast.pro URL is accessible
export async function testVidFastUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // Avoid CORS issues
    })
    return true // If we can make the request, assume it's working
  } catch (error) {
    console.error('VidFast URL test failed:', error)
    return false
  }
}

// Get VidFast.pro URL with fallback
export async function getVidFastUrl(
  tmdbId: string, 
  type: 'movie' | 'tv', 
  season?: number, 
  episode?: number,
  options: any = {}
): Promise<string | null> {
  try {
    let url: string

    if (type === 'movie') {
      url = generateVidFastMovieUrl(tmdbId, options)
    } else if (type === 'tv' && season && episode) {
      url = generateVidFastTVUrl(tmdbId, season, episode, options)
    } else {
      return null
    }

    // Test the URL
    const isAccessible = await testVidFastUrl(url)
    if (isAccessible) {
      return url
    }

    // If primary URL fails, try different servers
    const status = await getServerStatus()
    if (status) {
      const operationalServers = status.scrapers.filter(s => s.status === 'operational')
      
      for (const server of operationalServers) {
        const serverOptions = { ...options, server: server.name }
        let serverUrl: string

        if (type === 'movie') {
          serverUrl = generateVidFastMovieUrl(tmdbId, serverOptions)
        } else {
          serverUrl = generateVidFastTVUrl(tmdbId, season!, episode!, serverOptions)
        }

        const isServerAccessible = await testVidFastUrl(serverUrl)
        if (isServerAccessible) {
          return serverUrl
        }
      }
    }

    return null
  } catch (error) {
    console.error('Error getting VidFast URL:', error)
    return null
  }
}

// Event listener for VidFast player events
export function setupVidFastEventListeners() {
  window.addEventListener('message', ({ origin, data }) => {
    if (!VIDFAST_DOMAINS.includes(origin) || !data) {
      return
    }

    if (data.type === 'PLAYER_EVENT') {
      const { event, currentTime, duration, tmdbId, mediaType, season, episode, playing, muted, volume } = data.data
      console.log(`VidFast Player ${event} at ${currentTime}s of ${duration}s`)
      
      // Handle player events here
      // You can dispatch custom events or update state
    }

    if (data.type === 'MEDIA_DATA') {
      // Store media data for progress tracking
      localStorage.setItem('vidFastProgress', JSON.stringify(data.data))
    }
  })
}

export type { VidFastServer, VidFastStatus }
