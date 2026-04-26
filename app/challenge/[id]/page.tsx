'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import ChallengeIntroScreen from '@/components/ChallengeIntroScreen'
import RoundScreen from '@/components/RoundScreen'
import RoundResultScreen from '@/components/RoundResultScreen'
import ChallengeEndScreen from '@/components/ChallengeEndScreen'
import type { Round } from '@/lib/types'

type ApiRound = {
  id: string
  order: number
  photoUrl: string
  lat: number
  lng: number
}

export default function ChallengePage() {
  const params = useParams()
  const challengeId = params.id as string
  const [rounds, setRounds] = useState<Round[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const { gameState, startChallenge, submitGuess, nextRound, timeoutRound } = useGameState()

  useEffect(() => {
    fetch(`/api/challenges/${challengeId}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found')
        return res.json()
      })
      .then((data: { rounds: ApiRound[] }) => {
        const built: Round[] = data.rounds.map((r) => ({
          id: r.id,
          photo: {
            id: r.id,
            previewUrl: r.photoUrl,
            lat: r.lat,
            lng: r.lng,
            hasLocation: true,
          },
          guessedLat: null,
          guessedLng: null,
          distanceMiles: null,
          score: null,
          completed: false,
        }))
        setRounds(built)
        setLoading(false)
      })
      .catch(() => {
        setFetchError('Challenge not found.')
        setLoading(false)
      })
  }, [challengeId])

  if (gameState.status === 'upload') {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
        </div>
      )
    }
    if (fetchError || !rounds) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-zinc-400">{fetchError ?? 'Challenge not found.'}</p>
        </div>
      )
    }
    return <ChallengeIntroScreen onStart={() => startChallenge(rounds)} />
  }

  if (gameState.status === 'playing') {
    const round = gameState.rounds[gameState.currentRoundIndex]
    return (
      <RoundScreen
        key={round.id}
        round={round}
        roundNumber={gameState.currentRoundIndex + 1}
        totalRounds={gameState.rounds.length}
        onSubmitGuess={submitGuess}
        onTimeout={timeoutRound}
      />
    )
  }

  if (gameState.status === 'round_result') {
    const round = gameState.rounds[gameState.currentRoundIndex]
    const isLastRound = gameState.currentRoundIndex === gameState.rounds.length - 1
    return (
      <RoundResultScreen
        round={round}
        isLastRound={isLastRound}
        onNext={nextRound}
      />
    )
  }

  return <ChallengeEndScreen rounds={gameState.rounds} challengeId={challengeId} />
}
