# Social Challenge — Design Spec

**Date:** 2026-04-26
**Status:** Approved

## Overview

Add a "Challenge" mode to PhotoGuessr that lets a creator upload photos, generate a shareable link, and send it to friends. Friends click the link, play the game with the creator's photos, and share their score back via the native share sheet. No auth, no stored scores — scores are ephemeral and shared manually.

## Architecture

The existing solo play flow is untouched. The social challenge feature adds:

- A mode toggle on the upload screen ("Solo" / "Challenge")
- Two new API routes for creating and fetching challenges
- Two new App Router pages: `/challenge/[id]` (player) and `/challenge/[id]/created` (creator confirmation)
- A `startChallenge(rounds)` action on `useGameState` that bypasses the upload step
- Supabase for database (challenges + rounds) and file storage (private bucket, signed URLs)

## Data Model

### Supabase Tables

**`challenges`**
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, `gen_random_uuid()` |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**`rounds`**
| column | type | notes |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, `gen_random_uuid()` |
| `challenge_id` | `uuid` | REFERENCES `challenges(id)` ON DELETE CASCADE |
| `order` | `int` | Round sequence (0-indexed) |
| `storage_path` | `text` | Path in Supabase Storage bucket |
| `lat` | `float` | Actual photo location |
| `lng` | `float` | Actual photo location |

No `scores` table. Scores live only in the player's browser session.

### Supabase Storage

- Private bucket: `challenge-photos`
- File path: `{challenge_id}/{round_id}.jpg`
- Signed URLs generated at request time, 1-hour expiry
- Expiry is a privacy measure only — images are downloaded to the browser on page load and cached for the session, so expiry has no gameplay impact

## API Routes

### `POST /api/challenges`

**Called by:** creator's browser after selecting photos in challenge mode.

**Request:** `multipart/form-data`
- `photos[]` — image files
- `lats[]` — GPS lat per photo (parallel array, same order)
- `lngs[]` — GPS lng per photo (parallel array, same order)

GPS coords are parsed client-side (same as solo mode) and sent as form fields.

**Server behavior:**
1. Insert a `challenges` row, capture `id`
2. For each photo (up to 5): generate a `round_id`, upload file to `{challenge_id}/{round_id}.jpg`, insert `rounds` row with `storage_path`, `lat`, `lng`, `order`
3. Return `{ id: string }`

**EXIF stripping:** deferred. Photos retain EXIF data in storage for the initial build. Strip server-side before any public launch.

### `GET /api/challenges/[id]`

**Called by:** player's browser when loading the challenge page.

**Server behavior:**
1. Fetch all `rounds` for the challenge ordered by `order`
2. Generate a signed URL (1-hour expiry) for each `storage_path`
3. Return `{ rounds: Array<{ id, order, photoUrl, lat, lng }> }`

## New Pages

### `/challenge/[id]/created` — Creator Confirmation

Shown after a challenge is successfully created. Contains:
- A brief confirmation message ("Challenge created!")
- **Share** button — calls `navigator.share()` with:
  - `text`: "Can you guess where I've been? Play my PhotoGuessr challenge!"
  - `url`: `https://<host>/challenge/[id]`
- **Play it myself** button — navigates to `/challenge/[id]`

### `/challenge/[id]` — Player Game Page

On load:
1. Fetch challenge rounds from `GET /api/challenges/[id]`
2. Build `Round[]` from API response (photo URLs become `previewUrl`, no `file` object)
3. Call `startChallenge(rounds)` on the game hook

**Intro screen** shown before the first round:
- "A friend challenged you — guess where these photos were taken"
- "Start" button transitions to `playing`

**Game screens** (`RoundScreen`, `RoundResultScreen`) are reused as-is.

**End screen** modifications:
- "Play Again" replaced with **"Share Your Score"**
- Share calls `navigator.share({ text: "I scored X / 25,000 on this PhotoGuessr challenge!", url: "<challenge url>" })`
- Score in the message is the player's total score

## Code Changes

### `lib/types.ts`

`Photo.file` becomes optional:
```ts
type Photo = {
  id: string
  file?: File           // undefined for challenge photos
  previewUrl: string
  lat: number | null
  lng: number | null
  hasLocation: boolean
}
```

### `hooks/useGameState.ts`

Add `startChallenge(rounds: Round[])`:
- Accepts pre-built `Round[]` (with `photo.previewUrl` already set to signed URL)
- Sets `status` directly to `'playing'`
- Bypasses the upload/EXIF parse step entirely
- No new status values needed — the intro screen is handled at the page level before `startChallenge` is called

### `components/UploadScreen.tsx`

- Add mode toggle: "Solo" | "Challenge" (tab or segmented control at the top)
- In challenge mode: CTA changes to "Create Challenge", shows loading state while API call is in flight, on success redirects to `/challenge/[id]/created`
- In solo mode: behavior unchanged

### `app/challenge/[id]/page.tsx` (new)

A client component that owns the full challenge game lifecycle:
1. Fetches rounds from `GET /api/challenges/[id]` on mount
2. Shows a loading state while fetching
3. Shows `ChallengeIntroScreen` until the user hits "Start"
4. Calls `startChallenge(rounds)` on "Start" → status becomes `'playing'`
5. Renders the same status-driven screen router as `app/page.tsx` (`RoundScreen`, `RoundResultScreen`) but with a modified end screen (share button instead of play again)

`app/page.tsx` (the solo play route) is not changed.

## New Components

```
components/
  ChallengeIntroScreen.tsx   — "A friend challenged you" intro + Start button
  ChallengeCreatedScreen.tsx — confirmation screen with Share + Play buttons
                               (rendered at /challenge/[id]/created)
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-side only, for storage uploads
```

## Out of Scope (Deferred)

- EXIF stripping before storage upload
- Challenge expiry / TTL
- Creator identity / naming
- Score leaderboard / aggregated results across players
- Auth of any kind
