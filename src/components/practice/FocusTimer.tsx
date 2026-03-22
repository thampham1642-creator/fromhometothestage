'use client'

import { useState, useEffect, useRef } from 'react'
import { type useTimer } from '@/hooks/useTimer'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { playBell, playApplause } from '@/lib/audio'
import { RecordButton } from './RecordButton'
import { TranscriptPanel } from './TranscriptPanel'
import { FeedbackPanel } from './FeedbackPanel'

type TimerHook = ReturnType<typeof useTimer>
type RecordState = 'idle' | 'recording' | 'done'

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

  // Speech recognition — owned here so it survives RecordButton unmount
  const speech = useSpeechRecognition()

  // Recording + Feedback state
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [transcript, setTranscript] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Capture the initial seconds when the component mounts or phase changes
  const initialSecondsRef = useRef(seconds)
  useEffect(() => {
    initialSecondsRef.current = seconds
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Reset recording state when phase changes
  useEffect(() => {
    setRecordState('idle')
    setTranscript('')
    setShowFeedback(false)
    setFeedbackLoading(false)
    speech.reset()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const total = initialSecondsRef.current
  const progressPct = total > 0 ? Math.max(0, Math.min(100, ((total - seconds) / total) * 100)) : 0

  // When the timer hits done, play the correct sound based on phase
  // Also auto-stop recording if it was active — NOW we can call speech.stop() here
  useEffect(() => {
    if (state === 'done') {
      if (phase === 'prep') {
        playBell()
      } else {
        playApplause()
        // If recording was in progress, stop it and capture transcript
        if (recordState === 'recording') {
          const finalText = speech.stop()
          setTranscript(finalText)
          setRecordState('done')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, phase])

  const handleRecordStateChange = (newState: RecordState) => {
    if (newState === 'recording') {
      speech.start()
    }
    setRecordState(newState)
  }

  const handleManualStop = () => {
    const finalText = speech.stop()
    setTranscript(finalText)
    setRecordState('done')
  }

  const handleRequestFeedback = () => {
    setFeedbackLoading(true)
    setShowFeedback(true)
  }

  const phaseBg   = phase === 'prep' ? 'var(--ink)' : '#0e0e0c'
  const accentCol = 'var(--accent)'
  const isRunning = state === 'running'
  const isDone    = state === 'done'

  const isSpeakPhase = phase === 'speak'
  const showRecordBtn = isSpeakPhase && (isRunning || recordState === 'recording') && recordState !== 'done'
  const showTranscript = isSpeakPhase && recordState === 'done' && !showFeedback
  const showFeedbackPanel = isSpeakPhase && showFeedback

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
        overflowY:      'auto',
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

      {/* Scrollable content area */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        maxWidth:      '640px',
        width:         '100%',
      }}>
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
            marginBottom: '2.5rem',
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

        {/* Record button — only during speak phase while running */}
        {showRecordBtn && (
          <RecordButton
            recordState={recordState}
            onStateChange={handleRecordStateChange}
            onManualStop={handleManualStop}
            speech={speech}
          />
        )}

        {/* Transcript panel — after recording is done */}
        {showTranscript && (
          <TranscriptPanel
            transcript={transcript}
            onRequestFeedback={handleRequestFeedback}
            feedbackLoading={feedbackLoading}
          />
        )}

        {/* Feedback panel — after user requests AI feedback */}
        {showFeedbackPanel && (
          <FeedbackPanel
            question={questionText}
            answer={transcript}
          />
        )}
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

      {/* Manual transition button when done (only show if no recording flow is active) */}
      {isDone && !showTranscript && !showFeedbackPanel && (
        <button
          onClick={onPhaseComplete}
          style={{
            marginTop:    '2rem',
            padding:      '12px 32px',
            fontFamily:   'Glacial Indifference, Trebuchet MS, sans-serif',
            fontSize:     '14px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color:        '#fff',
            background:   'transparent',
            border:       `1px solid rgba(255,255,255,0.4)`,
            borderRadius: '8px',
            cursor:       'pointer',
            transition:   'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
          }}
        >
          {phase === 'prep' ? 'Start Speaking Time' : 'Finish'}
        </button>
      )}
    </div>
  )
}
