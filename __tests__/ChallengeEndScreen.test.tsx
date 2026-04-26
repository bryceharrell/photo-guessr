import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChallengeEndScreen from '../components/ChallengeEndScreen'
import type { Round } from '../lib/types'

const makeCompletedRound = (score: number): Round => ({
  id: crypto.randomUUID(),
  photo: {
    id: crypto.randomUUID(),
    previewUrl: 'https://example.com/photo.jpg',
    lat: 40.7128,
    lng: -74.006,
    hasLocation: true,
  },
  guessedLat: 40.7,
  guessedLng: -74.0,
  distanceMiles: 2.5,
  score,
  completed: true,
})

describe('ChallengeEndScreen', () => {
  beforeEach(() => {
    Object.assign(navigator, { share: jest.fn().mockResolvedValue(undefined) })
  })

  it('shows total score', () => {
    const rounds = [makeCompletedRound(3000), makeCompletedRound(4000)]
    render(<ChallengeEndScreen rounds={rounds} challengeId="chal-123" />)
    expect(screen.getByText('7,000')).toBeInTheDocument()
  })

  it('shows Share Your Score button (not Play Again)', () => {
    render(<ChallengeEndScreen rounds={[makeCompletedRound(3000)]} challengeId="chal-123" />)
    expect(screen.getByRole('button', { name: /share your score/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /play again/i })).not.toBeInTheDocument()
  })

  it('calls navigator.share with score and challenge url on button click', async () => {
    const rounds = [makeCompletedRound(3000)]
    render(<ChallengeEndScreen rounds={rounds} challengeId="chal-123" />)
    await userEvent.click(screen.getByRole('button', { name: /share your score/i }))
    expect(navigator.share).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('3,000'),
        url: expect.stringContaining('chal-123'),
      })
    )
  })
})
