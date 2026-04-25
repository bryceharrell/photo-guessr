import exifr from 'exifr'

export type GpsCoords = { lat: number; lng: number }

export async function parseGps(file: File): Promise<GpsCoords | null> {
  try {
    const result = await exifr.parse(file, { gps: true })
    if (result?.latitude != null && result?.longitude != null) {
      return { lat: result.latitude, lng: result.longitude }
    }
    return null
  } catch {
    return null
  }
}
