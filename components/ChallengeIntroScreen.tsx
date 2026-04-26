'use client'

type Props = {
  onStart: () => void
  isOwn?: boolean
}

export default function ChallengeIntroScreen({ onStart, isOwn }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <a href="/" className="absolute top-4 left-4 text-sm font-semibold text-white hover:text-zinc-300 transition-colors">
        PhotoGuessr
      </a>
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">PhotoGuessr</h1>
        <p className="text-xl text-zinc-200 mb-2">{isOwn ? 'Your challenge' : 'A friend challenged you'}</p>
        <p className="text-zinc-400 mb-10">{isOwn ? 'See how you do on your own photos' : 'Guess where these photos were taken'}</p>
        <button
          onClick={onStart}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Start
        </button>
      </div>
    </div>
  )
}
