'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

export function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav
      className="flex items-center justify-between mb-6 pb-5"
      style={{ borderBottom: '1px solid var(--sand)' }}
    >
      {/* Logo */}
      <div>
        <div className="font-fredoka text-xl font-semibold" style={{ color: 'var(--ink)' }}>
          From Home to the{' '}
          <span style={{ color: 'var(--accent)' }}>Stage</span>
        </div>
        <div
          className="text-xs uppercase tracking-widest font-glacial mt-0.5"
          style={{ color: 'var(--ink3)', letterSpacing: '0.08em' }}
        >
          Practice daily · Speak confidently
        </div>
      </div>

      {/* Auth */}
      <div className="flex items-center gap-2">
        {session ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
              style={{ border: '1px solid var(--sand)', background: '#fff', cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--ink3)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--sand)')}
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? 'User'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <Avatar name={session.user?.name ?? 'U'} size={24} />
              )}
              <span className="text-sm font-glacial" style={{ color: 'var(--ink2)' }}>
                {session.user?.name?.split(' ')[0] ?? 'You'}
              </span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-40 rounded-lg py-1 z-50"
                style={{
                  background:  '#fff',
                  border:      '1px solid var(--sand)',
                  boxShadow:   '0 4px 16px rgba(0,0,0,0.08)',
                }}
              >
                <button
                  onClick={() => { signOut(); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm font-glacial transition-colors"
                  style={{ color: 'var(--ink2)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--warm)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => signIn()}
              className="px-4 py-2 rounded-lg text-sm font-glacial transition-all"
              style={{ border: '1px solid var(--sand)', color: 'var(--ink2)', background: 'transparent', cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--ink2)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--sand)')}
            >
              Log in
            </button>
            <button
              onClick={() => signIn()}
              className="px-4 py-2 rounded-lg text-sm font-glacial transition-all"
              style={{ background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff', cursor: 'pointer' }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--accent2)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Sign up
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        background:     'var(--warm)',
        border:         '1px solid var(--sand)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       size * 0.38,
        color:          'var(--ink2)',
        flexShrink:     0,
        fontFamily:     'Glacial Indifference, Trebuchet MS, sans-serif',
      }}
    >
      {initials}
    </div>
  )
}
