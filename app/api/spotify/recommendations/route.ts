import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { headers } from 'next/headers'
import { getAppAccessToken } from '@/lib/spotify'
import { allowedSeedSet } from '@/lib/spotifySeeds'

// Audio feature targets per mood for Spotify recommendations
const moodAudioTargets: Record<
  string,
  {
    targetValence?: number
    targetEnergy?: number
    minValence?: number
    maxValence?: number
    minEnergy?: number
    maxEnergy?: number
    minDanceability?: number
  }
> = {
  blij: { targetValence: 0.9, targetEnergy: 0.8, minDanceability: 0.7 },
  energiek: { targetValence: 0.75, targetEnergy: 0.9, minDanceability: 0.7 },
  relaxed: { targetValence: 0.6, targetEnergy: 0.35, maxEnergy: 0.45, minDanceability: 0.3 },
  verdrietig: { targetValence: 0.2, targetEnergy: 0.2 },
  romantisch: { targetValence: 0.65, targetEnergy: 0.5, minDanceability: 0.4 },
  boos: { targetValence: 0.3, targetEnergy: 0.85, minDanceability: 0.5 },
  neutraal: { targetValence: 0.5, targetEnergy: 0.5 },
  dromerig: { targetValence: 0.6, targetEnergy: 0.4, minDanceability: 0.35 },
  gestrest: { targetValence: 0.4, targetEnergy: 0.25, minDanceability: 0.2 },
}

function buildYoutubeFallback(mood: string, seed: string) {
  const targets = moodAudioTargets[mood] || {}
  const paramTokens: string[] = []

  if (typeof targets.targetValence === 'number') paramTokens.push(`target_valence=${targets.targetValence}`)
  if (typeof targets.targetEnergy === 'number') paramTokens.push(`target_energy=${targets.targetEnergy}`)
  if (typeof targets.minValence === 'number') paramTokens.push(`min_valence=${targets.minValence}`)
  if (typeof targets.maxValence === 'number') paramTokens.push(`max_valence=${targets.maxValence}`)
  if (typeof targets.minEnergy === 'number') paramTokens.push(`min_energy=${targets.minEnergy}`)
  if (typeof targets.maxEnergy === 'number') paramTokens.push(`max_energy=${targets.maxEnergy}`)
  if (typeof targets.minDanceability === 'number') paramTokens.push(`min_danceability=${targets.minDanceability}`)

  const searchTokens = [seed || mood, ...paramTokens]
  const query = encodeURIComponent(searchTokens.join(' '))

  return {
    mood,
    source: 'youtube-fallback',
    tracks: [],
    recommendations: [
      {
        title: `Zoekresultaten voor "${seed || mood}" op YouTube`,
        youtube: `https://www.youtube.com/results?search_query=${query}`,
      },
    ],
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const headerList = await headers()
  const headerLang = headerList.get('accept-language')?.split(',')[0] || ''
  const lang = searchParams.get('lang') || headerLang || 'en'

  // Derive market from lang (e.g. nl -> NL, en-US -> US); default US
  const market =
    lang.split('-')[1]?.toUpperCase() ||
    lang.slice(0, 2).toUpperCase() ||
    'US'
  const mood = searchParams.get('mood')?.toLowerCase() || 'blij'
  const seedParam = searchParams.get('seed')?.toLowerCase() || ''
  const chosenSeed = allowedSeedSet.has(seedParam) ? seedParam : ''

  // Always use a valid seed; fallback to pop
  let seedGenre = chosenSeed || 'pop'
  const secret = process.env.NEXTAUTH_SECRET

  // Try user token first
  const token = await getToken({ req, secret })
  const userAccessToken = typeof token?.accessToken === 'string' ? token.accessToken : undefined
  let accessToken = userAccessToken ?? (await getAppAccessToken())

  try {
    const params = new URLSearchParams({
      seed_genres: seedGenre,
      limit: '8',
      market,
    })

    // Add mood-based targets
    const targets = moodAudioTargets[mood] || {}
    const {
      targetValence,
      targetEnergy,
      minValence,
      maxValence,
      minEnergy,
      maxEnergy,
      minDanceability,
    } = targets
    if (typeof targetValence === 'number') params.set('target_valence', String(targetValence))
    if (typeof targetEnergy === 'number') params.set('target_energy', String(targetEnergy))
    if (typeof minValence === 'number') params.set('min_valence', String(minValence))
    if (typeof maxValence === 'number') params.set('max_valence', String(maxValence))
    if (typeof minEnergy === 'number') params.set('min_energy', String(minEnergy))
    if (typeof maxEnergy === 'number') params.set('max_energy', String(maxEnergy))
    if (typeof minDanceability === 'number') params.set('min_danceability', String(minDanceability))

    const fetchWithToken = (tokenValue: string, targetUrl: string) =>
      fetch(targetUrl, {
        headers: { Authorization: `Bearer ${tokenValue}` },
      })

    let url = `https://api.spotify.com/v1/recommendations?${params.toString()}`
    let res = await fetchWithToken(accessToken, url)

    // If user token expired or bad, retry once with fresh app token
    if (!res.ok && userAccessToken) {
      accessToken = await getAppAccessToken()
      res = await fetchWithToken(accessToken, url)
    }

    // Invalid seed (e.g. 400/404)? Retry once with safe default "pop"
    if (!res.ok && seedGenre !== 'pop') {
      const fallbackParams = new URLSearchParams(params)
      fallbackParams.set('seed_genres', 'pop')
      url = `https://api.spotify.com/v1/recommendations?${fallbackParams.toString()}`
      seedGenre = 'pop'
      res = await fetchWithToken(accessToken, url)
    }

    // Still failing? Use a known-good seed track (Spotify docs example)
    if (!res.ok) {
      const trackFallback = new URLSearchParams(params)
      trackFallback.delete('seed_genres')
      trackFallback.set('seed_tracks', '4NHQUGzhtTLFvgF5SZesLK')
      url = `https://api.spotify.com/v1/recommendations?${trackFallback.toString()}`
      res = await fetchWithToken(accessToken, url)
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error('Spotify API response', res.status, res.statusText, errorText)
      throw new Error(`Spotify API fout: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()

    const tracks = data.tracks.map((track: any) => ({
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      url: track.external_urls.spotify,
      album: track.album?.name ?? '',
      image: track.album?.images?.[0]?.url ?? '',
      previewUrl: track.preview_url ?? '',
    }))

    return NextResponse.json({
      mood,
      source: userAccessToken ? 'spotify-user' : 'spotify-app',
      tracks,
    })
  } catch (err) {
    console.error('Fout bij ophalen Spotify tracks:', err)
    return NextResponse.json(buildYoutubeFallback(mood, chosenSeed))
  }
}
