'use client'

import type { Round } from '@/lib/types'

type Props = {
  rounds: Round[]
  onPlayAgain: () => void
}

export default function EndScreen({ rounds, onPlayAgain }: Props) {
  const totalScore = rounds.reduce((sum, r) => sum + (r.score ?? 0), 0)
  const maxScore = rounds.length * 5000

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-1">Game Over</h2>
          <p className="text-zinc-400 text-sm">Total Score</p>
          <p className="text-6xl font-bold mt-1">{totalScore.toLocaleString()}</p>
          <p className="text-zinc-500 text-sm mt-1">out of {maxScore.toLocaleString()}</p>
        </div>

        <ul className="space-y-3 mb-8">
          {rounds.map((round, i) => (
            <li key={round.id} className="flex items-center gap-4 bg-zinc-900 rounded-xl px-4 py-3">
              <img
                src={round.photo.previewUrl}
                alt=""
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-400">Round {i + 1}</p>
                <p className="text-sm text-zinc-300">{round.distanceMiles?.toFixed(1)} miles off</p>
              </div>
              <p className="text-white font-semibold tabular-nums">{round.score?.toLocaleString()}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={onPlayAgain}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}
