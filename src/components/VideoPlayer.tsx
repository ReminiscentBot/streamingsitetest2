"use client"
import { useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faStepForward, faStepBackward } from '@fortawesome/free-solid-svg-icons'

interface VideoPlayerProps {
  src: string
  title: string
  blurPlayer?: boolean
  onError?: () => void
  onLoad?: () => void
  onPlayerStart?: () => void
  onNextEpisode?: () => void
  onPrevEpisode?: () => void
  hasNextEpisode?: boolean
  hasPrevEpisode?: boolean
}

export default function VideoPlayer({ 
  src, 
  title, 
  blurPlayer = false,
  onError, 
  onLoad,
  onPlayerStart,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false
}: VideoPlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  
  // Debug logging to check what's being passed to VideoPlayer
  console.log('🎥 VideoPlayer props:', {
    src: src,
    title: title,
    srcLength: src?.length,
    srcType: typeof src,
    isEmpty: !src || src === ''
  })

  useEffect(() => {
    const handlePlayerClick = () => {
      // Hide player blur when user clicks on the player
      if (blurPlayer && onPlayerStart) {
        onPlayerStart()
      }
    }

    const playerElement = playerRef.current
    if (playerElement) {
      playerElement.addEventListener('click', handlePlayerClick)
      return () => {
        playerElement.removeEventListener('click', handlePlayerClick)
      }
    }
  }, [blurPlayer, onPlayerStart])

  return (
    <div className="w-full">
      {/* Video Player */}
      <div 
        ref={playerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-neutral-800 cursor-pointer"
      >
        <iframe
          src={src && src.trim() ? src : undefined}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full"
          onLoad={onLoad}
          onError={(e) => {
            console.error('🚨 Iframe load error:', e)
            console.error('🚨 Failed to load src:', src)
            if (onError) onError()
          }}
        />
        {/* Removed blur overlay - no longer blurring video player */}
      </div>

      {/* Episode Navigation Controls - Below Player */}
      <div className="flex items-center gap-4 text-sm text-neutral-400 mt-4">
        <button 
          onClick={onPrevEpisode}
          disabled={!hasPrevEpisode}
          className={`flex items-center gap-2 transition-colors ${
            hasPrevEpisode 
              ? 'hover:text-white cursor-pointer' 
              : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <FontAwesomeIcon icon={faStepBackward} />
          Prev
        </button>
        <button 
          onClick={onNextEpisode}
          disabled={!hasNextEpisode}
          className={`flex items-center gap-2 transition-colors ${
            hasNextEpisode 
              ? 'hover:text-white cursor-pointer' 
              : 'text-neutral-600 cursor-not-allowed'
          }`}
        >
          <FontAwesomeIcon icon={faStepForward} />
          Next
        </button>
      </div>
    </div>
  )
}
