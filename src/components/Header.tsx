'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faClapperboard, 
  faFilm, 
  faTv, 
  faUser, 
  faChevronDown,
  faSignOutAlt,
  faCog,
  faUserCircle,
  faShield
} from '@fortawesome/free-solid-svg-icons'

interface AdminData {
  isOwner: boolean
  isDeveloper: boolean
  isAdmin: boolean
  isTrialMod: boolean
  roles: string[]
  uid: number
}

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [userUid, setUserUid] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [adminData, setAdminData] = useState<AdminData | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get user UID for profile link
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profiles?uid=' + session.user.email)
        .then(res => res.json())
        .then(data => {
          if (data.user?.uid) setUserUid(data.user.uid.toString())
        })
        .catch(() => {})
    }
  }, [session])

  // Fetch admin data
  useEffect(() => {
    async function fetchAdminStatus() {
      try {
        const res = await fetch('/api/admin/check')
        if (res.ok) {
          const data = await res.json()
          setAdminData(data)
        }
      } catch (error) {
        console.error('Failed to fetch admin status:', error)
      }
    }
    fetchAdminStatus()
  }, [])

  const adminCheck = adminData && (adminData.isAdmin || adminData.isDeveloper || adminData.isOwner || adminData.isTrialMod)

  return (
    <header className="sticky top-0 z-30 bg-neutral-900/70 backdrop-blur border-b border-neutral-800 min-h-[80px]">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-2 flex-wrap">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0">
          <FontAwesomeIcon icon={faClapperboard} className="text-2xl text-brand-400" />
          <span className="text-2xl font-black text-brand-400">CacheTomb</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2 flex-1 min-w-0">
          <Link href="/" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${pathname === '/' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <FontAwesomeIcon icon={faClapperboard} className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link href="/movies" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${pathname === '/movies' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <FontAwesomeIcon icon={faFilm} className="w-4 h-4" />
            <span className="hidden sm:inline">Movies</span>
          </Link>

          <Link href="/tv" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${pathname === '/tv' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <FontAwesomeIcon icon={faTv} className="w-4 h-4" />
            <span className="hidden sm:inline">TV Shows</span>
          </Link>

          <Link href="/members" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${pathname === '/members' ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>
            <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
            <span className="hidden sm:inline">Members</span>
          </Link>
        </nav>

        {/* User Profile / Sign In */}
        {status === 'loading' ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 animate-pulse flex-shrink-0 min-w-[120px]">
            <div className="w-8 h-8 bg-neutral-700 rounded-full"></div>
            <div className="w-20 h-4 bg-neutral-700 rounded"></div>
          </div>
        ) : status === 'authenticated' ? (
          <div className="relative flex-shrink-0 min-w-[120px]" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors whitespace-nowrap min-w-[120px]"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image src={session.user?.image || '/placeholder.png'} alt={session.user?.name || ''} width={32} height={32} className="object-cover" />
              </div>
              <span className="text-white font-medium truncate">{session.user?.name}</span>
              <FontAwesomeIcon icon={faChevronDown} className={`text-neutral-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900/95 backdrop-blur-sm border border-neutral-700/50 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-neutral-800/50 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden">
                    <Image src={session.user?.image || '/placeholder.png'} alt={session.user?.name || ''} width={48} height={48} className="object-cover" />
                  </div>
                  <div>
                    <div className="text-white font-medium truncate">{session.user?.name}</div>
                    <div className="text-sm text-neutral-400 truncate">{session.user?.email}</div>
                  </div>
                </div>

                <div className="py-2">
                  <Link href={userUid ? `/u/${userUid}` : '#'} className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors" onClick={() => setDropdownOpen(false)}>
                    <FontAwesomeIcon icon={faUserCircle} className="w-4 h-4" /> My Profile
                  </Link>

                  <Link
                    href="/invitations"
                    className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FontAwesomeIcon icon={faUserCircle} className="w-4 h-4" /> My Invitations
                  </Link>

                  <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors" onClick={() => setDropdownOpen(false)}>
                    <FontAwesomeIcon icon={faCog} className="w-4 h-4" /> Settings
                  </Link>

                  {adminCheck && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <FontAwesomeIcon icon={faShield} className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}

                  <button onClick={() => { setDropdownOpen(false); signOut() }} className="flex items-center gap-3 px-4 py-3 text-white hover:bg-neutral-800/50 transition-colors w-full text-left">
                    <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/signin" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-colors">
            <FontAwesomeIcon icon={faUser} className="w-4 h-4" /> Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
