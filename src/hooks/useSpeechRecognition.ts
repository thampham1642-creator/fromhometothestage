import { useState, useRef, useCallback } from 'react'

interface SpeechRecognitionHook {
  start: () => void
  stop: () => string
  transcript: string
  interimText: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  reset: () => void
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')
  const interimRef = useRef('')        // ← track latest interim in a ref too

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    // Reset state
    finalTranscriptRef.current = ''
    interimRef.current = ''
    setTranscript('')
    setInterimText('')
    setError(null)

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += text + ' '
        } else {
          interim += text
        }
      }
      interimRef.current = interim       // ← always keep latest interim in ref
      setTranscript(finalTranscriptRef.current)
      setInterimText(interim)
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone access and try again.')
      } else if (e.error === 'no-speech') {
        // This is expected when user is silent — don't treat as error
      } else {
        setError(`Speech recognition error: ${e.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [isSupported])

  const stop = useCallback((): string => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)

    // Combine finalised text + any pending interim text
    // (interim text is what the user saw on screen but wasn't marked isFinal yet)
    const combined = (finalTranscriptRef.current + interimRef.current).trim()

    setInterimText('')
    interimRef.current = ''

    return combined
  }, [])

  const reset = useCallback(() => {
    stop()
    finalTranscriptRef.current = ''
    interimRef.current = ''
    setTranscript('')
    setInterimText('')
    setError(null)
  }, [stop])

  return {
    start,
    stop,
    transcript,
    interimText,
    isListening,
    isSupported,
    error,
    reset,
  }
}
