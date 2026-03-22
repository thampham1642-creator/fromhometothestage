'use client'

interface Props {
  transcript: string
  onRequestFeedback: () => void
  feedbackLoading?: boolean
  feedbackDone?: boolean
}

export function TranscriptPanel({ transcript, onRequestFeedback, feedbackLoading, feedbackDone }: Props) {
  const isEmpty = !transcript || transcript.trim().length === 0

  return (
    <div className="transcript-panel" style={{
      marginTop:    '1.5rem',
      padding:      '20px',
      borderRadius: '14px',
      background:   'rgba(255,255,255,0.05)',
      border:       '1px solid rgba(255,255,255,0.1)',
    }}>
      <p style={{
        fontFamily:    'Glacial Indifference, Trebuchet MS, sans-serif',
        fontSize:      '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color:         'rgba(255,255,255,0.35)',
        marginBottom:  '10px',
      }}>
        Your answer
      </p>

      <p style={{
        fontFamily: 'Fredoka, sans-serif',
        fontSize:   '15px',
        fontWeight:  400,
        color:      isEmpty ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
        lineHeight: 1.6,
        margin:     0,
        fontStyle:  isEmpty ? 'italic' : 'normal',
      }}>
        {isEmpty
          ? 'No speech detected. Try again?'
          : `"${transcript}"`
        }
      </p>

      {!isEmpty && !feedbackDone && (
        <button
          onClick={onRequestFeedback}
          disabled={feedbackLoading}
          style={{
            marginTop:     '16px',
            padding:       '10px 24px',
            fontFamily:    'Glacial Indifference, Trebuchet MS, sans-serif',
            fontSize:      '13px',
            letterSpacing: '0.03em',
            color:         '#fff',
            background:    feedbackLoading ? 'rgba(212, 98, 42, 0.3)' : 'rgba(212, 98, 42, 0.2)',
            border:        '1px solid var(--accent)',
            borderRadius:  '10px',
            cursor:        feedbackLoading ? 'not-allowed' : 'pointer',
            transition:    'all 0.2s ease',
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '6px',
          }}
          onMouseOver={(e) => {
            if (!feedbackLoading) {
              e.currentTarget.style.background = 'rgba(212, 98, 42, 0.4)'
            }
          }}
          onMouseOut={(e) => {
            if (!feedbackLoading) {
              e.currentTarget.style.background = 'rgba(212, 98, 42, 0.2)'
            }
          }}
        >
          {feedbackLoading ? (
            <>
              <span className="feedback-spinner" />
              Analyzing...
            </>
          ) : (
            '✦ AI Feedback'
          )}
        </button>
      )}
    </div>
  )
}
