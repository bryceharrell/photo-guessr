# PhotoGuessr — Technical Decisions

A running log of technical design decisions and the reasoning behind them.

---

## Backend: Supabase

Chosen for PostgreSQL + file storage + auto-generated APIs with zero infrastructure overhead. Right fit for a Next.js app at this stage.

---

## Challenge photo storage: private bucket with signed URLs

Photos uploaded for a challenge are stored in a private Supabase Storage bucket. Signed URLs (short-lived, ~1 hour) are generated at request time and served to anyone who has the challenge link.

**Why not a public bucket:** photos would be publicly indexed and accessible to anyone on the internet, not just people with the link.

**Privacy model:** anyone with the challenge link can play and view the photos. If the link is forwarded, so is access. This is intentional and acceptable — same mental model as "anyone with the link" sharing in Google Docs or uploading to Instagram. Users should not upload photos they wouldn't want shared.

A one-liner disclaimer should appear on the upload screen when challenge mode ships: "Photos you upload may be seen by anyone with the challenge link."

---

## GPS coordinates: returned with initial API response

We store lat/lng in the database alongside the round data, but return them to the client on initial load. We're assuming players won't cheat. This avoids a second server round-trip to reveal coordinates after guessing and keeps the architecture simple.

---

## EXIF metadata stripping

Photos uploaded to storage retain their original EXIF data, which includes embedded GPS coordinates. Anyone who downloads a photo via its signed URL can extract the exact location from the file. Since GPS is parsed client-side before upload, the EXIF data is no longer needed in the stored file.

**Decision:** strip EXIF metadata server-side before writing to Supabase Storage before this gets serious. Not required for the initial build among friends, but should be done before any public launch.

---

## Auth: deferred

No auth for the initial social challenge build. Challenge creators and players are anonymous. If the app grows, auth + invite-only challenges would be the natural next step.

**Challenge link expiry:** challenges currently live in the DB indefinitely. A TTL (e.g. 7 days) should be added before any public launch to prevent stale links accumulating.
