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

// Doel-ranges voor Spotify audio features per mood
const moodAudioTargets: Record<
  string,
  { minValence?: number; maxValence?: number; minEnergy?: number; maxEnergy?: number }
> = {
  blij: { minValence: 0.7, minEnergy: 0.7 },
  energiek: { minValence: 0.6, minEnergy: 0.8 },
  relaxed: { minValence: 0.4, maxValence: 0.7, maxEnergy: 0.45 },
  verdrietig: { maxValence: 0.4, maxEnergy: 0.4 },
  romantisch: { minValence: 0.5, maxValence: 0.7, minEnergy: 0.4, maxEnergy: 0.7 },
  boos: { maxValence: 0.5, minEnergy: 0.7 },
  neutraal: { minValence: 0.45, maxValence: 0.55, minEnergy: 0.45, maxEnergy: 0.55 },
  dromerig: { minValence: 0.5, maxValence: 0.7, minEnergy: 0.3, maxEnergy: 0.6 },
  gestrest: { maxValence: 0.6, maxEnergy: 0.35 },
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
    const { minValence, maxValence, minEnergy, maxEnergy } = targets
    if (typeof minValence === 'number') params.set('min_valence', String(minValence))
    if (typeof maxValence === 'number') params.set('max_valence', String(maxValence))
    if (typeof minEnergy === 'number') params.set('min_energy', String(minEnergy))
    if (typeof maxEnergy === 'number') params.set('max_energy', String(maxEnergy))

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
