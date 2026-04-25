import type { Round } from '@/lib/types'
type Props = { rounds: Round[]; onPlayAgain: () => void }
export default function EndScreen(_props: Props) {
  return <div className="p-8 text-white">End — coming soon</div>
}
