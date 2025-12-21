import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAppAccessToken } from '@/lib/spotify'

// Mapping van moods naar seed genres (allemaal uit de opgegeven seed-lijst)
const supportedGenres: Record<string, string[]> = {
  blij: ['salsa', 'pop', 'dance'],
  energiek: ['reggaeton', 'edm', 'hip-hop'],
  relaxed: ['bossa-nova', 'jazz', 'study', 'sleep'],
  verdrietig: ['acoustic', 'piano', 'sad'],
  romantisch: ['romance', 'r-n-b', 'soul'],
  boos: ['metal', 'punk', 'rock'],
  neutraal: ['indie', 'indie-pop', 'pop'],
  dromerig: ['ambient', 'new-age', 'post-dubstep'],
  gestrest: ['ambient', 'study', 'sleep'],
}

// Audio feature targets per mood voor de Spotify recommendations API
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
  relaxed: { targetValence: 0.6, targetEnergy: 0.35, minDanceability: 0.3, maxEnergy: 0.45 },
  verdrietig: { targetValence: 0.2, targetEnergy: 0.2 },
  romantisch: { targetValence: 0.65, targetEnergy: 0.5, minDanceability: 0.4 },
  boos: { targetValence: 0.3, targetEnergy: 0.85, minDanceability: 0.5 },
  neutraal: { targetValence: 0.5, targetEnergy: 0.5 },
  dromerig: { targetValence: 0.6, targetEnergy: 0.4, minDanceability: 0.35 },
  gestrest: { targetValence: 0.4, targetEnergy: 0.25, minDanceability: 0.2 },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get('mood')?.toLowerCase() || 'blij';

  const seedGenres = supportedGenres[mood];
  const secret = process.env.NEXTAUTH_SECRET;

  // Probeer gebruikers-token via next-auth
  const token = await getToken({ req, secret });

  const accessToken = token?.accessToken || (await getAppAccessToken());

  if (!seedGenres) {
    // Onbekende mood: meteen fallback naar YouTube
    return NextResponse.json({
      mood,
      source: 'youtube',
      recommendations: [
        {
          title: `Zoekresultaten voor "${mood}" op YouTube`,
          youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            mood + ' muziek'
          )}`,
        },
      ],
    });
  }

  try {
    const params = new URLSearchParams({
      seed_genres: seedGenres.join(','),
      limit: '8',
    })

    // Voeg audio feature targets toe op basis van mood
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

    const res = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) throw new Error(`Spotify API fout: ${res.statusText}`);

    const data = await res.json();

    const tracks = data.tracks.map((track: any) => ({
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      url: track.external_urls.spotify,
    }));

    return NextResponse.json({
      mood,
      source: token?.accessToken ? 'spotify-user' : 'spotify-app',
      tracks,
    });
  } catch (err) {
    console.error('Fout bij ophalen Spotify tracks:', err);

    // Fallback response zodat frontend niet crasht
    return NextResponse.json({
      mood,
      source: 'youtube-fallback',
      recommendations: [
        {
          title: `Zoekresultaten voor "${mood}" op YouTube`,
          youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            mood + ' muziek'
          )}`,
        },
      ],
    });
  }
}
