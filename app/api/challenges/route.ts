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
