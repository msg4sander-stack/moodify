import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAppAccessToken } from '@/lib/spotify'
import { isAllowedSeed } from '@/lib/spotifySeeds'

// Audio feature targets per mood for Spotify recommendations
const moodAudioTargets: Record<string, any> = {
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

// Fallback mapping: Mood -> Genre (used for Search API when Recommendations API fails)
const moodGenreMap: Record<string, string> = {
  blij: 'pop',
  energiek: 'dance',
  relaxed: 'chill',
  verdrietig: 'sad',
  romantisch: 'romance',
  boos: 'rock',
  neutraal: 'pop',
  dromerig: 'indie',
  gestrest: 'classical',
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
  const headerLang = req.headers.get('accept-language')?.split(',')[0] || ''
  const lang = searchParams.get('lang') || headerLang || 'en'
  const mood = searchParams.get('mood')?.toLowerCase() || 'blij'
  const seedParam = searchParams.get('seed')?.toLowerCase() || ''
  const chosenSeed = isAllowedSeed(seedParam) ? seedParam : ''

  // Always use a valid seed; fallback to pop
  let seedGenre = chosenSeed || 'pop'
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const secret = process.env.NEXTAUTH_SECRET

  // Always use App Token for fetching results (as requested)
  // Check user session only for logging/status purposes
  const token = await getToken({ req, secret })
  const userAccessToken = typeof token?.accessToken === 'string' ? token.accessToken : undefined

  let accessToken: string

  try {
    accessToken = await getAppAccessToken()
  } catch (error) {
    console.error('Initial App Token fetch failed:', error)
    return NextResponse.json({ error: 'System token failure' }, { status: 401 })
  }

  try {
    // Start with minimal params
    const params = new URLSearchParams({
      seed_genres: seedGenre,
      limit: limit.toString(),
    })

    // Always add market (required for App Token on servers where IP geolocation fails)
    // Priority: Explicit market param > Language region > Default US
    let market =
      searchParams.get('market')?.toUpperCase() ||
      lang.split('-')[1]?.toUpperCase() ||
      lang.slice(0, 2).toUpperCase() ||
      'US'

    // Fix common mapping errors (EN is not a country)
    if (market === 'EN') market = 'US'

    params.set('market', market)

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

    const fetchWithToken = (tokenValue: string | undefined, targetUrl: string) => {
      if (!tokenValue) {
        throw new Error('Spotify access token ontbreekt (user of app)')
      }
      return fetch(targetUrl, {
        headers: { Authorization: `Bearer ${tokenValue}` },
        cache: 'no-store',
      })
    }

    // DEBUG: Check available seeds and endpoint connectivity
    console.log('Validating recommendations endpoint...')
    const seedsRes = await fetchWithToken(accessToken, 'https://api.spotify.com/v1/recommendations/available-genre-seeds')
    if (!seedsRes.ok) {
      console.error('Failed to fetch available seeds (Endpoint check)', seedsRes.status, await seedsRes.text())
    } else {
      const seedsData = await seedsRes.json().catch(() => ({}))
      const availableTags = seedsData.genres || []
      // console.log('Available genres:', availableTags.length) // Too verbose to log all
      if (!availableTags.includes(seedGenre)) {
        console.warn(`Requested genre '${seedGenre}' not available. Switching to '${availableTags[0]}'`)
        seedGenre = availableTags[0] || 'pop'
        // Update params with new valid seed
        params.set('seed_genres', seedGenre)
      }
    }

    // Quick probe to ensure token is accepted by Spotify before hitting recommendations
    let probe = await fetchWithToken(accessToken, 'https://api.spotify.com/v1/markets')
    if (probe.status === 401) {
      // refresh app token and retry probe
      accessToken = await getAppAccessToken()
      probe = await fetchWithToken(accessToken, 'https://api.spotify.com/v1/markets')
    }
    if (!probe.ok) {
      const probeBody = await probe.text().catch(() => '')
      console.error('Spotify token probe failed', probe.status, probe.statusText, probeBody, `Token type: app`, `Token length: ${accessToken?.length ?? 'N/A'}`)
      throw new Error(`Spotify token probe failed: ${probe.status} ${probe.statusText}`)
    }

    const buildUrl = (p: URLSearchParams) =>
      `https://api.spotify.com/v1/recommendations?${p.toString()}`

    let currentParams = params
    let url = buildUrl(currentParams)
    let res = await fetchWithToken(accessToken, url)

    // If token expired or bad ...
    if (res.status === 401) {
      accessToken = await getAppAccessToken()

      // If failing with specific market, retry with US market (safer fallback)
      if (currentParams.has('market') && currentParams.get('market') !== 'US') {
        const safeMarket = new URLSearchParams(currentParams)
        safeMarket.set('market', 'US')
        currentParams = safeMarket
        url = buildUrl(currentParams)
      }
      res = await fetchWithToken(accessToken, url)
    }

    // If still not OK and we were using a user token, retry with app token without market
    if (!res.ok && userAccessToken) {
      accessToken = await getAppAccessToken()
      const noMarket = new URLSearchParams(currentParams)
      noMarket.delete('market')
      currentParams = noMarket
      url = buildUrl(currentParams)
      res = await fetchWithToken(accessToken, url)
    }

    // If still failing, force market=US
    if (!res.ok && currentParams.get('market') !== 'US') {
      const safeMarket = new URLSearchParams(currentParams)
      safeMarket.set('market', 'US')
      currentParams = safeMarket
      url = buildUrl(currentParams)
      res = await fetchWithToken(accessToken, url)
    }

    // Invalid seed (e.g. 400/404)? Retry once with safe default "pop"
    if (!res.ok && seedGenre !== 'pop') {
      const fallbackParams = new URLSearchParams(currentParams)
      fallbackParams.set('seed_genres', 'pop')
      currentParams = fallbackParams
      seedGenre = 'pop'
      url = buildUrl(currentParams)
      res = await fetchWithToken(accessToken, url)
    }

    // Last-resort: Try Search API if Recommendations API is dead (404)
    if (!res.ok) {
      console.log('Recommendations API failed. Fallback to Search API...')
      const searchParams = new URLSearchParams()

      // Select best genre for search: User's chosen seed -> Mapped mood genre -> Default 'pop'
      const fallbackGenre = chosenSeed || moodGenreMap[mood] || 'pop'

      // Use basic, ultra-reliable search query
      searchParams.set('q', `genre:${fallbackGenre}`)
      searchParams.set('type', 'track')
      searchParams.set('limit', limit.toString())
      searchParams.set('market', market)
      searchParams.set('offset', offset.toString())

      url = `https://api.spotify.com/v1/search?${searchParams.toString()}`
      console.log(`Searching Spotify (Reliable Fallback): ${url}`)
      res = await fetchWithToken(accessToken, url)
    }

    if (!res.ok) {
      // If even Search fails, just return empty to avoid 500 crash
      console.error('All Spotify fallbacks failed', res.status)
      return NextResponse.json(buildYoutubeFallback(mood, chosenSeed))
    }

    const data = await res.json()

    // Unified response parsing (Search API returns tracks.items, Recommendations API returns tracks)
    const rawTracks = data.tracks?.items || data.tracks || []
    const total = data.tracks?.total || rawTracks.length

    const tracks = rawTracks.map((track: any) => ({
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      url: track.external_urls.spotify,
      uri: track.uri,
      album: track.album?.name ?? '',
      image: track.album?.images?.[0]?.url ?? '',
      previewUrl: track.preview_url ?? '',
    }))

    return NextResponse.json({
      mood,
      source: 'spotify-app', // Always using app token now
      tracks,
      pagination: {
        total,
        offset,
        limit,
      }
    })
  } catch (err) {
    console.error('Fout bij ophalen Spotify tracks:', err)
    return NextResponse.json({ error: 'Spotify API error', details: String(err) }, { status: 500 })
  }
}
