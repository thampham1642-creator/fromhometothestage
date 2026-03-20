'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Difficulty } from '@/types'

interface Question {
  id: string
  text: string
  difficulty: Difficulty
  category?: string
}

interface Props {
  questions: Question[]
  onLock: (q: Question) => void
}

const SPREAD    = 0.38
const RADIUS_XZ = 420
const RADIUS_Y  = 160

const DIFF_LABEL: Record<Difficulty, string> = {
  easy:   'Easy',
  medium: 'Medium',
  hard:   'Hard',
}

import { getAudioCtx, playTick, playDing } from '@/lib/audio';


export function QuestionCarousel({ questions, onLock }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [lockedIndex, setLockedIndex] = useState<number | null>(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    setActiveIndex(0)
    setLockedIndex(0)
    if (questions.length > 0) {
      onLock(questions[0])
    }
  }, [questions])

  const notifyLock = (idx: number) => {
    onLock(questions[idx])
  }

  const goNext = useCallback(() => {
    if (isSpinning || questions.length === 0) return
    setActiveIndex(prev => {
      const next = (prev + 1) % questions.length
      setLockedIndex(next)
      notifyLock(next)
      return next
    })
  }, [isSpinning, questions.length])

  const goPrev = useCallback(() => {
    if (isSpinning || questions.length === 0) return
    setActiveIndex(prev => {
      const next = prev === 0 ? questions.length - 1 : prev - 1
      setLockedIndex(next)
      notifyLock(next)
      return next
    })
  }, [isSpinning, questions.length])

  const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = e.changedTouches[0].clientX - touchStart
    if (diff > 50) goPrev()
    if (diff < -50) goNext()
    setTouchStart(null)
  }

  const handleSpin = async () => {
    if (isSpinning || questions.length <= 1) return
    setIsSpinning(true)
    setLockedIndex(null)

    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') await ctx.resume();

    const totalSteps = questions.length * 2 + Math.floor(Math.random() * (questions.length - 1)) + 1
    let currentStep = 0

    const stepSpin = () => {
      setActiveIndex(prev => (prev + 1) % questions.length)
      playTick()
      currentStep++

      if (currentStep < totalSteps) {
        const p = currentStep / totalSteps
        const interval = p < 0.45
          ? 55 + p * 80
          : 70 + Math.pow((p - 0.45) / 0.55, 2) * 340

        setTimeout(stepSpin, interval)
      } else {
        setIsSpinning(false)
        setActiveIndex(prev => {
          setLockedIndex(prev)
          notifyLock(prev)
          return prev
        })
        playDing()
      }
    }

    stepSpin()
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="w-full h-[260px] flex items-center justify-center rounded-xl border border-[var(--sand)] bg-[#fff] mb-5">
        <p className="text-sm font-glacial" style={{ color: 'var(--ink3)' }}>Loading questions...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full mb-5">
      <div 
        className="relative w-full max-w-[640px] h-[260px] mb-6 overflow-hidden select-none"
        style={{ perspective: '600px', perspectiveOrigin: '50% 80%' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0 w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {questions.map((q, idx) => {
            let rel = idx - activeIndex
            if (rel > questions.length / 2) rel -= questions.length
            if (rel < -questions.length / 2) rel += questions.length

            const angle = rel * SPREAD
            const tx = Math.sin(angle) * RADIUS_XZ
            const tz = -(1 - Math.cos(angle)) * RADIUS_XZ * 0.85
            const ty = -(1 - Math.cos(angle)) * RADIUS_Y
            const ry = -angle * (180 / Math.PI) * 0.9
            const rx = Math.abs(angle) * 8
            
            const cosA = Math.cos(angle)
            const isCtr = idx === activeIndex
            const scale = isCtr ? 1.15 : Math.max(0.60, 0.62 + cosA * 0.24)
            const opacity = isCtr ? 1 : Math.max(0.12, 0.22 + cosA * 0.35)
            const zIndex = Math.round(cosA * 10) + 10

            const isLockedCard = !isSpinning && lockedIndex === idx
            const popAnimation = isLockedCard ? 'lockPop 0.28s ease-out forwards' : 'none'

            return (
              <div
                key={`${q.id}-${idx}`}
                onClick={() => {
                  if (!isSpinning && !isCtr) {
                    setActiveIndex(idx)
                    setLockedIndex(idx)
                    notifyLock(idx)
                  }
                }}
                className="absolute top-1/2 left-1/2 cursor-pointer transition-all"
                style={{
                  width: '200px',
                  height: '140px',
                  marginLeft: '-100px',
                  marginTop: '-70px',
                  transform: `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transition: isSpinning ? 'none' : 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.5s ease',
                }}
              >
                <div
                  className="w-full h-full flex flex-col justify-center items-center text-center p-4"
                  style={{
                    borderRadius: '12px',
                    background: isCtr ? 'var(--cream)' : 'var(--warm)',
                    border: isCtr ? '1.5px solid var(--ink)' : '0.5px solid var(--sand)',
                    color: isCtr ? 'var(--ink)' : 'var(--ink3)',
                    fontWeight: isCtr ? 500 : 400,
                    fontSize: isCtr ? '14px' : '12px',
                    boxShadow: isCtr ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
                    animation: popAnimation,
                  }}
                >
                  <div className="text-[10px] uppercase tracking-widest font-glacial mb-2 opacity-80">
                    {DIFF_LABEL[q.difficulty] || q.difficulty}
                  </div>
                  <p className="font-fredoka leading-snug line-clamp-4">
                    {q.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-[640px]">
        <button
          onClick={goPrev}
          disabled={isSpinning || questions.length <= 1}
          className="px-4 py-3.5 rounded-xl font-bold text-xl disabled:opacity-50 transition-all hover:bg-[var(--sand)] flex items-center justify-center"
          style={{ background: 'var(--warm)', color: 'var(--ink2)', border: '1px solid var(--sand)' }}
        >
          &lsaquo;
        </button>
        <button
          onClick={handleSpin}
          disabled={isSpinning || questions.length <= 1}
          className="flex-1 py-3.5 rounded-xl font-fredoka text-lg font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'var(--ink)',
            color: 'var(--cream)',
            border: 'none',
            letterSpacing: '0.02em',
          }}
          onMouseOver={(e) => { if (!isSpinning) e.currentTarget.style.background = '#333330' }}
          onMouseOut={(e)  => { e.currentTarget.style.background = 'var(--ink)' }}
        >
          {isSpinning ? 'Spinning...' : 'Random Question'}
        </button>
        <button
          onClick={goNext}
          disabled={isSpinning || questions.length <= 1}
          className="px-4 py-3.5 rounded-xl font-bold text-xl disabled:opacity-50 transition-all hover:bg-[var(--sand)] flex items-center justify-center"
          style={{ background: 'var(--warm)', color: 'var(--ink2)', border: '1px solid var(--sand)' }}
        >
          &rsaquo;
        </button>
      </div>
    </div>
  )
}
