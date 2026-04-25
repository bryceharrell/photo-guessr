# Pinpoint — Design Spec

**Date:** 2026-04-25
**Status:** Approved

## Overview

Pinpoint is a GeoGuessr-style browser game where users upload photos from their camera roll and guess where each photo was taken by dropping a pin on a map. GPS coordinates are parsed from EXIF data client-side. No backend, no auth, no database.

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS (no component libraries)
- `exifr` for client-side EXIF GPS parsing
- `react-map-gl` + Mapbox GL JS for the interactive map
- Fully client-side

## Core Game Flow

1. **Upload** — user selects photos, app parses EXIF GPS immediately, shows status per photo
2. **Round** — full-screen map with PiP photo card; user drops a pin and submits
3. **Round Result** — map shows guess, actual location, and line between them; score displayed
4. **End** — total score, per-round summary, Play Again

## Architecture

Single-page app. `app/page.tsx` reads `gameState.status` and renders the active screen component. No routing between game phases — the game is intentionally linear with no back-navigation.

All state lives in `hooks/useGameState.ts`. The hook owns state and exposes action functions. Components are stateless consumers that receive state slices and action callbacks as props. This design makes it straightforward to connect to a backend later.

### Phase navigation

`status` is a string enum: `'upload' | 'playing' | 'round_result' | 'finished'`

Transitions:
- `upload` → `playing` via `startGame(photos)`
- `playing` → `round_result` via `submitGuess(lat, lng)`
- `round_result` → `playing` via `nextRound()` (if rounds remain)
- `round_result` → `finished` via `nextRound()` (if no rounds remain)
- `finished` → `upload` via `resetGame()`

## Data Model

```ts
type Photo = {
  id: string
  file: File
  previewUrl: string
  lat: number | null
  lng: number | null
  hasLocation: boolean
}

type Round = {
  id: string
  photo: Photo
  guessedLat: number | null
  guessedLng: number | null
  distanceMiles: number | null
  score: number | null
  completed: boolean
}

type GameState = {
  status: 'upload' | 'playing' | 'round_result' | 'finished'
  rounds: Round[]
  currentRoundIndex: number
}
```

## Game Rules

- Only photos with valid EXIF GPS coordinates are playable
- Photos without GPS are shown in the upload list with a "No location data" label but cannot be played
- On `startGame`: valid GPS photos are shuffled randomly, silently capped at 5, and converted to `Round` objects
- Minimum to start: 1 valid GPS photo
- Maximum rounds per game: 5

## Scoring

Implemented as a pure function in `lib/haversine.ts`.

```
distanceMiles = haversine(guessLat, guessLng, actualLat, actualLng)
score = max(0, 5000 - distanceMiles * 10)
```

- Perfect guess (~0 miles): ~5000 points
- 500+ miles off: 0 points
- Distance displayed in miles, rounded to one decimal

## Screens

### Upload Screen (`UploadScreen.tsx`)

- Centered card with drag-and-drop zone and file input (all image types accepted)
- EXIF parsed immediately on file selection via `lib/exif.ts`
- Each photo shown in a list with status indicator:
  - Green checkmark: valid GPS location found
  - Grey label: "No location data"
- "Start Game" button appears once at least one valid GPS photo is queued
- Valid GPS photos silently capped at 5; additional valid photos beyond 5 are ignored
- Photos without GPS can still appear in the list (informational only)
- Dark aesthetic, polished feel

### Round Screen (`RoundScreen.tsx`)

- Full-screen Mapbox map (dark-v11 style)
- Round indicator top-left: "Round 2 of 5"
- PiP photo card anchored bottom-left:
  - Desktop: 280px wide × 180px tall
  - Mobile: 220px wide
  - Slight shadow, rounded corners
  - Clicking/tapping opens full-screen modal overlay
- Modal overlay: centered photo, X button, tap-outside to dismiss
- "Submit Guess" button anchored bottom-right, disabled until a pin is dropped
- Pin drop via click (mouse) or tap (touch) — dropping a new pin replaces the previous one

### Round Result Screen (`RoundResultScreen.tsx`)

- Same map, now in result mode:
  - Guess pin marker
  - Actual location pin marker
  - GeoJSON LineLayer connecting the two points
  - Map auto-fits bounds to show both points with padding
- Score overlay card showing:
  - Distance in miles (1 decimal)
  - Points scored this round
- "Next Round" button (or "See Results" on the final round)

### End Screen (`EndScreen.tsx`)

- Total score across all rounds
- Per-round summary: photo thumbnail, distance, score
- "Play Again" button — calls `resetGame()`, returns to upload screen

## Components

```
app/
  layout.tsx            — shell, dark background, global styles
  page.tsx              — reads status, renders active screen

components/
  UploadScreen.tsx      — drag-drop zone, photo list, Start Game button
  RoundScreen.tsx       — composes MapView + PhotoPiP + round controls
  RoundResultScreen.tsx — result map + score overlay + navigation button
  EndScreen.tsx         — total score, round summaries, Play Again
  MapView.tsx           — dynamically imported Mapbox map component
  PhotoPiP.tsx          — PiP card + full-screen modal

hooks/
  useGameState.ts       — all state and actions

lib/
  haversine.ts          — pure distance + score calculation
  exif.ts               — exifr wrapper returning { lat, lng } | null
```

## Key Implementation Notes

- `MapView.tsx` must be dynamically imported with `{ ssr: false }` to avoid `window` reference errors in Next.js
- Mapbox token consumed from `process.env.NEXT_PUBLIC_MAPBOX_TOKEN` — comment at usage site for discoverability
- EXIF parsed with `exifr.parse(file, { gps: true })` for lightweight GPS-only extraction
- Pin drop uses react-map-gl's `onClick` handler, which fires for both mouse and touch
- Round result line drawn with a Mapbox GeoJSON source + `LineLayer`; bounds fitted with `fitBounds` + padding

## Environment

```
# .env.local
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

## Out of Scope (Future)

- Camera roll API integration (direct random photo selection from device)
- Backend persistence, user accounts, leaderboards
- Sharing results
