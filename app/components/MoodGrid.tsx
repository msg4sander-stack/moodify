'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'

type Track = {
  title: string
  artist: string
  url: string
  uri?: string
  album?: string
  image?: string
  previewUrl?: string
}

type Recommendation = {
  title: string
  youtube: string
}

export default function MoodGrid({ mood, seed, market }: { mood: string; seed?: string; market?: string }) {
  const { status } = useSession()
  const [tracks, setTracks] = useState<Track[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const isAuthed = status === 'authenticated'
  const limit = 10

  // Reset page when mood, seed or market changes
  useEffect(() => {
    setPage(1)
  }, [mood, seed, market])

  useEffect(() => {
    let cancelled = false

    async function fetchTracks() {
      if (!mood) {
        setTracks([])
        setRecommendations([])
        return
      }

      setLoading(true)
      const lang =
        typeof navigator !== 'undefined'
          ? navigator.language || navigator.languages?.[0] || 'en'
          : 'en'

      const offset = (page - 1) * limit
      const params = new URLSearchParams({
        mood,
        lang,
        offset: offset.toString(),
        limit: limit.toString()
      })
      if (seed) {
        params.set('seed', seed)
      }
      if (market) {
        params.set('market', market)
      }

      const res = await fetch(`/api/spotify/recommendations?${params.toString()}`)

      if (!res.ok) {
        setLoading(false)
        if (res.status === 401) {
          signIn('spotify')
          return
        }
        console.error('API error:', await res.text())
        return
      }

      const data = await res.json()
      setLoading(false)
      if (cancelled) return

      if (data.tracks) {
        setTracks(data.tracks)
      }

      if (data.pagination) {
        setTotal(data.pagination.total)
      } else {
        setTotal(data.tracks?.length || 0)
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    }

    fetchTracks()

    return () => {
      cancelled = true
    }
  }, [mood, seed, market, page])

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
      <div className={`relative transition-all duration-300 ${loading ? 'opacity-40 grayscale-[0.5] pointer-events-none' : 'opacity-100'}`}>
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Laden...</p>
            </div>
          </div>
        )}

        {tracks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map((track, index) => {
              const youtubeLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(
                `${track.title} ${track.artist}`
              )}`
              const spotifyDeepLink = track.url
              const primaryHref = isAuthed ? spotifyDeepLink : youtubeLink
              const primaryLabel = isAuthed ? 'Open in Spotify' : 'Bekijk op YouTube'

              return (
                <div key={index} className="p-4 border border-white/5 rounded-xl bg-neutral-900/50 backdrop-blur text-white flex gap-4 hover:border-emerald-500/30 transition-all">
                  {track.image && (
                    <img
                      src={track.image}
                      alt={track.title}
                      className="w-20 h-20 rounded-lg object-cover shadow-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <p className="font-semibold text-lg leading-tight line-clamp-1">{track.title}</p>
                      <p className="text-sm text-zinc-400 mt-1">door {track.artist}</p>
                    </div>
                    <div className="flex gap-4 items-baseline mt-2">
                      <a
                        href={primaryHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                      >
                        {primaryLabel}
                      </a>
                      {isAuthed && track.previewUrl && (
                        <a
                          href={track.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                        >
                          Preview
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {tracks.length > 0 && total > limit && (
        <div className="flex items-center justify-between py-6 border-t border-white/5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-full hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="Vorige pagina"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="text-sm text-zinc-400">
            Pagina <span className="text-white font-medium">{page}</span> van <span className="text-zinc-600">{Math.ceil(total / limit)}</span>
          </div>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= total || loading}
            className="p-2 rounded-full hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            title="Volgende pagina"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
