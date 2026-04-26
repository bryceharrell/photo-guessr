import { renderHook, act } from '@testing-library/react'
import { useGameState } from '../hooks/useGameState'
import type { Photo, Round } from '../lib/types'

const makeChallengeRound = (overrides: Partial<Round> = {}): Round => ({
  id: crypto.randomUUID(),
  photo: {
    id: crypto.randomUUID(),
    previewUrl: 'https://example.com/photo.jpg',
    lat: 40.7128,
    lng: -74.006,
    hasLocation: true,
  },
  guessedLat: null,
  guessedLng: null,
  distanceMiles: null,
  score: null,
  completed: false,
  ...overrides,
})

const makePhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: crypto.randomUUID(),
  file: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
  previewUrl: 'blob:test',
  lat: 40.7128,
  lng: -74.006,
  hasLocation: true,
  ...overrides,
})

describe('useGameState', () => {
  it('starts in upload status', () => {
    const { result } = renderHook(() => useGameState())
    expect(result.current.gameState.status).toBe('upload')
  })

  it('transitions to playing after startGame', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    expect(result.current.gameState.status).toBe('playing')
  })

  it('caps rounds at 5 with more than 5 valid photos', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame(Array.from({ length: 8 }, () => makePhoto())) })
    expect(result.current.gameState.rounds.length).toBe(5)
  })

  it('excludes photos without GPS from rounds', () => {
    const { result } = renderHook(() => useGameState())
    act(() => {
      result.current.startGame([
        makePhoto(),
        makePhoto({ hasLocation: false, lat: null, lng: null }),
        makePhoto(),
      ])
    })
    expect(result.current.gameState.rounds.length).toBe(2)
  })

  it('transitions to round_result after submitGuess', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.submitGuess(40.7, -74.0) })
    expect(result.current.gameState.status).toBe('round_result')
  })

  it('records score and distance on submitGuess', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.submitGuess(40.7128, -74.006) })
    const round = result.current.gameState.rounds[0]
    expect(round.score).toBeGreaterThan(4990)
    expect(round.distanceMiles).toBeCloseTo(0, 0)
    expect(round.completed).toBe(true)
  })

  it('advances to next round on nextRound()', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto(), makePhoto()]) })
    act(() => { result.current.submitGuess(40.7, -74.0) })
    act(() => { result.current.nextRound() })
    expect(result.current.gameState.status).toBe('playing')
    expect(result.current.gameState.currentRoundIndex).toBe(1)
  })

  it('transitions to finished after the last round', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.submitGuess(40.7, -74.0) })
    act(() => { result.current.nextRound() })
    expect(result.current.gameState.status).toBe('finished')
  })

  it('resets to upload with empty rounds on resetGame()', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.resetGame() })
    expect(result.current.gameState.status).toBe('upload')
    expect(result.current.gameState.rounds.length).toBe(0)
    expect(result.current.gameState.currentRoundIndex).toBe(0)
  })

  it('timeoutRound transitions to round_result', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.timeoutRound() })
    expect(result.current.gameState.status).toBe('round_result')
  })

  it('timeoutRound sets score to 0 and leaves guess coords null', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.timeoutRound() })
    const round = result.current.gameState.rounds[0]
    expect(round.score).toBe(0)
    expect(round.guessedLat).toBeNull()
    expect(round.guessedLng).toBeNull()
    expect(round.completed).toBe(true)
  })

  it('timeoutRound sets distanceMiles to null when no pin was dropped', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startGame([makePhoto()]) })
    act(() => { result.current.timeoutRound() })
    const round = result.current.gameState.rounds[0]
    expect(round.distanceMiles).toBeNull()
  })

  it('startChallenge transitions directly to playing', () => {
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startChallenge([makeChallengeRound()]) })
    expect(result.current.gameState.status).toBe('playing')
  })

  it('startChallenge sets the provided rounds verbatim', () => {
    const rounds = [makeChallengeRound(), makeChallengeRound()]
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startChallenge(rounds) })
    expect(result.current.gameState.rounds).toEqual(rounds)
    expect(result.current.gameState.currentRoundIndex).toBe(0)
  })

  it('startChallenge does not shuffle or cap rounds', () => {
    const rounds = Array.from({ length: 5 }, () => makeChallengeRound())
    const ids = rounds.map(r => r.id)
    const { result } = renderHook(() => useGameState())
    act(() => { result.current.startChallenge(rounds) })
    expect(result.current.gameState.rounds.map(r => r.id)).toEqual(ids)
  })
})
