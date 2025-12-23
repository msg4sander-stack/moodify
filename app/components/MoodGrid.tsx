'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type Track = {
  title: string
  artist: string
  url: string
  album?: string
  image?: string
  previewUrl?: string
}

type Recommendation = {
  title: string
  youtube: string
}

export default function MoodGrid({ mood, seed }: { mood: string; seed?: string }) {
  const { status } = useSession()
  const [tracks, setTracks] = useState<Track[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const isAuthed = status === 'authenticated'

  useEffect(() => {
    let cancelled = false

    async function fetchTracks() {
      if (!mood) {
        setTracks([])
        setRecommendations([])
        return
      }

      setTracks([])
      setRecommendations([])

      const lang =
        typeof navigator !== 'undefined'
          ? navigator.language || navigator.languages?.[0] || 'en'
          : 'en'

      const params = new URLSearchParams({ mood, lang })
      if (seed) {
        params.set('seed', seed)
      }

      const res = await fetch(`/api/spotify/recommendations?${params.toString()}`)

      if (!res.ok) {
        console.error('API error:', await res.text())
        return
      }

      const data = await res.json()
      if (cancelled) return

      if (data.tracks) {
        setTracks(data.tracks)
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    }

    fetchTracks()

    return () => {
      cancelled = true
    }
  }, [mood, seed])

  return (
    <div className="space-y-6">
      {mood && (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Aanbevolen bij stemming: {mood}</h2>
          <p className="text-sm text-zinc-300">
            Genre bron: {seed ? `handmatig gekozen (${seed})` : 'op basis van mood-mapping'}
          </p>
        </div>
      )}

      {/* Spotify tracks */}
      {tracks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((track, index) => {
            const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(
              `${track.title} ${track.artist}`
            )}`
            const primaryHref = isAuthed ? track.url : youtubeLink
            const primaryLabel = isAuthed ? 'Open in Spotify' : 'Bekijk op YouTube'

            return (
              <div key={index} className="p-4 border rounded bg-zinc-900 text-white flex gap-3">
                {track.image && (
                  <img
                    src={track.image}
                    alt={track.title}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{track.title}</p>
                  <p className="text-sm text-zinc-400">door {track.artist}</p>
                  {track.album && (
                    <p className="text-xs text-zinc-500 mt-1">Album: {track.album}</p>
                  )}
                </div>
                <a
                  href={primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start text-green-400 underline text-sm"
                >
                  {primaryLabel}
                </a>
                {isAuthed && track.previewUrl && (
                  <a
                    href={track.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start text-emerald-300 underline text-xs"
                  >
                    Preview
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* YouTube fallback */}
      {recommendations.length > 0 && (
        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <div key={index}>
              <a
                href={rec.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 underline"
              >
                {rec.title}
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Geen resultaat */}
      {tracks.length === 0 && recommendations.length === 0 && mood && (
        <p className="text-zinc-400">Geen muziek gevonden voor deze stemming.</p>
      )}
    </div>
  )
}
