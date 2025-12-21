'use client'

import { useEffect, useState } from 'react'

type Track = {
  title: string
  artist: string
  url: string
}

type Recommendation = {
  title: string
  youtube: string
}

export default function MoodGrid({ mood, seed }: { mood: string; seed?: string }) {
  const [tracks, setTracks] = useState<Track[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

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

      const params = new URLSearchParams({ mood })
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
        <h2 className="text-xl font-semibold">
          Aanbevolen bij stemming: {mood}
        </h2>
      )}

      {/* Spotify tracks */}
      {tracks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((track, index) => (
            <div key={index} className="p-4 border rounded bg-zinc-900 text-white">
              <p className="font-medium">{track.title}</p>
              <p className="text-sm text-zinc-400">door {track.artist}</p>
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-green-400 underline"
              >
                Open in Spotify
              </a>
            </div>
          ))}
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
