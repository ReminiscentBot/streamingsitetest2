"use client"
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClapperboard, faRightToBracket, faRightFromBracket, faCog, faUser, faChevronDown, faCrown, faPalette, faFilm, faTv, faSearch } from '@fortawesome/free-solid-svg-icons'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isDeveloper, setIsDeveloper] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isVip, setIsVip] = useState(false)
  const [userUid, setUserUid] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Check admin status and get user UID
  useEffect(() => {
    async function checkAdminStatus() {
      if (status === 'authenticated') {
        try {
          const res = await fetch('/api/admin/check')
          if (res.ok) {
            const data = await res.json()
            setIsAdmin(data.isAdmin)
            setIsOwner(data.isOwner)
            setIsDeveloper(data.isDeveloper)
            setIsModerator(data.isModerator)
            setIsPremium(data.isPremium)
            setIsVip(data.isVip)
            setUserUid(data.uid)
          }
        } catch (error) {
          console.error('Failed to check admin status:', error)
        }
      }
    }

    checkAdminStatus()
  }, [status])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Check if we should hide the search bar
  const hideSearchBar = pathname === '/' || pathname === '/movies' || pathname === '/tv'

  return (
    <header className="sticky top-0 z-30 bg-neutral-900/70 backdrop-blur border-b border-neutral-800">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="group relative flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden">
          {/* Advanced background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
          
          {/* Animated border */}
          <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-border opacity-0 group-hover:opacity-100 transition-all duration-500">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 animate-spin-slow"></div>
          </div>
          
          {/* Icon with advanced effects */}
          <div className="relative z-10">
            <FontAwesomeIcon 
              icon={faClapperboard} 
              className="text-2xl text-brand-400 group-hover:text-white transition-all duration-500 group-hover:scale-125 group-hover:rotate-180 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] group-hover:animate-bounce" 
            />
            {/* Rotating glow ring around icon */}
            <div className="absolute inset-0 w-8 h-8 border-2 border-brand-400/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-spin transition-all duration-500"></div>
            <div className="absolute inset-0 w-6 h-6 border border-purple-400/50 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-reverse-spin transition-all duration-700"></div>
          </div>
          
              {/* Advanced text with multiple effects - Cross-browser compatible */}
              <span className="relative z-10 text-2xl font-black text-brand-400 group-hover:text-white transition-all duration-700 group-hover:scale-110 group-hover:animate-pulse">
                <span className="relative">
                  Reminiscent
                  {/* Animated underline */}
                  <div className="absolute -bottom-1 left-0 w-0 h-1 bg-gradient-to-r from-brand-400 to-pink-400 group-hover:w-full transition-all duration-700"></div>
                  {/* Floating particles effect */}
                  <div className="absolute -top-2 -right-2 w-2 h-2 bg-brand-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                  <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping group-hover:animation-delay-200"></div>
                  {/* Glow effect for better visibility */}
                  <div className="absolute inset-0 text-brand-400 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-700"></div>
                </span>
              </span>
          
          {/* Advanced particle effects */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-float-up"></div>
            <div className="absolute top-4 right-6 w-1 h-1 bg-brand-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-float-up group-hover:animation-delay-300"></div>
            <div className="absolute bottom-3 left-8 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-float-up group-hover:animation-delay-500"></div>
          </div>
        </Link>
        
        {/* Search Bar - Hidden on home, movies, and tv pages */}
        {!hideSearchBar && (
          <div className="relative hidden md:block">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search"
              className="bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-neutral-400 w-64"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const query = (e.target as HTMLInputElement).value
                  if (query.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
                  }
                }
              }}
            />
          </div>
        )}
        
        <nav className="flex items-center gap-2 flex-shrink-0">
          <Link 
            href="/" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              pathname === '/' 
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FontAwesomeIcon icon={faClapperboard} className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          
          <Link 
            href="/movies" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              pathname === '/movies' 
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FontAwesomeIcon icon={faFilm} className="w-4 h-4" />
            <span className="hidden sm:inline">Movies</span>
          </Link>
          
          <Link 
            href="/tv" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              pathname === '/tv' 
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FontAwesomeIcon icon={faTv} className="w-4 h-4" />
            <span className="hidden sm:inline">TV Shows</span>
          </Link>
          
          
          <Link 
            href="/members" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              pathname === '/members' 
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
            <span className="hidden sm:inline">Members</span>
          </Link>
          {status === 'authenticated' ? (
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors border border-neutral-700/50 whitespace-nowrap"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image 
                    src={session.user?.image || '/placeholder.png'} 
                    alt={session.user?.name || ''} 
                    width={32} 
                    height={32} 
                    className="object-cover"
                  />
                </div>
                <span className="text-white font-medium">{session.user?.name}</span>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className={`text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-neutral-800/50">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image 
                          src={session.user?.image || '/placeholder.png'} 
                          alt={session.user?.name || ''} 
                          width={48} 
                          height={48} 
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium">{session.user?.name}</div>
                        <div className="text-sm text-neutral-400">{session.user?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link 
                      href={userUid ? `/u/${userUid}` : '#'}
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FontAwesomeIcon icon={faUser} className="text-neutral-400" />
                      <span>My Profile</span>
                    </Link>
                    
                    <Link 
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <FontAwesomeIcon icon={faCog} className="text-neutral-400" />
                      <span>Settings</span>
                    </Link>
                    
                    {(isPremium || isVip) && (
                      <Link 
                        href="/customize"
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FontAwesomeIcon icon={faPalette} className="text-purple-400" />
                        <span>Customize Profile</span>
                      </Link>
                    )}
                    
                    {(isAdmin || isOwner || isDeveloper || isModerator) && (
                      <Link 
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FontAwesomeIcon icon={faCrown} className="text-yellow-400" />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    
                    <div className="border-t border-neutral-800/50 my-2"></div>
                    
                    <button 
                      onClick={() => {
                        setDropdownOpen(false)
                        signOut()
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition-colors w-full text-left"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn" onClick={() => signIn('discord')}>
              <FontAwesomeIcon icon={faRightToBracket} />
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}


