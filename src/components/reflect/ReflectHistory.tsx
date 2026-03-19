'use client'

import { type Reflection } from '@/types'

interface Props {
  reflections: Reflection[]
  loading:     boolean
}

export function ReflectHistory({ reflections, loading }: Props) {
  if (loading) return <LoadingSkeleton />

  if (reflections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-fredoka text-xl font-medium mb-2" style={{ color: 'var(--ink)' }}>
          No reflections yet
        </p>
        <p className="text-sm font-glacial" style={{ color: 'var(--ink3)' }}>
          After each session, save a reflection to start building your log.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reflections.map((r) => (
        <ReflectionCard key={r.id} reflection={r} />
      ))}
    </div>
  )
}

function ReflectionCard({ reflection: r }: { reflection: Reflection }) {
  const date = new Date(r.practiced_on + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })

  // Type-safe access — session is typed as an optional nested object in Reflection
  const sessionDifficulty = r.session?.difficulty ?? null
  const questionText      = r.session?.question?.text ?? null

  const isHard = sessionDifficulty === 'hard'

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--sand)', background: '#fff' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--sand)', background: 'var(--warm)' }}
      >
        <span
          className="text-xs uppercase tracking-widest font-glacial"
          style={{ color: 'var(--ink3)' }}
        >
          {date}
        </span>
        {sessionDifficulty && (
          <span
            className="text-xs uppercase tracking-wider font-glacial px-2 py-0.5 rounded"
            style={{
              border: `1px solid ${isHard ? 'var(--accent)' : 'var(--sand)'}`,
              color:  isHard ? 'var(--accent)' : 'var(--ink3)',
            }}
          >
            {sessionDifficulty}
          </span>
        )}
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Question context */}
        {questionText && (
          <p
            className="font-fredoka text-base font-medium leading-snug"
            style={{ color: 'var(--ink)' }}
          >
            {questionText}
          </p>
        )}

        {[
          { label: 'How I felt',     value: r.feeling  },
          { label: 'What went well', value: r.did_well },
          { label: 'To improve',     value: r.improve  },
        ].map(({ label, value }) => (
          <div key={label}>
            <div
              className="text-xs uppercase tracking-widest font-glacial mb-1"
              style={{ color: 'var(--ink3)' }}
            >
              {label}
            </div>
            <p
              className="text-sm font-glacial leading-relaxed"
              style={{ color: 'var(--ink2)' }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl h-52 animate-pulse"
          style={{ background: 'var(--warm)', border: '1px solid var(--sand)' }}
        />
      ))}
    </div>
  )
}
