// Anilist API integration for anime detection and data
export interface AnilistAnime {
  id: number
  title: {
    romaji: string
    english: string
    native: string
  }
  synonyms: string[]
  description: string
  format: string
  status: string
  episodes: number
  duration: number
  source: string
  genres: string[]
  tags: Array<{
    name: string
    rank: number
  }>
  studios: {
    nodes: Array<{
      name: string
    }>
  }
  startDate: {
    year: number
    month: number
    day: number
  }
  endDate: {
    year: number
    month: number
    day: number
  }
  season: string
  seasonYear: number
  countryOfOrigin: string
  isAdult: boolean
  externalLinks: Array<{
    site: string
    url: string
  }>
}

interface AnilistSearchResult {
  Page: {
    media: AnilistAnime[]
  }
}

const ANILIST_API_URL = 'https://graphql.anilist.co'

// GraphQL query for searching anime by title
const SEARCH_ANIME_QUERY = `
  query SearchAnime($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        id
        title {
          romaji
          english
          native
        }
        synonyms
        description
        format
        status
        episodes
        duration
        source
        genres
        tags {
          name
          rank
        }
        studios {
          nodes {
            name
          }
        }
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        season
        seasonYear
        countryOfOrigin
        isAdult
        externalLinks {
          site
          url
        }
      }
    }
  }
`

// GraphQL query for getting anime by ID
const GET_ANIME_BY_ID_QUERY = `
  query GetAnimeById($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      synonyms
      description
      format
      status
      episodes
      duration
      source
      genres
      tags {
        name
        rank
      }
      studios {
        nodes {
          name
        }
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      countryOfOrigin
      isAdult
      externalLinks {
        site
        url
      }
    }
  }
`

// GraphQL query for getting anime by TMDB ID
const GET_ANIME_BY_TMDB_QUERY = `
  query GetAnimeByTmdbId($tmdbId: String) {
    Media(externalLinks: {site: "The Movie Database", externalId: $tmdbId}, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      synonyms
      description
      format
      status
      episodes
      duration
      source
      genres
      tags {
        name
        rank
      }
      studios {
        nodes {
          name
        }
      }
      startDate {
        year
        month
        day
      }
      endDate {
        year
        month
        day
      }
      season
      seasonYear
      countryOfOrigin
      isAdult
      externalLinks {
        site
        url
      }
    }
  }
`

async function anilistRequest(query: string, variables: any = {}): Promise<any> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    })

    if (!response.ok) {
      throw new Error(`Anilist API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.errors) {
      throw new Error(`Anilist API errors: ${JSON.stringify(data.errors)}`)
    }

    return data.data
  } catch (error) {
    console.error('Anilist API request failed:', error)
    throw error
  }
}

// Search anime by title
export async function searchAnimeByTitle(title: string, page: number = 1, perPage: number = 10): Promise<AnilistAnime[]> {
  try {
    const data = await anilistRequest(SEARCH_ANIME_QUERY, {
      search: title,
      page,
      perPage
    })

    return data?.Page?.media || []
  } catch (error) {
    console.error('Error searching anime by title:', error)
    return []
  }
}

// Get anime by Anilist ID
export async function getAnimeById(id: number): Promise<AnilistAnime | null> {
  try {
    const data = await anilistRequest(GET_ANIME_BY_ID_QUERY, { id })
    return data?.Media || null
  } catch (error) {
    console.error('Error getting anime by ID:', error)
    return null
  }
}

// Get anime by TMDB ID
export async function getAnimeByTmdbId(tmdbId: string): Promise<AnilistAnime | null> {
  try {
    const data = await anilistRequest(GET_ANIME_BY_TMDB_QUERY, { tmdbId })
    return data?.Media || null
  } catch (error) {
    console.error('Error getting anime by TMDB ID:', error)
    return null
  }
}

// Check if TMDB content is anime based on various criteria
export function isAnimeContent(tmdbData: any): boolean {
  if (!tmdbData) return false

  // Check genres for anime-related keywords
  const animeGenres = [
    'Animation',
    'Anime',
    'Japanese',
    'Manga',
    'Animated'
  ]

  const genres = tmdbData.genres || []
  const hasAnimeGenre = genres.some((genre: any) => 
    animeGenres.some(animeGenre => 
      genre.name?.toLowerCase().includes(animeGenre.toLowerCase())
    )
  )

  // Check title for anime keywords
  const title = (tmdbData.title || tmdbData.name || '').toLowerCase()
  const animeKeywords = [
    'anime',
    'manga',
    'japanese',
    'animation'
  ]
  const hasAnimeKeyword = animeKeywords.some(keyword => 
    title.includes(keyword)
  )

  // Check original language
  const originalLanguage = tmdbData.original_language
  const isJapanese = originalLanguage === 'ja'

  // Check production countries
  const productionCountries = tmdbData.production_countries || []
  const isFromJapan = productionCountries.some((country: any) => 
    country.iso_3166_1 === 'JP' || country.name === 'Japan'
  )

  return hasAnimeGenre || hasAnimeKeyword || isJapanese || isFromJapan
}

// Find Anilist match for TMDB data
export async function findAnilistMatch(tmdbData: any): Promise<AnilistAnime | null> {
  if (!tmdbData) return null

  try {
    // First try to get by TMDB ID
    const byTmdbId = await getAnimeByTmdbId(tmdbData.id.toString())
    if (byTmdbId) return byTmdbId

    // If not found, try searching by title
    const title = tmdbData.title || tmdbData.name
    if (title) {
      const searchResults = await searchAnimeByTitle(title, 1, 5)
      if (searchResults.length > 0) {
        // Try to find the best match
        const bestMatch = searchResults.find(anime => {
          const animeTitle = anime.title.english || anime.title.romaji
          return animeTitle.toLowerCase().includes(title.toLowerCase()) ||
                 title.toLowerCase().includes(animeTitle.toLowerCase())
        })
        
        return bestMatch || searchResults[0]
      }
    }

    return null
  } catch (error) {
    console.error('Error finding Anilist match:', error)
    return null
  }
}
