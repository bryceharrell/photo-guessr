export type Photo = {
  id: string
  file: File
  previewUrl: string
  lat: number | null
  lng: number | null
  hasLocation: boolean
}

export type Round = {
  id: string
  photo: Photo
  guessedLat: number | null
  guessedLng: number | null
  distanceMiles: number | null
  score: number | null
  completed: boolean
}

export type GameState = {
  status: 'upload' | 'playing' | 'round_result' | 'finished'
  rounds: Round[]
  currentRoundIndex: number
}
