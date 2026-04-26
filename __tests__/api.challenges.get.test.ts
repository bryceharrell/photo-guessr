/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(),
}))

import { createServerClient } from '@/lib/supabase-server'
import { GET } from '@/app/api/challenges/[id]/route'

const DB_ROUNDS = [
  { id: 'round-1', order: 0, storage_path: 'chal-1/round-1.jpg', lat: 40.7128, lng: -74.006 },
  { id: 'round-2', order: 1, storage_path: 'chal-1/round-2.jpg', lat: 51.5074, lng: -0.1278 },
]

function buildMockClient(rounds = DB_ROUNDS, signedUrlBase = 'https://signed.example.com/') {
  const mockOrder = jest.fn().mockResolvedValue({ data: rounds, error: null })
  const mockEq = jest.fn(() => ({ order: mockOrder }))
  const mockSelect = jest.fn(() => ({ eq: mockEq }))

  const mockCreateSignedUrl = jest.fn((path: string) =>
    Promise.resolve({ data: { signedUrl: `${signedUrlBase}${path}` }, error: null })
  )

  return {
    from: jest.fn(() => ({ select: mockSelect })),
    storage: { from: jest.fn(() => ({ createSignedUrl: mockCreateSignedUrl })) },
  }
}

describe('GET /api/challenges/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns rounds with signed photo URLs', async () => {
    ;(createServerClient as jest.Mock).mockReturnValue(buildMockClient())
    const req = new NextRequest('http://localhost/api/challenges/chal-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'chal-1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.rounds).toHaveLength(2)
    expect(data.rounds[0].photoUrl).toBe('https://signed.example.com/chal-1/round-1.jpg')
    expect(data.rounds[0].lat).toBe(40.7128)
    expect(data.rounds[1].photoUrl).toBe('https://signed.example.com/chal-1/round-2.jpg')
  })

  it('returns 404 if challenge not found', async () => {
    const client = buildMockClient()
    client.from = jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn().mockResolvedValue({ data: null, error: new Error('not found') }),
        })),
      })),
    }))
    ;(createServerClient as jest.Mock).mockReturnValue(client)

    const req = new NextRequest('http://localhost/api/challenges/missing')
    const res = await GET(req, { params: Promise.resolve({ id: 'missing' }) })

    expect(res.status).toBe(404)
  })
})
