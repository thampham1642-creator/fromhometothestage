'use client'

import { useState } from 'react'

interface Props {
  sessionId:    string | null
  questionText: string | null
  onSaved:      () => void
}

const today = () => new Date().toISOString().split('T')[0]

const PROMPTS = [
  { key: 'feeling',  label: 'How did you feel after today\'s practice?',      placeholder: 'e.g. nervous at first, but more confident by the end...' },
  { key: 'did_well', label: 'What do you think you did well?',                 placeholder: 'e.g. I structured my answer clearly...' },
  { key: 'improve',  label: 'What would you like to improve next time?',       placeholder: 'e.g. I need to slow down and make more eye contact...' },
]

export function ReflectForm({ sessionId, questionText, onSaved }: Props) {
  const [practicedOn, setPracticedOn] = useState(today())
  const [fields, setFields]           = useState({ feeling: '', did_well: '', improve: '' })
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const allFilled = fields.feeling.trim() && fields.did_well.trim() && fields.improve.trim()

  const handleSave = async () => {
    if (!allFilled || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/reflect', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          session_id:   sessionId,
          practiced_on: practicedOn,
          ...fields,
        }),
      })
      if (!res.ok) throw new Error('Could not save reflection')
      onSaved()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Context card if we came from Practice */}
      {questionText && (
        <div
          className="rounded-xl px-5 py-4"
          style={{ background: 'var(--warm)', border: '1px solid var(--sand)' }}
        >
          <div className="text-xs uppercase tracking-widest font-glacial mb-1.5" style={{ color: 'var(--ink3)' }}>
            Today's question
          </div>
          <p className="font-fredoka text-lg font-medium leading-snug" style={{ color: 'var(--ink)' }}>
            {questionText}
          </p>
        </div>
      )}

      {/* Date */}
      <div>
        <label
          className="block text-xs uppercase tracking-widest font-glacial mb-1.5"
          style={{ color: 'var(--ink3)' }}
        >
          Date
        </label>
        <input
          type="date"
          value={practicedOn}
          onChange={(e) => setPracticedOn(e.target.value)}
          className="font-glacial text-sm rounded-lg px-4 py-2.5 w-full"
          style={{
            border: '1px solid var(--sand)', background: '#fff',
            color: 'var(--ink)', outline: 'none',
          }}
          onFocus={(e)  => (e.currentTarget.style.borderColor = 'var(--ink2)')}
          onBlur={(e)   => (e.currentTarget.style.borderColor = 'var(--sand)')}
        />
      </div>

      {/* Reflection prompts */}
      {PROMPTS.map(({ key, label, placeholder }) => (
        <div key={key}>
          <label
            className="block text-xs uppercase tracking-widest font-glacial mb-1.5"
            style={{ color: 'var(--ink3)' }}
          >
            {label}
          </label>
          <textarea
            value={fields[key as keyof typeof fields]}
            onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            rows={3}
            className="w-full font-glacial text-sm rounded-lg px-4 py-3 resize-none"
            style={{
              border: '1px solid var(--sand)', background: '#fff',
              color: 'var(--ink)', outline: 'none',
              lineHeight: 1.6,
            }}
            onFocus={(e)  => (e.currentTarget.style.borderColor = 'var(--ink2)')}
            onBlur={(e)   => (e.currentTarget.style.borderColor = 'var(--sand)')}
          />
        </div>
      ))}

      {error && (
        <p className="text-sm font-glacial" style={{ color: 'var(--accent)' }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={!allFilled || saving}
        className="w-full py-3.5 rounded-xl font-fredoka text-lg font-semibold transition-all"
        style={{
          background: !allFilled || saving ? 'var(--ink2)' : 'var(--ink)',
          color: 'var(--cream)',
          border: 'none',
          cursor: !allFilled || saving ? 'not-allowed' : 'pointer',
          letterSpacing: '0.02em',
        }}
        onMouseOver={(e) => { if (allFilled && !saving) e.currentTarget.style.background = '#333330' }}
        onMouseOut={(e)  => { e.currentTarget.style.background = !allFilled || saving ? 'var(--ink2)' : 'var(--ink)' }}
      >
        {saving ? 'Saving...' : 'Save Reflection'}
      </button>
    </div>
  )
}
