'use client'

import { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface Props {
  question: string
  answer: string
}

const MAX_FOLLOW_UPS = 6

export function FeedbackPanel({ question, answer }: Props) {
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [followUpCount, setFollowUpCount] = useState(0)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const feedbackRef = useRef('')

  // Fetch initial feedback on mount
  useEffect(() => {
    let cancelled = false

    async function fetchFeedback() {
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, answer }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to get feedback')
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (cancelled) { reader.cancel(); return }

          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          setFeedback(accumulated)
        }

        feedbackRef.current = accumulated
        setLoading(false)

        // Initialize chat history with context
        setChatHistory([
          {
            role: 'system',
            content: `You are a public speaking coach. Context: Question was "${question}". User's answer was "${answer}". You already gave this feedback: "${accumulated}". Now answer the user's follow-up questions. Reply in the same language as the user's message. Keep responses concise.`,
          },
        ])
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    fetchFeedback()
    return () => { cancelled = true }
  }, [question, answer])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const sendFollowUp = async () => {
    const message = chatInput.trim()
    if (!message || chatLoading || followUpCount >= MAX_FOLLOW_UPS) return

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }]
    setChatHistory(newHistory)
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get response')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let accumulated = ''

      // Add a placeholder assistant message
      setChatHistory(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        // Update the last assistant message
        setChatHistory(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: accumulated }
          return updated
        })
      }

      setFollowUpCount(c => c + 1)
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendFollowUp()
    }
  }

  const chatMessages = chatHistory.filter(m => m.role !== 'system')

  return (
    <div style={{
      marginTop:    '1.5rem',
      borderRadius: '14px',
      background:   'rgba(255,255,255,0.05)',
      border:       '1px solid rgba(255,255,255,0.1)',
      overflow:     'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:       '16px 20px 12px',
        borderBottom:  '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontFamily:    'Glacial Indifference, Trebuchet MS, sans-serif',
          fontSize:      '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color:         'var(--accent)',
          margin:        0,
          display:       'flex',
          alignItems:    'center',
          gap:           '6px',
        }}>
          ✦ AI Feedback
          {loading && <span className="feedback-spinner" />}
        </p>
      </div>

      {/* Feedback content */}
      <div style={{ padding: '16px 20px' }}>
        {error ? (
          <p style={{
            fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
            fontSize:   '13px',
            color:      '#ef4444',
            margin:     0,
          }}>
            {error}
          </p>
        ) : (
          <div
            className="feedback-content"
            style={{
              fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
              fontSize:   '13px',
              color:      'rgba(255,255,255,0.75)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {renderMarkdown(feedback)}
          </div>
        )}
      </div>

      {/* Chat follow-up section */}
      {!loading && !error && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding:   '16px 20px',
        }}>
          {/* Chat messages */}
          {chatMessages.length > 0 && (
            <div style={{
              maxHeight: '240px',
              overflowY: 'auto',
              marginBottom: '12px',
            }}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '10px',
                    textAlign:   msg.role === 'user' ? 'right' : 'left',
                  }}
                >
                  <div style={{
                    display:      'inline-block',
                    maxWidth:     '85%',
                    padding:      '8px 14px',
                    borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background:   msg.role === 'user'
                      ? 'rgba(212, 98, 42, 0.2)'
                      : 'rgba(255,255,255,0.06)',
                    border:       msg.role === 'user'
                      ? '1px solid rgba(212, 98, 42, 0.3)'
                      : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <p style={{
                      fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
                      fontSize:   '13px',
                      color:      'rgba(255,255,255,0.75)',
                      lineHeight: 1.6,
                      margin:     0,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          {followUpCount >= MAX_FOLLOW_UPS ? (
            <p style={{
              fontFamily: 'Glacial Indifference, Trebuchet MS, sans-serif',
              fontSize:   '12px',
              color:      'rgba(255,255,255,0.35)',
              textAlign:  'center',
              margin:     0,
              fontStyle:  'italic',
            }}>
              Start a new session to continue practicing.
            </p>
          ) : (
            <div style={{
              display:      'flex',
              gap:          '8px',
              alignItems:   'flex-end',
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={chatLoading}
                style={{
                  flex:          1,
                  padding:       '10px 14px',
                  fontFamily:    'Glacial Indifference, Trebuchet MS, sans-serif',
                  fontSize:      '13px',
                  color:         'rgba(255,255,255,0.85)',
                  background:    'rgba(255,255,255,0.04)',
                  border:        '1px solid rgba(255,255,255,0.12)',
                  borderRadius:  '10px',
                  outline:       'none',
                  transition:    'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <button
                onClick={sendFollowUp}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding:      '10px 16px',
                  fontFamily:   'Glacial Indifference, Trebuchet MS, sans-serif',
                  fontSize:     '13px',
                  color:        '#fff',
                  background:   chatLoading || !chatInput.trim()
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(212, 98, 42, 0.3)',
                  border:       '1px solid',
                  borderColor:  chatLoading || !chatInput.trim()
                    ? 'rgba(255,255,255,0.08)'
                    : 'var(--accent)',
                  borderRadius: '10px',
                  cursor:       chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  transition:   'all 0.2s',
                  whiteSpace:   'nowrap',
                }}
              >
                {chatLoading ? '...' : 'Send ↗'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Simple markdown-like renderer for bold text */
function renderMarkdown(text: string) {
  if (!text) return null

  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{
          color:      'rgba(255,255,255,0.95)',
          fontWeight: 600,
          display:    'block',
          marginTop:  i > 0 ? '14px' : '0',
          marginBottom: '4px',
          fontSize:   '14px',
        }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}
