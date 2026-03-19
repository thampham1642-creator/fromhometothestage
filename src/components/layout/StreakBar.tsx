'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface ProfileSummary {
  current_streak:  number
  total_sessions:  number
}

export function StreakBar() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileSummary | null>(null)

  useEffect(() => {
    if (!session) return
    const tzOffset = new Date().getTimezoneOffset()
    fetch(`/api/users/me?tz_offset=${tzOffset}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({
            current_streak: d.profile.current_streak,
            total_sessions: d.totalSessions ?? d.sessions?.length ?? 0,
          })
        }
      })
      .catch(console.error)
  }, [session])

  const streak = profile?.current_streak ?? 0
  const done   = profile?.total_sessions ?? 0

  return (
    <div
      className="flex items-stretch mb-6 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--sand)', background: '#fff' }}
    >
      <StatCell label="Day Streak"     value={streak} />
      <StatCell label="Sessions Done"  value={done}   />
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex-1 px-6 py-4 text-center"
      style={{ borderRight: '1px solid var(--sand)' }}
    >
      <div className="font-fredoka text-3xl font-semibold leading-none" style={{ color: 'var(--ink)' }}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider mt-1.5 font-glacial" style={{ color: 'var(--ink3)' }}>
        {label}
      </div>
    </div>
  )
}
