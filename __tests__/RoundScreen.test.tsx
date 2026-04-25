import { render, screen, act, fireEvent } from '@testing-library/react'
import RoundScreen from '../components/RoundScreen'
import type { Round } from '../lib/types'

jest.mock('../components/MapViewDynamic', () => {
  return function MockMapView({ onPinDrop }: { onPinDrop?: (lat: number, lng: number) => void }) {
    return (
      <div data-testid="map">
        <button onClick={() => onPinDrop?.(40.7, -74.0)}>Drop Pin</button>
      </div>
    )
  }
})

jest.mock('../components/PhotoPiP', () => {
  return function MockPhotoPiP() {
    return <div data-testid="photo-pip" />
  }
})

const makeRound = (): Round => ({
  id: 'round-1',
  photo: {
    id: 'photo-1',
    file: new File([''], 'photo.jpg'),
    previewUrl: 'blob:test',
    lat: 48.8566,
    lng: 2.3522,
    hasLocation: true,
  },
  guessedLat: null,
  guessedLng: null,
  distanceMiles: null,
  score: null,
  completed: false,
})

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('RoundScreen timer', () => {
  it('calls onTimeout when timer expires with no pin', () => {
    const onTimeout = jest.fn()
    const onSubmitGuess = jest.fn()

    render(
      <RoundScreen
        round={makeRound()}
        roundNumber={1}
        totalRounds={3}
        onSubmitGuess={onSubmitGuess}
        onTimeout={onTimeout}
      />,
    )

    act(() => { jest.advanceTimersByTime(30000) })

    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(onSubmitGuess).not.toHaveBeenCalled()
  })

  it('calls onSubmitGuess with pin coords when timer expires after a pin was dropped', async () => {
    const onTimeout = jest.fn()
    const onSubmitGuess = jest.fn()

    render(
      <RoundScreen
        round={makeRound()}
        roundNumber={1}
        totalRounds={3}
        onSubmitGuess={onSubmitGuess}
        onTimeout={onTimeout}
      />,
    )

    fireEvent.click(screen.getByText('Drop Pin'))

    act(() => { jest.advanceTimersByTime(30000) })

    expect(onSubmitGuess).toHaveBeenCalledWith(40.7, -74.0)
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
