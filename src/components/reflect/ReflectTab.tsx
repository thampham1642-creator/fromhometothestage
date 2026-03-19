'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { type Reflection } from '@/types'
import { ReflectForm }    from './ReflectForm'
import { ReflectHistory } from './ReflectHistory'

interface Props {
  pendingSessionId:    string | null
  pendingQuestionText: string | null
  onReflected:         () => void
}

export function ReflectTab({ pendingSessionId, pendingQuestionText, onReflected }: Props) {
  const { data: session } = useSession()
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState<'form' | 'history'>(
    pendingSessionId ? 'form' : 'form'
  )

  const fetchReflections = async () => {
    if (!session) return
    try {
      const res = await fetch('/api/reflect')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReflections(data.reflections ?? [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchReflections()
    else setLoading(false)
  }, [session])

  const handleSaved = () => {
    onReflected()
    fetchReflections()
    setView('history')
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="font-fredoka text-2xl font-medium mb-3" style={{ color: 'var(--ink)' }}>
          Reflect on your practice
        </p>
        <p className="text-sm font-glacial mb-6" style={{ color: 'var(--ink3)' }}>
          Sign in to save and review your reflections.
        </p>
        <button
          onClick={() => signIn()}
          style={{ background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer',
            borderRadius: '12px', padding: '12px 24px', fontFamily: 'inherit', fontSize: '14px' }}
        >
          Sign in
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Sub-tab toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="font-fredoka text-xl font-medium" style={{ color: 'var(--ink)' }}>
          {view === 'form' ? 'How did it go?' : 'Past reflections'}
        </div>
        <button
          onClick={() => setView(view === 'form' ? 'history' : 'form')}
          className="text-sm font-glacial"
          style={{ color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline' }}
        >
          {view === 'form' ? 'View history' : 'New reflection'}
        </button>
      </div>

      {view === 'form' ? (
        <ReflectForm
          sessionId={pendingSessionId}
          questionText={pendingQuestionText}
          onSaved={handleSaved}
        />
      ) : (
        <ReflectHistory reflections={reflections} loading={loading} />
      )}
    </div>
  )
}
