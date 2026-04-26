import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChallengeIntroScreen from '../components/ChallengeIntroScreen'

describe('ChallengeIntroScreen', () => {
  it('shows the challenge intro message', () => {
    render(<ChallengeIntroScreen onStart={jest.fn()} />)
    expect(screen.getByText(/a friend challenged you/i)).toBeInTheDocument()
    expect(screen.getByText(/guess where these photos were taken/i)).toBeInTheDocument()
  })

  it('renders a Start button', () => {
    render(<ChallengeIntroScreen onStart={jest.fn()} />)
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })

  it('calls onStart when Start is clicked', async () => {
    const onStart = jest.fn()
    render(<ChallengeIntroScreen onStart={onStart} />)
    await userEvent.click(screen.getByRole('button', { name: /start/i }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
