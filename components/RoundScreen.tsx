import type { Round } from '@/lib/types'
type Props = { round: Round; roundNumber: number; totalRounds: number; onSubmitGuess: (lat: number, lng: number) => void }
export default function RoundScreen(_props: Props) {
  return <div className="p-8 text-white">Round — coming soon</div>
}
