'use client'

import { useState } from 'react'

type Props = {
  previewUrl: string
}

export default function PhotoPiP({ previewUrl }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      <div
        className="relative w-[160px] sm:w-[220px] md:w-[280px] h-[103px] sm:h-[140px] md:h-[180px] rounded-xl overflow-hidden shadow-2xl cursor-pointer ring-1 ring-white/10 hover:ring-white/30 transition-all flex-shrink-0"
        onClick={() => setIsExpanded(true)}
      >
        <img src={previewUrl} alt="Round photo" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
          <span className="text-white text-xs font-medium">Click to expand</span>
        </div>
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewUrl}
              alt="Round photo expanded"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80 transition-colors"
              onClick={() => setIsExpanded(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
