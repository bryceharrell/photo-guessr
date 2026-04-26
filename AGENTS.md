<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# PhotoGuessr — Project Context

## What this is
A GeoGuessr-style web game where users upload photos from their camera roll and guess where each was taken by dropping a pin on a Mapbox map. The unique angle: it's about knowing someone's life, not geography trivia. The planned social feature ("Who knows me best?") lets you pick your own photos, share a link, and have friends compete to guess where you've been.

## Tech stack
- Next.js 16.2.4 with App Router, React 19, TypeScript
- Tailwind CSS 4 — uses `@import "tailwindcss"` syntax (not the old `@tailwind` directives)
- react-map-gl v8 — import path is `react-map-gl/mapbox` (breaking change from v7)
- Mapbox GL JS, map style `mapbox://styles/mapbox/outdoors-v12`
- exifr for client-side EXIF GPS parsing
- Jest + @testing-library/react for tests
- Deployed on Vercel. `NEXT_PUBLIC_MAPBOX_TOKEN` is required in env vars (must have `NEXT_PUBLIC_` prefix for browser access)

## Key files
- `app/page.tsx` — status router, renders the correct screen based on game state
- `hooks/useGameState.ts` — single hook owning all game state; actions: `startGame`, `submitGuess`, `nextRound`, `timeoutRound`, `resetGame`
- `lib/types.ts` — `Photo`, `Round`, `GameState` types
- `lib/haversine.ts` — distance calculation + exponential scoring (`Math.round(5000 * Math.exp(-distanceMiles / 200))`)
- `lib/exif.ts` — exifr wrapper for GPS parsing
- `components/MapView.tsx` — Mapbox map; result mode uses `initialViewState` with `bounds` (not `useEffect`+`fitBounds`)
- `components/MapViewDynamic.tsx` — `dynamic(() => import('./MapView'), { ssr: false })`
- `components/RoundScreen.tsx` — full-screen map with 30s countdown timer, photo PiP, submit button
- `components/PhotoPiP.tsx` — thumbnail card (bottom-left) + expand modal
- `components/UploadScreen.tsx`, `RoundResultScreen.tsx`, `EndScreen.tsx`
- `__mocks__/mapbox-gl.ts` — mapbox stub for Jest
- `docs/direction.md` — product direction and feature explorations
- `docs/technical-decisions.md` — technical design decisions and rationale

## Game flow
`upload` → `playing` → `round_result` → (repeat) → `finished`

Up to 5 rounds. Photos without GPS are excluded. Each round has a 30s timer — auto-submits pin if one was dropped, forfeits (score 0) if not.

## What's next
Building the social challenge backend. Plan:
- Supabase for database + file storage
- Private bucket with signed URLs for photos (~1hr expiry)
- Three tables: `challenges`, `rounds`, `scores`
- GPS coords returned with initial API response (no anti-cheat needed)
- Shareable link: `/challenge/[id]`
- Results page: `/challenge/[id]/results`
- No auth for now — "anyone with the link can play" model
- See `docs/technical-decisions.md` for full rationale

## Coding conventions
- TDD: write failing test before any production code
- No comments unless the why is non-obvious
- All game state lives in `useGameState` hook — keep it that way
- `pointer-events-none` on layout containers, `pointer-events-auto` on interactive children (learned the hard way)
