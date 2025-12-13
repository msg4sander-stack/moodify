'use client'

import { useState } from 'react'

export default function MoodGrid() {
  const [tracks, setTracks] = useState<any[]>([])
  const [selectedMood, setSelectedMood] = useState("")

  async function fetchTracks(mood: string) {
    setSelectedMood(mood)
    const res = await fetch(`/api/spotify/recommendations?mood=${mood}`)
    const data = await res.json()
    setTracks(data.tracks)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {["vrolijk", "rustig", "romantisch", "energiek", "verdrietig"].map((mood) => (
          <button key={mood} onClick={() => fetchTracks(mood)} className="bg-purple-600 text-white px-4 py-2 rounded">
            {mood}
          </button>
        ))}
      </div>

      {selectedMood && (
        <h2 className="text-xl font-semibold">Aanbevolen bij stemming: {selectedMood}</h2>
      )}

      <div className="grid grid-cols-2 gap-4">
        {tracks.map((track) => (
          <div key={track.id} className="p-4 border rounded bg-zinc-900 text-white">
            <p className="font-medium">{track.name}</p>
            <p className="text-sm text-zinc-400">door {track.artists[0].name}</p>
            <a
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-green-400 underline"
            >
              Open in Spotify
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
