import { NextResponse } from "next/server";
import { getAppAccessToken } from "@/lib/spotify";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get("mood") || "vrolijk";

  const genres: Record<string, string[]> = {
    vrolijk: ["happy", "pop"],
    rustig: ["chill", "acoustic"],
    romantisch: ["romance", "rnb"],
    energiek: ["dance", "edm"],
    verdrietig: ["sad", "piano"],
  };

  const seedGenres = genres[mood] || ["pop"];
  const token = await getAppAccessToken();

  const res = await fetch(
    `https://api.spotify.com/v1/recommendations?seed_genres=${seedGenres.join(
      ","
    )}&limit=8`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();
  return NextResponse.json({ tracks: data.tracks });
}
