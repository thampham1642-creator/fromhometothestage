import { useState, useRef, useCallback, useEffect } from 'react'

export type TimerState = 'idle' | 'running' | 'done'

export function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [baseSeconds, setBaseSeconds] = useState(initialSeconds)
  const [state, setState] = useState<TimerState>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const remainingRef = useRef(initialSeconds)

  const start = useCallback(() => {
    if (intervalRef.current) return
    setState('running')
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1
      setSeconds(remainingRef.current)
      if (remainingRef.current <= 0) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setState('done')
      }
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setState('idle')
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Read baseSeconds from ref to avoid stale closure
    remainingRef.current = baseSRef.current
    setSeconds(baseSRef.current)
    setState('idle')
  }, [])

  // Keep a ref to baseSeconds so reset() doesn't need it in deps
  const baseSRef = useRef(initialSeconds)
  useEffect(() => { baseSRef.current = baseSeconds }, [baseSeconds])

  const adjust = useCallback((delta: number) => {
    if (intervalRef.current) return
    setBaseSeconds((prev) => {
      const next = Math.max(30, prev + delta)
      remainingRef.current = next
      baseSRef.current = next
      setSeconds(next)
      return next
    })
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  return { seconds, state, start, stop, reset, adjust, format }
}
