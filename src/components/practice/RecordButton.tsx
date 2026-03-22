'use client'

import { type useSpeechRecognition } from '@/hooks/useSpeechRecognition'

type RecordState = 'idle' | 'recording' | 'done'
type SpeechHook = ReturnType<typeof useSpeechRecognition>

interface Props {
  recordState: RecordState
  onStateChange: (state: RecordState) => void
  onManualStop: () => void
  speech: SpeechHook
  disabled?: boolean
}

export function RecordButton({ recordState, onStateChange, onManualStop, speech, disabled }: Props) {
  if (!speech.isSupported) {
    return (
      <div
        style={{
          marginTop:    '1.5rem',
          padding:      '12px 20px',
          borderRadius: '10px',
          background:   'rgba(255,255,255,0.06)',
          border:       '1px solid rgba(255,255,255,0.1)',
          textAlign:    'center',
        }}
      >
        <p style={{
          fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
          fontSize:   '13px',
          color:      'rgba(255,200,150,0.8)',
          margin:     0,
        }}>
          ⚠ Recording is not supported on this browser. Please use Chrome or Edge.
        </p>
      </div>
    )
  }

  const handleClick = () => {
    if (recordState === 'idle') {
      onStateChange('recording')   // FocusTimer handles speech.start()
    } else if (recordState === 'recording') {
      onManualStop()               // FocusTimer handles speech.stop() + transcript
    }
  }

  if (recordState === 'done') return null

  const isRecording = recordState === 'recording'

  return (
    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
      {speech.error && (
        <p style={{
          fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
          fontSize:   '12px',
          color:      '#ef4444',
          marginBottom: '8px',
        }}>
          {speech.error}
        </p>
      )}

      <button
        onClick={handleClick}
        disabled={disabled}
        className={isRecording ? 'record-btn recording' : 'record-btn'}
        style={{
          padding:       '12px 28px',
          fontFamily:    'Glacial Indifference, Trebuchet MS, sans-serif',
          fontSize:      '14px',
          letterSpacing: '0.04em',
          color:         isRecording ? '#fff' : 'rgba(255,255,255,0.85)',
          background:    isRecording ? 'rgba(220, 38, 38, 0.15)' : 'rgba(255,255,255,0.06)',
          border:        isRecording ? '1.5px solid #dc2626' : '1px solid rgba(255,255,255,0.25)',
          borderRadius:  '12px',
          cursor:        disabled ? 'not-allowed' : 'pointer',
          opacity:       disabled ? 0.5 : 1,
          transition:    'all 0.2s ease',
        }}
      >
        {isRecording ? '⏹ Stop Recording' : '🎙 Start Recording'}
      </button>

      {/* Real-time preview while recording */}
      {isRecording && (speech.transcript || speech.interimText) && (
        <div style={{
          marginTop:    '1rem',
          padding:      '10px 16px',
          borderRadius: '8px',
          background:   'rgba(255,255,255,0.04)',
          border:       '1px solid rgba(255,255,255,0.08)',
          maxHeight:    '100px',
          overflowY:    'auto',
        }}>
          <p style={{
            fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
            fontSize:   '12px',
            color:      'rgba(255,255,255,0.5)',
            margin:     0,
            lineHeight: 1.5,
          }}>
            {speech.transcript}
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{speech.interimText}</span>
          </p>
        </div>
      )}
    </div>
  )
}
