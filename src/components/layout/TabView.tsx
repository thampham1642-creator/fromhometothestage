'use client'

import { useState } from 'react'
import { PracticeTab }  from '@/components/practice/PracticeTab'
import { ChallengesTab } from '@/components/challenges/ChallengesTab'
import { ReflectTab }   from '@/components/reflect/ReflectTab'

type Tab = 'practice' | 'challenges' | 'reflect'

const TABS: { id: Tab; label: string }[] = [
  { id: 'practice',   label: 'Practice' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'reflect',    label: 'Reflect' },
]

interface Props {
  // sessionId is passed from PracticeTab after "Mark as done"
  // so we can auto-navigate to Reflect with it pre-filled
  initialTab?: Tab
  pendingSessionId?: string | null
  pendingQuestionText?: string | null
}

export function TabView({ initialTab, pendingSessionId, pendingQuestionText }: Props) {
  const [active, setActive]             = useState<Tab>(initialTab ?? 'practice')
  const [sessionId, setSessionId]       = useState<string | null>(pendingSessionId ?? null)
  const [questionText, setQuestionText] = useState<string | null>(pendingQuestionText ?? null)

  const handleDone = (sid: string, qText: string) => {
    setSessionId(sid)
    setQuestionText(qText)
    setActive('reflect')
  }

  const handleReflected = () => {
    setSessionId(null)
    setQuestionText(null)
  }

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex mb-6 rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--sand)', background: '#fff', width: 'fit-content' }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className="px-5 py-2 text-sm font-glacial transition-colors"
            style={{
              background:  active === tab.id ? 'var(--ink)' : 'transparent',
              color:       active === tab.id ? 'var(--cream)' : 'var(--ink2)',
              borderTop:   'none',
              borderBottom:'none',
              borderLeft:  'none',
              borderRight: i < TABS.length - 1 ? '1px solid var(--sand)' : 'none',
              cursor:      'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === 'practice'   && <PracticeTab  onDone={handleDone} />}
      {active === 'challenges' && <ChallengesTab />}
      {active === 'reflect'    && (
        <ReflectTab
          pendingSessionId={sessionId}
          pendingQuestionText={questionText}
          onReflected={handleReflected}
        />
      )}
    </div>
  )
}
