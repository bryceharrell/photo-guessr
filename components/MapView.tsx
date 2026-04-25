'use client'

import { useCallback } from 'react'
import Map, { Layer, Marker, Source } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'react-map-gl/mapbox'

// Token is provided via NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

type Pin = { lat: number; lng: number }

type Props = {
  onPinDrop?: (lat: number, lng: number) => void
  guessPin?: Pin | null
  actualPin?: Pin | null
  resultMode?: boolean
}

export default function MapView({ onPinDrop, guessPin, actualPin, resultMode = false }: Props) {
  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      if (!resultMode && onPinDrop) {
        onPinDrop(e.lngLat.lat, e.lngLat.lng)
      }
    },
    [resultMode, onPinDrop],
  )

  const lineGeoJSON: GeoJSON.Feature<GeoJSON.LineString> | null =
    resultMode && guessPin && actualPin
      ? {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [guessPin.lng, guessPin.lat],
              [actualPin.lng, actualPin.lat],
            ],
          },
          properties: {},
        }
      : null

  const initialViewState =
    resultMode && guessPin && actualPin
      ? {
          bounds: [
            [Math.min(guessPin.lng, actualPin.lng), Math.min(guessPin.lat, actualPin.lat)],
            [Math.max(guessPin.lng, actualPin.lng), Math.max(guessPin.lat, actualPin.lat)],
          ] as [[number, number], [number, number]],
          fitBoundsOptions: { padding: 100 },
        }
      : { longitude: 0, latitude: 20, zoom: 1.5 }

  return (
    <Map
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={initialViewState}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/navigation-night-v1"
      onClick={handleClick}
      cursor={resultMode ? 'default' : 'crosshair'}
    >
      {guessPin && (
        <Marker longitude={guessPin.lng} latitude={guessPin.lat} color="#3b82f6" />
      )}
      {resultMode && actualPin && (
        <Marker longitude={actualPin.lng} latitude={actualPin.lat} color="#22c55e" />
      )}
      {lineGeoJSON && (
        <Source id="result-line-source" type="geojson" data={lineGeoJSON}>
          <Layer
            id="result-line"
            type="line"
            paint={{ 'line-color': '#ffffff', 'line-width': 2, 'line-dasharray': [3, 2] }}
          />
        </Source>
      )}
    </Map>
  )
}
