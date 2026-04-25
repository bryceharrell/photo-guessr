# PhotoGuessr — Product Direction

A running log of ideas, decisions, and explorations. Add to this as thinking evolves.

---

## Core identity

PhotoGuessr isn't geography trivia — it's about knowing someone's life. GeoGuessr tests world knowledge. PhotoGuessr tests personal knowledge. That distinction should drive every product decision.

---

## Angles explored (2025-04-25)

### Social challenge — "Who knows me best?" ✅ Recommended next
You pick photos from your own trips and share a link. Friends compete to guess where you've been. The winner is whoever knows your life best.

**Why this works:**
- Emotionally resonant in a way geography trivia can't be
- Natural viral loop: you play, you want to send it to close friends
- Shareable score is flattering either way ("look where I've been")
- Extends the current game directly — just needs a backend for shareable links + score aggregation (Supabase is the likely choice)
- Group chat use case: one person curates photos, shares link, everyone submits scores

**What it needs:** shareable challenge links, persistent rounds tied to a challenge ID, score leaderboard per challenge

---

### Camera roll random play — "How well do you know your own life?"
The game picks random photos from your camera roll across different years/locations and you guess where they were taken.

**Why it's interesting:** taps into personal memory, surprise factor of forgotten trips

**Why we parked it:** requires a native app to access the camera roll without manual selection. A web app always requires the user to explicitly upload, which removes the "random surprise" mechanic that makes this fun. Could revisit if we go native.

---

### Daily challenge
A universally shared puzzle each day, Wordle-style. Everyone plays the same photos.

**The problem:** without a twist it's just GeoGuessr Daily.

**The twist that could make it unique:** community-submitted photos. Players opt in to submit travel photos, best ones get surfaced as the daily challenge. The submitter gets recognition ("10,000 people tried to guess where I took this"). Creates a contribution incentive loop.

**Why we parked it:** needs curation/moderation infrastructure and a user base before it has value. Better as a phase 2 once there are active users.

---

### "Stump your friends" variant
Same as the social challenge but you're explicitly trying to pick your *hardest* photos — zoomed-in details, unusual angles, no obvious landmarks. Adds a puzzle-design role for the person curating.

**Status:** could be a mode within the social challenge, not a separate product. Low lift once the challenge mechanic exists.

---

## Build order thinking

1. **Social challenge mechanic** — shareable link, anyone can play, scores collected and shown at the end. This is the first thing that makes the game something you'd send to friends rather than play alone.
2. **Leaderboard / score sharing** — see how you ranked against everyone who played a given challenge. Shareable result card.
3. **Daily challenge** — only makes sense once there are enough users submitting photos and a content pipeline exists.
4. **Native app** — unlocks camera roll random play. Only worth it if the web version has proven the concept.
