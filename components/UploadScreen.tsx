'use client'

import { useCallback, useState } from 'react'
import type { Photo } from '@/lib/types'
import { parseGps } from '@/lib/exif'

type Props = {
  onStartGame: (photos: Photo[]) => void
}

export default function UploadScreen({ onStartGame }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const newPhotos: Photo[] = []
    for (const file of Array.from(files)) {
      const previewUrl = URL.createObjectURL(file)
      const gps = await parseGps(file)
      newPhotos.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
        hasLocation: gps !== null,
      })
    }

    setPhotos((prev) => {
      const merged: Photo[] = [...prev]
      for (const photo of newPhotos) {
        const validCount = merged.filter((p) => p.hasLocation).length
        if (photo.hasLocation && validCount >= 5) continue
        merged.push(photo)
      }
      return merged
    })
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
  }

  const validCount = photos.filter((p) => p.hasLocation).length

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">PhotoGuessr</h1>
          <p className="text-zinc-400">Upload photos and guess where they were taken.</p>
        </div>

        <label
          className={`block border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-white bg-zinc-800' : 'border-zinc-600 hover:border-zinc-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
        >
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          <p className="text-zinc-300 text-sm">Drop photos here or click to browse</p>
          <p className="text-zinc-500 text-xs mt-1">Photos with GPS data will be used for the game</p>
        </label>

        {photos.length > 0 && (
          <ul className="mt-4 space-y-2">
            {photos.map((photo) => (
              <li key={photo.id} className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3">
                <img src={photo.previewUrl} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                <span className="flex-1 text-sm text-zinc-300 truncate">{photo.file?.name ?? 'Photo'}</span>
                {photo.hasLocation ? (
                  <span className="text-green-400 text-xs flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Location found
                  </span>
                ) : (
                  <span className="text-zinc-500 text-xs">No location data</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {validCount > 0 && (
          <button
            onClick={() => onStartGame(photos)}
            className="mt-6 w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Start Game ({validCount} {validCount === 1 ? 'photo' : 'photos'})
          </button>
        )}
      </div>
    </div>
  )
}
