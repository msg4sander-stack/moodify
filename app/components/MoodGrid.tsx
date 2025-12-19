'use client'

import { useState } from 'react'

type Track = {
  title: string
  artist: string
  url: string
}

type Recommendation = {
  title: string
  youtube: string
}

export default function MoodGrid() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [selectedMood, setSelectedMood] = useState('')
  const [source, setSource] = useState<'spotify-user' | 'spotify-app' | 'youtube' | 'youtube-fallback' | ''>('')

  async function fetchTracks(mood: string) {
    setSelectedMood(mood)
    setTracks([])
    setRecommendations([])

    const res = await fetch(`/api/spotify/recommendations?mood=${mood}`)

    if (!res.ok) {
      console.error('API error:', await res.text())
      return
    }

    const data = await res.json()

    setSource(data.source)

    if (data.tracks) {
      setTracks(data.tracks)
    }

    if (data.recommendations) {
      setRecommendations(data.recommendations)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 flex-wrap">
        {['vrolijk', 'rustig', 'romantisch', 'energiek', 'verdrietig', 'salsa', 'hardrock'].map((mood) => (
          <button
            key={mood}
            onClick={() => fetchTracks(mood)}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            {mood}
          </button>
        ))}
      </div>

      {selectedMood && (
        <h2 className="text-xl font-semibold">
          Aanbevolen bij stemming: {selectedMood}
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
      {tracks.length === 0 && recommendations.length === 0 && selectedMood && (
        <p className="text-zinc-400">Geen muziek gevonden voor deze stemming.</p>
      )}
    </div>
  )
}
