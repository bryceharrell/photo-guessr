'use client'

import type { Round } from '@/lib/types'
import MapViewDynamic from './MapViewDynamic'

type Props = {
  round: Round
  isLastRound: boolean
  onNext: () => void
}

export default function RoundResultScreen({ round, isLastRound, onNext }: Props) {
  const guessPin =
    round.guessedLat != null && round.guessedLng != null
      ? { lat: round.guessedLat, lng: round.guessedLng }
      : null

  const actualPin = { lat: round.photo.lat!, lng: round.photo.lng! }

  return (
    <div className="relative w-full h-screen">
      <MapViewDynamic guessPin={guessPin} actualPin={actualPin} resultMode />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-2xl px-8 py-5 text-center shadow-2xl">
        {guessPin === null ? (
          <p className="text-red-400 font-semibold text-lg mb-3">Time&apos;s up!</p>
        ) : (
          <>
            <p className="text-zinc-400 text-sm mb-1">Distance</p>
            <p className="text-3xl font-bold mb-3">
              {round.distanceMiles?.toFixed(1)}{' '}
              <span className="text-lg font-normal text-zinc-400">miles</span>
            </p>
          </>
        )}
        <p className="text-zinc-400 text-sm mb-1">Score</p>
        <p className="text-3xl font-bold mb-5">{round.score?.toLocaleString()}</p>
        <button
          onClick={onNext}
          className="bg-white text-black font-semibold px-8 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          {isLastRound ? 'See Results' : 'Next Round'}
        </button>
      </div>
    </div>
  )
}
