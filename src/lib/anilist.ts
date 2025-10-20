// Anilist API integration for anime detection and ID conversion
const ANILIST_API_URL = 'https://graphql.anilist.co'

interface AnilistAnime {
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

// GraphQL query to search anime by title
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

// GraphQL query to get anime by ID
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

export async function searchAnimeByTitle(title: string, page: number = 1, perPage: number = 10): Promise<AnilistAnime[]> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_ANIME_QUERY,
        variables: {
          search: title,
          page,
          perPage
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Anilist API error: ${response.status}`)
    }

    const data: { data: AnilistSearchResult } = await response.json()
    return data.data.Page.media
  } catch (error) {
    console.error('Error searching anime:', error)
    return []
  }
}

export async function getAnimeById(id: number): Promise<AnilistAnime | null> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ANIME_BY_ID_QUERY,
        variables: { id }
      })
    })

    if (!response.ok) {
      throw new Error(`Anilist API error: ${response.status}`)
    }

    const data: { data: { Media: AnilistAnime } } = await response.json()
    return data.data.Media
  } catch (error) {
    console.error('Error fetching anime by ID:', error)
    return null
  }
}

// Check if TMDB content is anime based on various factors
export function isAnimeContent(tmdbData: any): boolean {
  if (!tmdbData) return false

  // Check genres for animation/anime
  const animeGenres = ['Animation', 'Anime', 'Japanese Animation']
  const hasAnimeGenre = tmdbData.genres?.some((genre: any) => 
    animeGenres.some(animeGenre => 
      genre.name.toLowerCase().includes(animeGenre.toLowerCase())
    )
  )

  // Check keywords for anime-related terms
  const animeKeywords = ['anime', 'manga', 'japanese animation', 'otaku', 'shounen', 'shoujo', 'seinen', 'josei']
  const hasAnimeKeywords = tmdbData.keywords?.results?.some((keyword: any) =>
    animeKeywords.some(animeKeyword =>
      keyword.name.toLowerCase().includes(animeKeyword.toLowerCase())
    )
  )

  // Check production companies for anime studios
  const animeStudios = ['toei animation', 'studio ghibli', 'madhouse', 'bones', 'ufotable', 'wit studio', 'mappa']
  const hasAnimeStudio = tmdbData.production_companies?.some((company: any) =>
    animeStudios.some(studio =>
      company.name.toLowerCase().includes(studio.toLowerCase())
    )
  )

  // Check original language (Japanese content is often anime)
  const isJapanese = tmdbData.original_language === 'ja'

  // Check if it's a TV show with animation format
  const isAnimatedTV = tmdbData.media_type === 'tv' && 
    tmdbData.genres?.some((genre: any) => genre.name.toLowerCase().includes('animation'))

  return hasAnimeGenre || hasAnimeKeywords || hasAnimeStudio || (isJapanese && isAnimatedTV)
}

// Find best Anilist match for TMDB content
export async function findAnilistMatch(tmdbData: any): Promise<AnilistAnime | null> {
  if (!isAnimeContent(tmdbData)) return null

  const searchTitle = tmdbData.title || tmdbData.name
  if (!searchTitle) return null

  try {
    const results = await searchAnimeByTitle(searchTitle, 1, 5)
    
    if (results.length === 0) return null

    // Try to find the best match by comparing titles and years
    const tmdbYear = new Date(tmdbData.release_date || tmdbData.first_air_date).getFullYear()
    
    for (const anime of results) {
      // Check if titles match (romaji, english, or native)
      const titleMatch = 
        anime.title.romaji.toLowerCase().includes(searchTitle.toLowerCase()) ||
        anime.title.english?.toLowerCase().includes(searchTitle.toLowerCase()) ||
        anime.title.native.toLowerCase().includes(searchTitle.toLowerCase())

      // Check if year matches (within 1 year tolerance)
      const animeYear = anime.startDate.year
      const yearMatch = Math.abs(animeYear - tmdbYear) <= 1

      if (titleMatch && yearMatch) {
        return anime
      }
    }

    // If no exact match, return the first result
    return results[0]
  } catch (error) {
    console.error('Error finding Anilist match:', error)
    return null
  }
}

export type { AnilistAnime }
