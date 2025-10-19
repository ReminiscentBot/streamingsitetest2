// Progress tracking utility for Continue Watching
export interface ProgressData {
  id: string
  type: 'movie' | 'tv'
  title: string
  poster_path?: string
  progress?: { watched: number; duration: number }
  last_updated?: number
  last_season_watched?: string
  last_episode_watched?: string
}

export class ProgressTracker {
  private static readonly STORAGE_KEY = 'vidsrcwtf-Progress'

  // Save progress for a movie or TV show
  static saveProgress(data: ProgressData): void {
    try {
      const existing = this.getAllProgress()
      existing[data.id] = {
        ...data,
        last_updated: Date.now()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing))
      console.log('Progress saved:', data)
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  // Get all progress data
  static getAllProgress(): Record<string, ProgressData> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch (error) {
      console.error('Error loading progress:', error)
      return {}
    }
  }

  // Get progress for a specific item
  static getProgress(id: string): ProgressData | null {
    const all = this.getAllProgress()
    return all[id] || null
  }

  // Update progress for an existing item
  static updateProgress(id: string, progress: { watched: number; duration: number }): void {
    const existing = this.getProgress(id)
    if (existing) {
      this.saveProgress({
        ...existing,
        progress,
        last_updated: Date.now()
      })
    }
  }

  // Remove progress for an item
  static removeProgress(id: string): void {
    try {
      const existing = this.getAllProgress()
      delete existing[id]
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing))
      console.log('Progress removed for:', id)
    } catch (error) {
      console.error('Error removing progress:', error)
    }
  }

  // Get recent progress (for Continue Watching)
  static getRecentProgress(limit: number = 12): ProgressData[] {
    const all = this.getAllProgress()
    return Object.values(all)
      .sort((a, b) => (b.last_updated || 0) - (a.last_updated || 0))
      .slice(0, limit)
  }
}

// Helper function to track video progress
export function trackVideoProgress(
  tmdbId: string,
  type: 'movie' | 'tv',
  title: string,
  currentTime: number,
  duration: number,
  season?: string,
  episode?: string
): void {
  ProgressTracker.saveProgress({
    id: tmdbId,
    type,
    title,
    progress: { watched: currentTime, duration },
    last_season_watched: season,
    last_episode_watched: episode
  })
}
