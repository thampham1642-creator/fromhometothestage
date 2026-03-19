'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { type Challenge } from '@/types'
import { LeaderboardPanel } from './LeaderboardPanel'

export function ChallengesTab() {
  const { data: session } = useSession()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [joining, setJoining] = useState<string | null>(null)

  const fetchChallenges = async () => {
    try {
      const res = await fetch('/api/challenges')
      if (!res.ok) throw new Error('Failed to fetch challenges')
      const data = await res.json()
      setChallenges(data.challenges ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [session])

  const handleJoin = async (challenge: Challenge) => {
    if (!session) { signIn(); return }
    if (challenge.user_joined) return
    setJoining(challenge.id)
    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challenge.id }),
      })
      if (!res.ok) throw new Error('Failed to join')
      await fetchChallenges()
    } catch (err) {
      console.error(err)
    } finally {
      setJoining(null)
    }
  }

  if (loading) return <LoadingSkeleton />

  return (
    <div>
      <div className="font-fredoka text-xl font-medium mb-4" style={{ color: 'var(--ink)' }}>
        Active Challenges
      </div>

      {challenges.length === 0 && (
        <p className="text-sm font-glacial py-8 text-center" style={{ color: 'var(--ink3)' }}>
          No active challenges right now. Check back soon.
        </p>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {challenges.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            onJoin={() => handleJoin(c)}
            joining={joining === c.id}
            onLeaderboard={() => setSelectedChallenge(c)}
          />
        ))}
      </div>

      {selectedChallenge && (
        <LeaderboardPanel
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  )
}

interface ChallengeCardProps {
  challenge: Challenge
  onJoin: () => void
  joining: boolean
  onLeaderboard: () => void
}

function ChallengeCard({ challenge, onJoin, joining, onLeaderboard }: ChallengeCardProps) {
  const pct =
    challenge.user_joined && challenge.user_progress != null
      ? Math.min(100, Math.round((challenge.user_progress / challenge.goal_count) * 100))
      : 0

  const endsAt = new Date(challenge.ends_at)
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000))

  return (
    <div
      className="rounded-xl p-5 flex items-center gap-5"
      style={{ background: '#fff', border: '1px solid var(--sand)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-fredoka text-lg font-medium" style={{ color: 'var(--ink)' }}>
          {challenge.title}
        </div>
        <div className="text-xs font-glacial mt-0.5" style={{ color: 'var(--ink3)' }}>
          {challenge.description}
          {' · '}
          {challenge.participant_count ?? 0} participants
          {' · '}
          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
        </div>

        {challenge.user_joined && (
          <>
            <div
              className="h-0.5 rounded-full mt-3 overflow-hidden"
              style={{ background: 'var(--sand)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'var(--accent)' }}
              />
            </div>
            <div className="text-xs font-glacial mt-1" style={{ color: 'var(--ink3)' }}>
              {challenge.user_progress ?? 0} of {challenge.goal_count} done
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 items-end shrink-0">
        <button
          onClick={onJoin}
          disabled={joining || !!challenge.user_joined}
          className="px-4 py-2 rounded-lg text-sm font-glacial transition-all whitespace-nowrap"
          style={{
            background:  challenge.user_joined ? 'var(--ink)' : 'transparent',
            color:       challenge.user_joined ? 'var(--cream)' : 'var(--ink2)',
            border:      challenge.user_joined ? '1px solid var(--ink)' : '1px solid var(--sand)',
            cursor:      challenge.user_joined ? 'default' : 'pointer',
            opacity:     joining ? 0.6 : 1,
          }}
        >
          {joining ? '...' : challenge.user_joined ? 'Joined' : 'Join'}
        </button>

        <button
          onClick={onLeaderboard}
          style={{
            color: 'var(--ink3)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            fontSize: '12px',
            fontFamily: 'inherit',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Leaderboard
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-5 h-24 animate-pulse"
          style={{ background: 'var(--warm)', border: '1px solid var(--sand)' }}
        />
      ))}
    </div>
  )
}
