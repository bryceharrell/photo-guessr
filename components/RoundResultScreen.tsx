import type { Round } from '@/lib/types'
type Props = { round: Round; isLastRound: boolean; onNext: () => void }
export default function RoundResultScreen(_props: Props) {
  return <div className="p-8 text-white">Result — coming soon</div>
}
