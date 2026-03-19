'use client'

import { useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { type Difficulty } from '@/types'
import { QuestionCard }  from './QuestionCard'
import { TimerCard }     from './TimerCard'
import { FocusTimer }    from './FocusTimer'
import { useTimer }      from '@/hooks/useTimer'

const DIFFS: { id: Difficulty; label: string }[] = [
  { id: 'easy',   label: 'Easy'   },
  { id: 'medium', label: 'Medium' },
  { id: 'hard',   label: 'Hard'   },
]

interface Props {
  onDone: (sessionId: string, questionText: string) => void
}

export function PracticeTab({ onDone }: Props) {
  const { data: session } = useSession()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [question, setQuestion]     = useState<{ id: string; text: string; difficulty: Difficulty } | null>(null)
  const [loading, setLoading]       = useState(false)
  const [markDone, setMarkDone]     = useState(false)

  // Focus mode state: null = not active, 'prep' | 'speak' = active phase
  const [focusPhase, setFocusPhase] = useState<'prep' | 'speak' | null>(null)

  const prepTimer  = useTimer(60)
  const speakTimer = useTimer(90)

  // Stable refs
  const difficultyRef   = useRef(difficulty)
  difficultyRef.current = difficulty
  const questionRef     = useRef(question)
  questionRef.current   = question
  const prepResetRef    = useRef(prepTimer.reset)
  prepResetRef.current  = prepTimer.reset
  const speakResetRef   = useRef(speakTimer.reset)
  speakResetRef.current = speakTimer.reset

  const handleRandom = useCallback(async () => {
    setLoading(true)
    setMarkDone(false)
    setFocusPhase(null)
    prepResetRef.current()
    speakResetRef.current()
    try {
      const res = await fetch(`/api/practice?difficulty=${difficultyRef.current}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setQuestion(data.question ?? null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleMarkDone = useCallback(async () => {
    const q = questionRef.current
    if (!q || markDone) return
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: q.id,
          difficulty: q.difficulty,
          tz_offset: new Date().getTimezoneOffset(),
        }),
      })
      if (!res.ok) throw new Error('Failed to log')
      const data = await res.json()
      setMarkDone(true)
      // Auto-navigate to Reflect tab
      onDone(data.session_id, q.text)
    } catch (err) {
      console.error(err)
    }
  }, [markDone, onDone])

  // Enter focus mode when a timer is started
  const handleStartPrep = () => {
    if (!question) return
    setFocusPhase('prep')
    prepTimer.start()
  }

  const handleStartSpeak = () => {
    if (!question) return
    setFocusPhase('speak')
    speakTimer.start()
  }

  const handleExitFocus = () => {
    setFocusPhase(null)
    prepTimer.stop()
    speakTimer.stop()
  }

  // ── Focus mode overlay ──────────────────────────────────────────────────────
  if (focusPhase !== null) {
    const activeTimer = focusPhase === 'prep' ? prepTimer : speakTimer
    const label       = focusPhase === 'prep' ? 'Prep Time' : 'Speaking Time'

    return (
      <FocusTimer
        phase={focusPhase}
        label={label}
        timer={activeTimer}
        questionText={question?.text ?? ''}
        onExit={handleExitFocus}
        onPhaseComplete={() => {
          if (focusPhase === 'prep') {
            // Auto-switch to speak phase
            prepTimer.stop()
            setFocusPhase('speak')
            speakTimer.reset()
            speakTimer.start()
          } else {
            setFocusPhase(null)
          }
        }}
      />
    )
  }

  // ── Normal view ─────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Difficulty */}
      <div className="text-xs uppercase tracking-widest font-glacial mb-3" style={{ color: 'var(--ink3)' }}>
        Difficulty
      </div>
      <div className="flex gap-2 mb-5">
        {DIFFS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDifficulty(d.id)}
            className="px-5 py-2 rounded-lg text-sm font-glacial transition-all"
            style={{
              background: difficulty === d.id ? 'var(--ink)' : '#fff',
              color:      difficulty === d.id ? 'var(--cream)' : d.id === 'hard' ? 'var(--accent)' : 'var(--ink2)',
              border:     difficulty === d.id ? '1px solid var(--ink)' : d.id === 'hard' ? '1px solid var(--accent)' : '1px solid var(--sand)',
              cursor: 'pointer',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Question */}
      <QuestionCard question={question} loading={loading} />

      {/* Random button */}
      <button
        onClick={handleRandom}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-fredoka text-lg font-semibold mb-5 transition-all"
        style={{
          background: loading ? 'var(--ink2)' : 'var(--ink)',
          color: 'var(--cream)',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
        }}
        onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = '#333330' }}
        onMouseOut={(e)  => { e.currentTarget.style.background = loading ? 'var(--ink2)' : 'var(--ink)' }}
      >
        {loading ? 'Loading...' : 'Random Question'}
      </button>

      {/* Timers */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <TimerCard
          label="Prep Time"
          timer={prepTimer}
          startLabel="Start Prep"
          disabled={!question}
          onStart={handleStartPrep}
        />
        <TimerCard
          label="Speaking Time"
          timer={speakTimer}
          startLabel="Start Speaking"
          disabled={!question}
          onStart={handleStartSpeak}
        />
      </div>

      {/* Mark done */}
      {session && question && (
        <button
          onClick={handleMarkDone}
          disabled={markDone}
          className="w-full py-3 rounded-xl text-sm font-glacial transition-all"
          style={{
            border:     '1px solid var(--accent)',
            color:      markDone ? '#fff' : 'var(--accent)',
            background: markDone ? 'var(--accent)' : 'transparent',
            cursor:     markDone ? 'default' : 'pointer',
          }}
          onMouseOver={(e) => { if (!markDone) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' } }}
          onMouseOut={(e)  => { if (!markDone) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)' } }}
        >
          {markDone ? 'Done — heading to Reflect...' : 'Mark as done — go Reflect'}
        </button>
      )}

      {!session && (
        <p className="text-center text-sm font-glacial mt-2" style={{ color: 'var(--ink3)' }}>
          Sign in to track your progress
        </p>
      )}
    </div>
  )
}
