'use client'

import { useEffect, useRef } from 'react'
import { type useTimer } from '@/hooks/useTimer'

type TimerHook = ReturnType<typeof useTimer>

interface Props {
  phase:           'prep' | 'speak'
  label:           string
  timer:           TimerHook
  questionText:    string
  onExit:          () => void
  onPhaseComplete: () => void
}

export function FocusTimer({ phase, label, timer, questionText, onExit, onPhaseComplete }: Props) {
  const { seconds, state, format } = timer

  // Capture the initial seconds when the component mounts or phase changes
  const initialSecondsRef = useRef(seconds)
  useEffect(() => {
    initialSecondsRef.current = seconds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const total = initialSecondsRef.current
  const progressPct = total > 0 ? Math.max(0, Math.min(100, ((total - seconds) / total) * 100)) : 0

  // When the timer hits done, fire onPhaseComplete once
  useEffect(() => {
    if (state === 'done') {
      const t = setTimeout(onPhaseComplete, 800)
      return () => clearTimeout(t)
    }
  }, [state, onPhaseComplete])

  const phaseBg   = phase === 'prep' ? 'var(--ink)' : '#0e0e0c'
  const accentCol = 'var(--accent)'
  const isRunning = state === 'running'
  const isDone    = state === 'done'

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     phaseBg,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         100,
        padding:        '2rem',
      }}
    >
      {/* Phase label */}
      <div
        style={{
          position:    'absolute',
          top:         '2rem',
          left:        '50%',
          transform:   'translateX(-50%)',
          fontSize:    '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:       'rgba(255,255,255,0.35)',
          fontFamily:  'Glacial Indifference, Trebuchet MS, sans-serif',
          whiteSpace:  'nowrap',
        }}
      >
        {label}
      </div>

      {/* Exit button */}
      <button
        onClick={onExit}
        style={{
          position:    'absolute',
          top:         '1.5rem',
          right:       '1.75rem',
          background:  'none',
          border:      'none',
          color:       'rgba(255,255,255,0.3)',
          fontSize:    '13px',
          cursor:      'pointer',
          fontFamily:  'Glacial Indifference, Trebuchet MS, sans-serif',
          letterSpacing: '0.04em',
          padding:     '4px 8px',
        }}
        onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
        onMouseOut={(e)  => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
      >
        Exit
      </button>

      {/* Question */}
      <p
        style={{
          fontFamily:  'Fredoka, sans-serif',
          fontSize:    'clamp(1.1rem, 3vw, 1.6rem)',
          fontWeight:  500,
          color:       'rgba(255,255,255,0.75)',
          textAlign:   'center',
          maxWidth:    '640px',
          lineHeight:  1.45,
          marginBottom: '3.5rem',
        }}
      >
        {questionText}
      </p>

      {/* Big clock */}
      <div
        style={{
          fontFamily:  'Fredoka, sans-serif',
          fontSize:    'clamp(5rem, 20vw, 10rem)',
          fontWeight:  600,
          lineHeight:  1,
          color:       isDone ? accentCol : isRunning ? '#fff' : 'rgba(255,255,255,0.85)',
          letterSpacing: '-0.02em',
          transition:  'color 0.3s ease',
        }}
      >
        {isDone ? 'Done' : format(seconds)}
      </div>

      {/* Thin progress bar at bottom */}
      {!isDone && (
        <div
          style={{
            position:   'fixed',
            bottom:     0,
            left:       0,
            right:      0,
            height:     '3px',
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              height:     '100%',
              background: accentCol,
              transition: 'width 1s linear',
              width:      `${progressPct}%`,
            }}
          />
        </div>
      )}

      {/* Phase switch hint (only on prep) */}
      {phase === 'prep' && !isDone && (
        <p
          style={{
            position:     'absolute',
            bottom:       '2.5rem',
            color:        'rgba(255,255,255,0.2)',
            fontSize:     '12px',
            fontFamily:   'Glacial Indifference, Trebuchet MS, sans-serif',
            letterSpacing: '0.05em',
          }}
        >
          Speaking timer starts automatically
        </p>
      )}
    </div>
  )
}
