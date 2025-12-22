import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAppAccessToken } from '@/lib/spotify'

// Allowed seed genres (Spotify available-genre-seeds)
const allowedSeeds = new Set([
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime', 'black-metal',
  'bluegrass', 'blues', 'bossanova', 'brazil', 'breakbeat', 'british', 'cantopop',
  'chicago-house', 'children', 'chill', 'classical', 'club', 'comedy', 'country',
  'dance', 'dancehall', 'death-metal', 'deep-house', 'detroit-techno', 'disco', 'disney',
  'drum-and-bass', 'dub', 'dubstep', 'edm', 'electro', 'electronic', 'emo', 'folk',
  'forro', 'french', 'funk', 'garage', 'german', 'gospel', 'goth', 'grindcore', 'groove',
  'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore', 'hardstyle', 'heavy-metal',
  'hip-hop', 'holidays', 'honky-tonk', 'house', 'idm', 'indian', 'indie-pop', 'industrial',
  'iranian', 'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin',
  'latino', 'malay', 'mandopop', 'metal', 'metalcore', 'minimal-techno', 'movies',
  'mpb', 'new-release', 'opera', 'pagode', 'party', 'philippines-opm', 'piano', 'pop',
  'pop-film', 'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock', 'punk',
  'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'road-trip', 'rock',
  'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba', 'sertanejo',
  'show-tunes', 'singer-songwriter', 'ska', 'sleep', 'songwriter', 'soul', 'soundtracks',
  'spanish', 'study', 'summer', 'swedish', 'synth-pop', 'tango', 'techno', 'trance',
  'trip-hop', 'turkish', 'work-out', 'world-music',
])

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
  const mood = searchParams.get('mood')?.toLowerCase() || 'blij'
  const seedParam = searchParams.get('seed')?.toLowerCase() || ''
  const chosenSeed = allowedSeeds.has(seedParam) ? seedParam : ''

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

    // If user token expired, retry once with app token
    if (res.status === 401 && userAccessToken) {
      accessToken = await getAppAccessToken()
      res = await fetchWithToken(accessToken, url)
    }

    // Invalid seed (e.g. 400/404)? Retry once with safe default "pop"
    if (res.status !== 200 && seedGenre !== 'pop') {
      const fallbackParams = new URLSearchParams(params)
      fallbackParams.set('seed_genres', 'pop')
      url = `https://api.spotify.com/v1/recommendations?${fallbackParams.toString()}`
      seedGenre = 'pop'
      res = await fetchWithToken(accessToken, url)
    }

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      console.error('Spotify API response', res.status, res.statusText, errorText)
      throw new Error(`Spotify API fout: ${res.statusText}`)
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
