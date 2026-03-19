'use client'

import { useEffect, useState } from 'react'
import { type Challenge, type LeaderboardEntry } from '@/types'
import { Avatar } from '@/components/layout/Navbar'
import Image from 'next/image'

interface Props {
  challenge: Challenge
  onClose: () => void
}

export function LeaderboardPanel({ challenge, onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/challenges/${challenge.id}/leaderboard`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load leaderboard')
        return r.json()
      })
      .then((d) => {
        setEntries(d.leaderboard ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [challenge.id])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="font-fredoka text-xl font-medium" style={{ color: 'var(--ink)' }}>
          Leaderboard
        </div>
        <button
          onClick={onClose}
          className="text-sm font-glacial"
          style={{ color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--sand)', background: '#fff' }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--sand)' }}
        >
          <span className="font-fredoka text-base font-medium" style={{ color: 'var(--ink)' }}>
            {challenge.title}
          </span>
          <span className="text-xs uppercase tracking-widest font-glacial" style={{ color: 'var(--ink3)' }}>
            Goal: {challenge.goal_count}
          </span>
        </div>

        {loading && (
          <div className="px-5 py-8 text-center font-glacial text-sm" style={{ color: 'var(--ink3)' }}>
            Loading...
          </div>
        )}

        {error && (
          <div className="px-5 py-8 text-center font-glacial text-sm" style={{ color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="px-5 py-8 text-center font-glacial text-sm" style={{ color: 'var(--ink3)' }}>
            No participants yet. Be the first to join!
          </div>
        )}

        {!loading && !error && entries.map((entry, i) => (
          <div
            key={entry.user_id}
            className="flex items-center gap-4 px-5 py-3"
            style={{ borderBottom: i < entries.length - 1 ? '1px solid var(--sand)' : 'none' }}
          >
            <span
              className="font-fredoka text-base w-6 text-center"
              style={{ color: i < 3 ? 'var(--accent)' : 'var(--ink3)' }}
            >
              {i + 1}
            </span>

            {entry.avatar_url ? (
              <Image
                src={entry.avatar_url}
                alt={entry.name ?? 'User'}
                width={32}
                height={32}
                className="rounded-full"
                style={{ border: '1px solid var(--sand)', flexShrink: 0 }}
              />
            ) : (
              <Avatar name={entry.name ?? 'A'} size={32} />
            )}

            <span className="flex-1 text-sm font-glacial" style={{ color: 'var(--ink)' }}>
              {entry.name ?? 'Anonymous'}
            </span>

            <span className="text-sm font-glacial" style={{ color: 'var(--ink2)' }}>
              {entry.progress} / {challenge.goal_count}
              {entry.completed && (
                <span
                  className="ml-2 text-xs uppercase tracking-wider"
                  style={{ color: 'var(--accent)' }}
                >
                  Done
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
