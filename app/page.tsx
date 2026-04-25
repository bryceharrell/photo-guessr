'use client'

import { useGameState } from '@/hooks/useGameState'
import UploadScreen from '@/components/UploadScreen'
import RoundScreen from '@/components/RoundScreen'
import RoundResultScreen from '@/components/RoundResultScreen'
import EndScreen from '@/components/EndScreen'

export default function Page() {
  const { gameState, startGame, submitGuess, nextRound, timeoutRound, resetGame } = useGameState()

  if (gameState.status === 'upload') {
    return <UploadScreen onStartGame={startGame} />
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

  return <EndScreen rounds={gameState.rounds} onPlayAgain={resetGame} />
}
