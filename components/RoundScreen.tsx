'use client'

import { useState } from 'react'
import type { Round } from '@/lib/types'
import MapViewDynamic from './MapViewDynamic'
import PhotoPiP from './PhotoPiP'

type Props = {
  round: Round
  roundNumber: number
  totalRounds: number
  onSubmitGuess: (lat: number, lng: number) => void
}

export default function RoundScreen({ round, roundNumber, totalRounds, onSubmitGuess }: Props) {
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null)

  return (
    <div className="relative w-full h-screen">
      <MapViewDynamic onPinDrop={(lat, lng) => setPin({ lat, lng })} guessPin={pin} />

      <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-lg pointer-events-none">
        Round {roundNumber} of {totalRounds}
      </div>

      <PhotoPiP previewUrl={round.photo.previewUrl} />

      <button
        onClick={() => pin && onSubmitGuess(pin.lat, pin.lng)}
        disabled={!pin}
        className="absolute bottom-4 right-4 z-10 px-6 py-3 bg-white text-black font-semibold rounded-xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors"
      >
        Submit Guess
      </button>
    </div>
  )
}
