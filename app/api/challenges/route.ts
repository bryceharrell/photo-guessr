import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { rounds } = await req.json() as { rounds: { lat: number; lng: number }[] }

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

  const uploads: { signedUrl: string }[] = []

  for (let i = 0; i < rounds.length; i++) {
    const roundId = crypto.randomUUID()
    const storagePath = `${challenge.id}/${roundId}.jpg`

    const { data: uploadData, error: signError } = await supabase.storage
      .from('challenge-photos')
      .createSignedUploadUrl(storagePath)

    if (signError || !uploadData) {
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    roundInserts.push({
      id: roundId,
      challenge_id: challenge.id,
      order: i,
      storage_path: storagePath,
      lat: rounds[i].lat,
      lng: rounds[i].lng,
    })

    uploads.push({ signedUrl: uploadData.signedUrl })
  }

  const { error: roundsError } = await supabase.from('rounds').insert(roundInserts)

  if (roundsError) {
    return NextResponse.json({ error: 'Failed to create rounds' }, { status: 500 })
  }

  return NextResponse.json({ id: challenge.id, uploads })
}
