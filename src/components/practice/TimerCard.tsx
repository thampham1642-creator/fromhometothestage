'use client'

import { type useTimer } from '@/hooks/useTimer'

type TimerHook = ReturnType<typeof useTimer>

interface Props {
  label:      string
  timer:      TimerHook
  startLabel: string
  disabled?:  boolean
  onStart?:   () => void   // optional override — triggers focus mode
}

export function TimerCard({ label, timer, startLabel, disabled = false, onStart }: Props) {
  const { seconds, state, stop, reset, adjust, format } = timer

  const handlePrimary = () => {
    if (state === 'idle') {
      if (disabled) return
      onStart ? onStart() : timer.start()
    } else if (state === 'running') {
      stop()
    } else {
      reset()
    }
  }

  const btnLabel =
    state === 'running' ? 'Stop' :
    state === 'done'    ? 'Reset' :
    startLabel

  const isRunning = state === 'running'
  const isDone    = state === 'done'
  const isDisabled = disabled && state === 'idle'

  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ background: '#fff', border: '1px solid var(--sand)' }}
    >
      <div
        className="text-xs uppercase tracking-widest font-glacial mb-3"
        style={{ color: 'var(--ink3)' }}
      >
        {label}
      </div>

      <div
        className={`font-fredoka text-5xl font-semibold leading-none mb-4${isRunning ? ' timer-running' : ''}`}
        style={{ color: isDone ? 'var(--accent)' : 'var(--ink)' }}
      >
        {isDone ? 'Done' : format(seconds)}
      </div>

      {/* ± adjust */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => adjust(-30)}
          disabled={isRunning}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--sand)', background: '#fff',
            color: 'var(--ink2)', cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.4 : 1, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >−</button>

        <span className="text-sm font-glacial" style={{ color: 'var(--ink3)', minWidth: 36 }}>
          {seconds}s
        </span>

        <button
          onClick={() => adjust(30)}
          disabled={isRunning}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '1px solid var(--sand)', background: '#fff',
            color: 'var(--ink2)', cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.4 : 1, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >+</button>
      </div>

      <button
        onClick={handlePrimary}
        disabled={isDisabled}
        className="w-full py-2.5 rounded-lg text-sm font-glacial transition-all"
        style={{
          background:  isRunning ? 'var(--ink)' : '#fff',
          color:       isRunning ? 'var(--cream)' : isDisabled ? 'var(--ink3)' : 'var(--ink2)',
          border:      isRunning ? '1px solid var(--ink)' : '1px solid var(--sand)',
          cursor:      isDisabled ? 'not-allowed' : 'pointer',
          opacity:     isDisabled ? 0.5 : 1,
        }}
        onMouseOver={(e) => {
          if (!isRunning && !isDisabled) {
            e.currentTarget.style.background  = 'var(--ink)'
            e.currentTarget.style.color       = 'var(--cream)'
            e.currentTarget.style.borderColor = 'var(--ink)'
          }
        }}
        onMouseOut={(e) => {
          if (!isRunning && !isDisabled) {
            e.currentTarget.style.background  = '#fff'
            e.currentTarget.style.color       = 'var(--ink2)'
            e.currentTarget.style.borderColor = 'var(--sand)'
          }
        }}
      >
        {btnLabel}
      </button>
    </div>
  )
}
