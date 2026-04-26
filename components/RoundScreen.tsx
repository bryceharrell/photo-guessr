'use client'

import { useEffect, useRef, useState } from 'react'
import type { Round } from '@/lib/types'
import MapViewDynamic from './MapViewDynamic'
import PhotoPiP from './PhotoPiP'

const ROUND_SECONDS = 30

type Props = {
  round: Round
  roundNumber: number
  totalRounds: number
  onSubmitGuess: (lat: number, lng: number) => void
  onTimeout: () => void
}

export default function RoundScreen({ round, roundNumber, totalRounds, onSubmitGuess, onTimeout }: Props) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const pinRef = useRef<{ lat: number; lng: number } | null>(null)
  const onTimeoutRef = useRef(onTimeout)

  useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])
  useEffect(() => { pinRef.current = pin }, [pin])

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (secondsLeft === 0) {
      if (pinRef.current) {
        onSubmitGuess(pinRef.current.lat, pinRef.current.lng)
      } else {
        onTimeoutRef.current()
      }
    }
  }, [secondsLeft, onSubmitGuess])

  const timerColor =
    secondsLeft <= 5 ? 'text-red-400' : secondsLeft <= 10 ? 'text-yellow-400' : 'text-white'

  return (
    <div className="relative w-full h-screen">
      <MapViewDynamic onPinDrop={(lat, lng) => setPin({ lat, lng })} guessPin={pin} />

      <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-lg pointer-events-none">
        Round {roundNumber} of {totalRounds}
      </div>

      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-sm font-bold px-4 py-1.5 rounded-lg pointer-events-none tabular-nums ${timerColor}`}>
        {secondsLeft}s
      </div>

      <div className="absolute bottom-16 left-4 right-4 z-10 flex items-end justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <PhotoPiP previewUrl={round.photo.previewUrl} />
        </div>
        <button
          onClick={() => pin && onSubmitGuess(pin.lat, pin.lng)}
          disabled={!pin}
          className="pointer-events-auto flex-shrink-0 px-6 py-3 bg-white text-black font-semibold rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
        >
          Submit Guess
        </button>
      </div>
    </div>
  )
}
