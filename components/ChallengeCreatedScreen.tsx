'use client'

type Props = {
  challengeId: string
}

export default function ChallengeCreatedScreen({ challengeId }: Props) {
  const challengeUrl = `${window.location.origin}/challenge/${challengeId}`

  async function handleShare() {
    await navigator.share({
      text: "Can you guess where I've been? Play my PhotoGuessr challenge!",
      url: challengeUrl,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <a href="/" className="absolute top-4 left-4 text-sm font-semibold text-white hover:text-zinc-300 transition-colors">
        PhotoGuessr
      </a>
      <div className="w-full max-w-lg text-center">
        <h2 className="text-3xl font-bold mb-2">Challenge created!</h2>
        <p className="text-zinc-400 mb-8">
          Share the link with friends to see if they can guess where you&apos;ve been.
        </p>
        <button
          onClick={handleShare}
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors mb-3"
        >
          Share Challenge
        </button>
        <a
          href={`/challenge/${challengeId}`}
          className="block w-full bg-zinc-800 text-white font-semibold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
        >
          Play it myself
        </a>
      </div>
    </div>
  )
}
