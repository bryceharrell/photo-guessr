/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(),
}))

import { createServerClient } from '@/lib/supabase-server'
import { POST } from '@/app/api/challenges/route'

function buildMockClient(challengeId = 'challenge-abc') {
  const mockSingle = jest.fn().mockResolvedValue({ data: { id: challengeId }, error: null })
  const mockSelectChallenge = jest.fn(() => ({ single: mockSingle }))
  const mockInsertChallenge = jest.fn(() => ({ select: mockSelectChallenge }))
  const mockInsertRounds = jest.fn().mockResolvedValue({ error: null })
  const mockUpload = jest.fn().mockResolvedValue({ error: null })

  return {
    from: jest.fn((table: string) => {
      if (table === 'challenges') return { insert: mockInsertChallenge }
      if (table === 'rounds') return { insert: mockInsertRounds }
    }),
    storage: { from: jest.fn(() => ({ upload: mockUpload })) },
    _mocks: { mockInsertRounds, mockUpload },
  }
}

function buildRequest(photos: File[], lats: number[], lngs: number[]) {
  const formData = new FormData()
  photos.forEach(f => formData.append('photos[]', f))
  lats.forEach(l => formData.append('lats[]', String(l)))
  lngs.forEach(l => formData.append('lngs[]', String(l)))
  return new NextRequest('http://localhost/api/challenges', { method: 'POST', body: formData })
}

describe('POST /api/challenges', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the new challenge id on success', async () => {
    const client = buildMockClient('challenge-abc')
    ;(createServerClient as jest.Mock).mockReturnValue(client)

    const req = buildRequest(
      [new File([''], 'a.jpg', { type: 'image/jpeg' })],
      [40.7128],
      [-74.006]
    )
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.id).toBe('challenge-abc')
  })

  it('inserts one round per photo', async () => {
    const client = buildMockClient()
    ;(createServerClient as jest.Mock).mockReturnValue(client)

    const req = buildRequest(
      [
        new File([''], 'a.jpg', { type: 'image/jpeg' }),
        new File([''], 'b.jpg', { type: 'image/jpeg' }),
      ],
      [40.7128, 51.5074],
      [-74.006, -0.1278]
    )
    await POST(req)

    const insertedRounds = client._mocks.mockInsertRounds.mock.calls[0][0]
    expect(insertedRounds).toHaveLength(2)
    expect(insertedRounds[0].lat).toBe(40.7128)
    expect(insertedRounds[1].lat).toBe(51.5074)
  })

  it('returns 500 if challenge creation fails', async () => {
    const client = buildMockClient()
    client.from = jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') }),
        })),
      })),
    }))
    ;(createServerClient as jest.Mock).mockReturnValue(client)

    const req = buildRequest(
      [new File([''], 'a.jpg', { type: 'image/jpeg' })],
      [40.7128],
      [-74.006]
    )
    const res = await POST(req)

    expect(res.status).toBe(500)
  })
})
