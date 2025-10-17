"use client"
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClapperboard, faRightToBracket, faRightFromBracket, faCog, faUser, faChevronDown, faCrown, faPalette } from '@fortawesome/free-solid-svg-icons'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

export default function Header() {
  const { data: session, status } = useSession()
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

  return (
    <header className="sticky top-0 z-30 bg-black/60 backdrop-blur border-b border-neutral-900">
      <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-brand-400">
          <FontAwesomeIcon icon={faClapperboard} />
          <span className="font-semibold">Reminiscent</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/members" className="btn">Members</Link>
          {status === 'authenticated' ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors border border-neutral-700/50"
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


