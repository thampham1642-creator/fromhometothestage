'use client'

import { type Difficulty } from '@/types'

interface Props {
  question: { id: string; text: string; difficulty: Difficulty } | null
  loading:  boolean
  isShuffling?: boolean
  isLocked?: boolean
  shuffleText?: string | null
}

const DIFF_LABEL: Record<Difficulty, string> = {
  easy:   'Easy',
  medium: 'Medium',
  hard:   'Hard',
}

export function QuestionCard({ question, loading, isShuffling, isLocked, shuffleText }: Props) {
  return (
    <div
      className="rounded-xl px-8 py-7 mb-5 flex flex-col justify-center min-h-[150px]"
      style={{ background: '#fff', border: '1px solid var(--sand)' }}
    >
      {loading && !isShuffling ? (
        <p className="text-center font-glacial text-sm" style={{ color: 'var(--ink3)' }}>
          Finding your question...
        </p>
      ) : question || (isShuffling && shuffleText) ? (
        <>
          <div
            className="text-xs uppercase tracking-widest font-glacial mb-3"
            style={{ color: 'var(--ink3)' }}
          >
            {question ? DIFF_LABEL[question.difficulty] : '•••'}
          </div>
          <p
            className={`font-fredoka text-2xl font-medium leading-snug ${isShuffling ? 'question-shuffling' : isLocked ? 'question-locked' : ''}`}
            style={{ color: 'var(--ink)' }}
          >
            {isShuffling ? shuffleText : question?.text}
          </p>
        </>
      ) : (
        <p
          className="text-center font-glacial text-sm"
          style={{ color: 'var(--ink3)', lineHeight: 1.6 }}
        >
          Hit the button below — your question awaits.
        </p>
      )}
    </div>
  )
}
