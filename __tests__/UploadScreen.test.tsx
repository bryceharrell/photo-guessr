import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadScreen from '../components/UploadScreen'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')

function makeImageFile(name = 'photo.jpg') {
  return new File(['data'], name, { type: 'image/jpeg' })
}

jest.mock('../lib/exif', () => ({
  parseGps: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.006 }),
}))

jest.mock('../lib/compress', () => ({
  compressImage: jest.fn((file: File) => Promise.resolve(file)),
}))

describe('UploadScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows Solo and Challenge mode options', () => {
    render(<UploadScreen onStartGame={jest.fn()} />)
    expect(screen.getByRole('button', { name: /solo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /challenge/i })).toBeInTheDocument()
  })

  it('shows "Start Game" button in solo mode', async () => {
    render(<UploadScreen onStartGame={jest.fn()} />)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, makeImageFile())
    await waitFor(() => expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument())
  })

  it('shows "Create Challenge" button in challenge mode', async () => {
    render(<UploadScreen onStartGame={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^challenge$/i }))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, makeImageFile())
    await waitFor(() => expect(screen.getByRole('button', { name: /create challenge/i })).toBeInTheDocument())
  })

  it('calls POST /api/challenges with JSON metadata then PUTs photos to signed URLs', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-challenge-id', uploads: [{ signedUrl: 'https://storage.example.com/upload/photo.jpg' }] }),
      })
      .mockResolvedValueOnce({ ok: true })

    render(<UploadScreen onStartGame={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^challenge$/i }))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, makeImageFile())

    await waitFor(() => screen.getByRole('button', { name: /create challenge/i }))
    await userEvent.click(screen.getByRole('button', { name: /create challenge/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/challenges', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }))
      expect(mockFetch).toHaveBeenCalledWith('https://storage.example.com/upload/photo.jpg', expect.objectContaining({ method: 'PUT' }))
      expect(mockPush).toHaveBeenCalledWith('/challenge/new-challenge-id/created')
    })
  })
})
