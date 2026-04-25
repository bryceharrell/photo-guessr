import dynamic from 'next/dynamic'

// MapView uses mapbox-gl which requires window — must be client-only, no SSR
const MapViewDynamic = dynamic(() => import('./MapView'), { ssr: false })

export default MapViewDynamic
