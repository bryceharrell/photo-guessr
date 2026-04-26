# Social Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a social challenge mode where a creator uploads photos, gets a shareable link, and friends can play the game with those photos and share their score back via the native share sheet.

**Architecture:** The existing solo play flow is untouched. A mode toggle on the upload screen enables challenge mode, which POSTs photos to Supabase via two new API routes. Friends access challenges at `/challenge/[id]`, which fetches rounds (with 1-hour signed photo URLs) and runs the same game components. Scores are ephemeral — only shared manually via `navigator.share()`.

**Tech Stack:** Next.js 16.2.4 App Router, `@supabase/supabase-js` v2, Jest + React Testing Library

---

## File Map

**New files:**
- `lib/supabase-server.ts` — Supabase client (service role key, server-only)
- `app/api/challenges/route.ts` — `POST`: create challenge + upload photos
- `app/api/challenges/[id]/route.ts` — `GET`: fetch rounds with signed URLs
- `app/challenge/[id]/page.tsx` — player game page (client component)
- `app/challenge/[id]/created/page.tsx` — creator confirmation page (server component)
- `components/ChallengeIntroScreen.tsx` — "A friend challenged you" intro + Start button
- `components/ChallengeEndScreen.tsx` — end screen with Share Your Score instead of Play Again
- `__tests__/ChallengeIntroScreen.test.tsx`
- `__tests__/ChallengeEndScreen.test.tsx`
- `__tests__/api.challenges.post.test.ts`
- `__tests__/api.challenges.get.test.ts`

**Modified files:**
- `lib/types.ts` — make `Photo.file` optional (`file?: File`)
- `hooks/useGameState.ts` — add `startChallenge(rounds: Round[])`
- `components/UploadScreen.tsx` — add mode toggle + challenge creation flow
- `__tests__/useGameState.test.ts` — add `startChallenge` tests

---

## Task 1: Install Supabase and configure environment

**Files:**
- Modify: `package.json` (via npm)
- Create: `.env.local` (add entries)

- [ ] **Step 1: Install the Supabase JS client**

```bash
npm install @supabase/supabase-js
```

Expected output: `added X packages`

- [ ] **Step 2: Add environment variable placeholders to `.env.local`**

Append to `.env.local` (create it if it doesn't exist):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

These values come from your Supabase project dashboard → Settings → API.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @supabase/supabase-js"
```

---

## Task 2: Supabase project setup (manual)

**No code changes — manual steps in the Supabase dashboard.**

- [ ] **Step 1: Create the database tables**

In your Supabase project, open the SQL Editor and run:

```sql
create table challenges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges(id) on delete cascade,
  "order" int not null,
  storage_path text not null,
  lat float not null,
  lng float not null
);
```

- [ ] **Step 2: Create the storage bucket**

In your Supabase project, go to Storage → New bucket.
- Name: `challenge-photos`
- Public: **off** (private bucket)

- [ ] **Step 3: Fill in `.env.local`**

Replace the placeholder values in `.env.local` with your real credentials from the Supabase dashboard (Settings → API).

---

## Task 3: Make `Photo.file` optional

**Files:**
- Modify: `lib/types.ts`
- Modify: `components/UploadScreen.tsx:79`

Challenge photos come from URLs, not `File` objects. Making `file` optional lets both solo and challenge photos use the same `Photo` type.

- [ ] **Step 1: Update `lib/types.ts`**

```ts
export type Photo = {
  id: string
  file?: File
  previewUrl: string
  lat: number | null
  lng: number | null
  hasLocation: boolean
}
```

- [ ] **Step 2: Fix the filename display in `UploadScreen.tsx`**

`UploadScreen.tsx` line 79 references `photo.file.name` directly. Update it to handle the now-optional field:

Change:
```tsx
<span className="flex-1 text-sm text-zinc-300 truncate">{photo.file.name}</span>
```

To:
```tsx
<span className="flex-1 text-sm text-zinc-300 truncate">{photo.file?.name ?? 'Photo'}</span>
```

- [ ] **Step 3: Run the existing tests to confirm nothing broke**

```bash
npx jest
```

Expected: all tests pass (no new failures — this change is backward-compatible since `makePhoto` in the test helper still provides `file`).

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts components/UploadScreen.tsx
git commit -m "feat: make Photo.file optional to support challenge photos"
```

---

## Task 4: Add `startChallenge` to `useGameState`

**Files:**
- Modify: `hooks/useGameState.ts`
- Modify: `__tests__/useGameState.test.ts`

`startChallenge` accepts pre-built `Round[]` (already resolved from the API, with `photo.previewUrl` set to a signed URL) and jumps directly to `'playing'` status, bypassing the upload step.

- [ ] **Step 1: Write the failing tests**

Add to `__tests__/useGameState.test.ts`, after the existing imports:

```ts
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
```

Add the following tests after the existing `describe('useGameState', ...)` block tests:

```ts
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
```

You'll also need to add `Round` to the import at the top of the test file:

```ts
import type { Photo, Round } from '../lib/types'
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/useGameState.test.ts
```

Expected: 3 new tests fail with `result.current.startChallenge is not a function`

- [ ] **Step 3: Implement `startChallenge` in `hooks/useGameState.ts`**

Add after the `startGame` function:

```ts
  function startChallenge(rounds: Round[]) {
    setGameState({ status: 'playing', rounds, currentRoundIndex: 0 })
  }
```

Add `startChallenge` to the return object:

```ts
  return { gameState, startGame, startChallenge, submitGuess, nextRound, timeoutRound, resetGame }
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/useGameState.test.ts
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add hooks/useGameState.ts __tests__/useGameState.test.ts
git commit -m "feat: add startChallenge action to useGameState"
```

---

## Task 5: Create Supabase server client

**Files:**
- Create: `lib/supabase-server.ts`

A thin wrapper that creates a Supabase client using the service role key. Used only in API route handlers (server-side).

- [ ] **Step 1: Create `lib/supabase-server.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/supabase-server.ts
git commit -m "feat: add Supabase server client"
```

---

## Task 6: `POST /api/challenges` route

**Files:**
- Create: `app/api/challenges/route.ts`
- Create: `__tests__/api.challenges.post.test.ts`

Accepts multipart form data (photo files + GPS coords), creates a challenge record, uploads photos to Supabase Storage, inserts round records, returns `{ id }`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/api.challenges.post.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/api.challenges.post.test.ts
```

Expected: fails — `Cannot find module '@/app/api/challenges/route'`

- [ ] **Step 3: Implement `app/api/challenges/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const photos = formData.getAll('photos[]') as File[]
  const lats = (formData.getAll('lats[]') as string[]).map(Number)
  const lngs = (formData.getAll('lngs[]') as string[]).map(Number)

  const supabase = createServerClient()

  const { data: challenge, error: challengeError } = await supabase
    .from('challenges')
    .insert({})
    .select('id')
    .single()

  if (challengeError || !challenge) {
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }

  const roundInserts: {
    id: string
    challenge_id: string
    order: number
    storage_path: string
    lat: number
    lng: number
  }[] = []

  for (let i = 0; i < photos.length; i++) {
    const roundId = crypto.randomUUID()
    const storagePath = `${challenge.id}/${roundId}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('challenge-photos')
      .upload(storagePath, photos[i])

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    roundInserts.push({
      id: roundId,
      challenge_id: challenge.id,
      order: i,
      storage_path: storagePath,
      lat: lats[i],
      lng: lngs[i],
    })
  }

  const { error: roundsError } = await supabase.from('rounds').insert(roundInserts)

  if (roundsError) {
    return NextResponse.json({ error: 'Failed to create rounds' }, { status: 500 })
  }

  return NextResponse.json({ id: challenge.id })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/api.challenges.post.test.ts
```

Expected: all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add app/api/challenges/route.ts __tests__/api.challenges.post.test.ts
git commit -m "feat: add POST /api/challenges route"
```

---

## Task 7: `GET /api/challenges/[id]` route

**Files:**
- Create: `app/api/challenges/[id]/route.ts`
- Create: `__tests__/api.challenges.get.test.ts`

Fetches all rounds for a challenge, generates a signed URL for each photo, and returns the hydrated round list.

- [ ] **Step 1: Write the failing test**

Create `__tests__/api.challenges.get.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/api.challenges.get.test.ts
```

Expected: fails — `Cannot find module '@/app/api/challenges/[id]/route'`

- [ ] **Step 3: Implement `app/api/challenges/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('id, order, storage_path, lat, lng')
    .eq('challenge_id', id)
    .order('order')

  if (error || !rounds) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const roundsWithUrls = await Promise.all(
    rounds.map(async (round: { id: string; order: number; storage_path: string; lat: number; lng: number }) => {
      const { data } = await supabase.storage
        .from('challenge-photos')
        .createSignedUrl(round.storage_path, 3600)

      return {
        id: round.id,
        order: round.order,
        photoUrl: data?.signedUrl ?? '',
        lat: round.lat,
        lng: round.lng,
      }
    })
  )

  return NextResponse.json({ rounds: roundsWithUrls })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/api.challenges.get.test.ts
```

Expected: both tests pass

- [ ] **Step 5: Commit**

```bash
git add "app/api/challenges/[id]/route.ts" __tests__/api.challenges.get.test.ts
git commit -m "feat: add GET /api/challenges/[id] route"
```

---

## Task 8: `ChallengeIntroScreen` component

**Files:**
- Create: `components/ChallengeIntroScreen.tsx`
- Create: `__tests__/ChallengeIntroScreen.test.tsx`

Full-screen intro shown to the player before the first round.

- [ ] **Step 1: Write the failing test**

Create `__tests__/ChallengeIntroScreen.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/ChallengeIntroScreen.test.tsx
```

Expected: fails — `Cannot find module '../components/ChallengeIntroScreen'`

- [ ] **Step 3: Implement `components/ChallengeIntroScreen.tsx`**

```tsx
'use client'

type Props = {
  onStart: () => void
}

export default function ChallengeIntroScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">PhotoGuessr</h1>
        <p className="text-xl text-zinc-200 mb-2">A friend challenged you</p>
        <p className="text-zinc-400 mb-10">Guess where these photos were taken</p>
        <button
          onClick={onStart}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Start
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/ChallengeIntroScreen.test.tsx
```

Expected: all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ChallengeIntroScreen.tsx __tests__/ChallengeIntroScreen.test.tsx
git commit -m "feat: add ChallengeIntroScreen component"
```

---

## Task 9: `ChallengeEndScreen` component

**Files:**
- Create: `components/ChallengeEndScreen.tsx`
- Create: `__tests__/ChallengeEndScreen.test.tsx`

End screen for challenge play. Shows the same score summary as `EndScreen` but replaces "Play Again" with a "Share Your Score" button that calls `navigator.share()`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/ChallengeEndScreen.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/ChallengeEndScreen.test.tsx
```

Expected: fails — `Cannot find module '../components/ChallengeEndScreen'`

- [ ] **Step 3: Implement `components/ChallengeEndScreen.tsx`**

```tsx
'use client'

import type { Round } from '@/lib/types'

type Props = {
  rounds: Round[]
  challengeId: string
}

export default function ChallengeEndScreen({ rounds, challengeId }: Props) {
  const totalScore = rounds.reduce((sum, r) => sum + (r.score ?? 0), 0)
  const maxScore = rounds.length * 5000

  async function handleShare() {
    const challengeUrl = `${window.location.origin}/challenge/${challengeId}`
    await navigator.share({
      text: `I scored ${totalScore.toLocaleString()} / ${maxScore.toLocaleString()} on this PhotoGuessr challenge!`,
      url: challengeUrl,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-1">Game Over</h2>
          <p className="text-zinc-400 text-sm">Total Score</p>
          <p className="text-6xl font-bold mt-1">{totalScore.toLocaleString()}</p>
          <p className="text-zinc-500 text-sm mt-1">out of {maxScore.toLocaleString()}</p>
        </div>

        <ul className="space-y-3 mb-8">
          {rounds.map((round, i) => (
            <li key={round.id} className="flex items-center gap-4 bg-zinc-900 rounded-xl px-4 py-3">
              <img
                src={round.photo.previewUrl}
                alt=""
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-400">Round {i + 1}</p>
                <p className="text-sm text-zinc-300">{round.distanceMiles?.toFixed(1)} miles off</p>
              </div>
              <p className="text-white font-semibold tabular-nums">{round.score?.toLocaleString()}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={handleShare}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Share Your Score
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/ChallengeEndScreen.test.tsx
```

Expected: all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/ChallengeEndScreen.tsx __tests__/ChallengeEndScreen.test.tsx
git commit -m "feat: add ChallengeEndScreen with share button"
```

---

## Task 10: Update `UploadScreen` with mode toggle and challenge creation

**Files:**
- Modify: `components/UploadScreen.tsx`
- Modify: `__tests__/useGameState.test.ts` (no changes needed — existing tests still pass)

Add a "Solo / Challenge" toggle at the top. In challenge mode, the CTA becomes "Create Challenge" and submitting calls `POST /api/challenges`, then redirects to `/challenge/[id]/created`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/UploadScreen.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UploadScreen from '../components/UploadScreen'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeImageFile(name = 'photo.jpg') {
  return new File(['data'], name, { type: 'image/jpeg' })
}

jest.mock('../lib/exif', () => ({
  parseGps: jest.fn().mockResolvedValue({ lat: 40.7128, lng: -74.006 }),
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
    const input = screen.getByRole('button', { name: /solo/i }).closest('div')
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

  it('calls POST /api/challenges and redirects on challenge creation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-challenge-id' }),
    })

    render(<UploadScreen onStartGame={jest.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^challenge$/i }))
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(fileInput, makeImageFile())

    await waitFor(() => screen.getByRole('button', { name: /create challenge/i }))
    await userEvent.click(screen.getByRole('button', { name: /create challenge/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/challenges', expect.objectContaining({ method: 'POST' }))
      expect(mockPush).toHaveBeenCalledWith('/challenge/new-challenge-id/created')
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/UploadScreen.test.tsx
```

Expected: tests for mode toggle fail (toggle buttons don't exist yet)

- [ ] **Step 3: Implement the updated `components/UploadScreen.tsx`**

Replace the full file content:

```tsx
'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Photo } from '@/lib/types'
import { parseGps } from '@/lib/exif'

type Props = {
  onStartGame: (photos: Photo[]) => void
}

export default function UploadScreen({ onStartGame }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<'solo' | 'challenge'>('solo')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newPhotos: Photo[] = []
    for (const file of Array.from(files)) {
      const previewUrl = URL.createObjectURL(file)
      const gps = await parseGps(file)
      newPhotos.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
        hasLocation: gps !== null,
      })
    }

    setPhotos((prev) => {
      const merged: Photo[] = [...prev]
      for (const photo of newPhotos) {
        const validCount = merged.filter((p) => p.hasLocation).length
        if (photo.hasLocation && validCount >= 5) continue
        merged.push(photo)
      }
      return merged
    })
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
  }

  async function handleCreateChallenge() {
    const validPhotos = photos.filter((p) => p.hasLocation).slice(0, 5)
    const formData = new FormData()
    validPhotos.forEach((photo) => {
      formData.append('photos[]', photo.file!)
      formData.append('lats[]', String(photo.lat))
      formData.append('lngs[]', String(photo.lng))
    })

    setIsCreating(true)
    try {
      const res = await fetch('/api/challenges', { method: 'POST', body: formData })
      const data = await res.json()
      router.push(`/challenge/${data.id}/created`)
    } finally {
      setIsCreating(false)
    }
  }

  const validCount = photos.filter((p) => p.hasLocation).length

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">PhotoGuessr</h1>
          <p className="text-zinc-400">Upload photos and guess where they were taken.</p>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-zinc-700 mb-6">
          <button
            onClick={() => setMode('solo')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'solo' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => setMode('challenge')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'challenge' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Challenge
          </button>
        </div>

        {mode === 'challenge' && (
          <p className="text-zinc-500 text-xs text-center mb-4">
            Photos you upload may be seen by anyone with the challenge link.
          </p>
        )}

        <label
          className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-white bg-zinc-800' : 'border-zinc-600 hover:border-zinc-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
        >
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          <p className="text-zinc-300 text-sm">Drop photos here or click to browse</p>
          <p className="text-zinc-500 text-xs mt-1">Photos with GPS data will be used for the game</p>
        </label>

        {photos.length > 0 && (
          <ul className="mt-4 space-y-2">
            {photos.map((photo) => (
              <li key={photo.id} className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3">
                <img src={photo.previewUrl} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                <span className="flex-1 text-sm text-zinc-300 truncate">{photo.file?.name ?? 'Photo'}</span>
                {photo.hasLocation ? (
                  <span className="text-green-400 text-xs flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Location found
                  </span>
                ) : (
                  <span className="text-zinc-500 text-xs">No location data</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {validCount > 0 && mode === 'solo' && (
          <button
            onClick={() => onStartGame(photos)}
            className="mt-6 w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Start Game ({validCount} {validCount === 1 ? 'photo' : 'photos'})
          </button>
        )}

        {validCount > 0 && mode === 'challenge' && (
          <button
            onClick={handleCreateChallenge}
            disabled={isCreating}
            className="mt-6 w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isCreating
              ? 'Creating...'
              : `Create Challenge (${validCount} ${validCount === 1 ? 'photo' : 'photos'})`}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run all tests**

```bash
npx jest
```

Expected: all tests pass, including existing `useGameState` and `RoundScreen` tests

- [ ] **Step 5: Commit**

```bash
git add components/UploadScreen.tsx __tests__/UploadScreen.test.tsx
git commit -m "feat: add solo/challenge mode toggle to UploadScreen"
```

---

## Task 11: Challenge player page

**Files:**
- Create: `app/challenge/[id]/page.tsx`

Client component that fetches challenge rounds, shows the intro screen, then runs the same status-driven game loop as `app/page.tsx`, with `ChallengeEndScreen` at the end.

No unit test — this component wires everything together and is best verified manually.

- [ ] **Step 1: Create `app/challenge/[id]/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Run the full test suite to confirm no regressions**

```bash
npx jest
```

Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add "app/challenge/[id]/page.tsx"
git commit -m "feat: add challenge player page"
```

---

## Task 12: Challenge created confirmation page

**Files:**
- Create: `app/challenge/[id]/created/page.tsx`
- Create: `components/ChallengeCreatedScreen.tsx`

Server component page that passes the challenge ID to the `ChallengeCreatedScreen` client component, which shows the Share button and "Play it myself" link.

- [ ] **Step 1: Create `components/ChallengeCreatedScreen.tsx`**

```tsx
'use client'

type Props = {
  challengeId: string
}

export default function ChallengeCreatedScreen({ challengeId }: Props) {
  const challengeUrl = `${window.location.origin}/challenge/${challengeId}`

  async function handleShare() {
    await navigator.share({
      text: "Can you guess where I've been? Play my PhotoGuessr challenge!",
      url: challengeUrl,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-3xl font-bold mb-2">Challenge created!</h2>
        <p className="text-zinc-400 mb-8">
          Share the link with friends to see if they can guess where you&apos;ve been.
        </p>
        <button
          onClick={handleShare}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors mb-3"
        >
          Share Challenge
        </button>
        <a
          href={`/challenge/${challengeId}`}
          className="block w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Play it myself
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/challenge/[id]/created/page.tsx`**

```tsx
import ChallengeCreatedScreen from '@/components/ChallengeCreatedScreen'

export default async function ChallengeCreatedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChallengeCreatedScreen challengeId={id} />
}
```

- [ ] **Step 3: Run the full test suite**

```bash
npx jest
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add "app/challenge/[id]/created/page.tsx" components/ChallengeCreatedScreen.tsx
git commit -m "feat: add challenge created confirmation page"
```

---

## Manual End-to-End Verification

After all tasks are complete, verify the full flow manually:

**Creator flow:**
1. `npm run dev`, open `http://localhost:3000`
2. Click "Challenge" toggle — confirm disclaimer text appears
3. Upload 2–3 photos with GPS data
4. Click "Create Challenge" — confirm loading state appears
5. Confirm redirect to `/challenge/[id]/created`
6. Click "Share Challenge" — confirm native share sheet opens with the correct URL
7. Click "Play it myself" — confirm redirect to `/challenge/[id]`

**Player flow:**
1. Open the challenge URL directly (simulate receiving the link)
2. Confirm loading state, then intro screen: "A friend challenged you"
3. Click "Start" — confirm first round loads with the creator's photo
4. Play through all rounds
5. On end screen, confirm "Share Your Score" button (not "Play Again")
6. Click "Share Your Score" — confirm native share sheet opens with score + challenge URL
