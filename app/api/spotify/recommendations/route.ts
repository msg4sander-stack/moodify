import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getAppAccessToken } from '@/lib/spotify';

const supportedGenres: Record<string, string[]> = {
  vrolijk: ['happy', 'pop'],
  rustig: ['chill', 'acoustic'],
  romantisch: ['romance', 'rnb'],
  energiek: ['dance', 'edm'],
  verdrietig: ['sad', 'piano'],
  salsa: ['salsa', 'latin'],
  hardrock: ['hard-rock', 'metal'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get('mood')?.toLowerCase() || 'vrolijk';

  const seedGenres = supportedGenres[mood];
  const secret = process.env.NEXTAUTH_SECRET;

  // Probeer gebruikers-token via next-auth
  const token = await getToken({ req, secret });

  const accessToken = token?.accessToken || (await getAppAccessToken());

  if (!seedGenres) {
    // Onbekende mood → meteen fallback YouTube
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
    const res = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_genres=${seedGenres.join(',')}&limit=8`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
