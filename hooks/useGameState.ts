'use client'

import { useState } from 'react'
import type { GameState, Photo, Round } from '@/lib/types'
import { haversineDistance, calculateScore } from '@/lib/haversine'

const INITIAL_STATE: GameState = {
  status: 'upload',
  rounds: [],
  currentRoundIndex: 0,
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE)

  function startGame(photos: Photo[]) {
    const valid = photos.filter((p) => p.hasLocation)
    const shuffled = [...valid].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 5)
    const rounds: Round[] = selected.map((photo) => ({
      id: crypto.randomUUID(),
      photo,
      guessedLat: null,
      guessedLng: null,
      distanceMiles: null,
      score: null,
      completed: false,
    }))
    setGameState({ status: 'playing', rounds, currentRoundIndex: 0 })
  }

  function submitGuess(lat: number, lng: number) {
    setGameState((prev) => {
      const round = prev.rounds[prev.currentRoundIndex]
      const distanceMiles = haversineDistance(lat, lng, round.photo.lat!, round.photo.lng!)
      const score = calculateScore(distanceMiles)
      const updatedRound: Round = {
        ...round,
        guessedLat: lat,
        guessedLng: lng,
        distanceMiles,
        score,
        completed: true,
      }
      const updatedRounds = [...prev.rounds]
      updatedRounds[prev.currentRoundIndex] = updatedRound
      return { ...prev, status: 'round_result', rounds: updatedRounds }
    })
  }

  function nextRound() {
    setGameState((prev) => {
      const nextIndex = prev.currentRoundIndex + 1
      if (nextIndex >= prev.rounds.length) {
        return { ...prev, status: 'finished' }
      }
      return { ...prev, status: 'playing', currentRoundIndex: nextIndex }
    })
  }

  function resetGame() {
    setGameState(INITIAL_STATE)
  }

  return { gameState, startGame, submitGuess, nextRound, resetGame }
}
