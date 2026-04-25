import type { Metadata } from 'next'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'PhotoGuessr',
  description: 'Guess where your photos were taken',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white min-h-screen">{children}</body>
    </html>
  )
}
