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
