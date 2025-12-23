export async function getAppAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify client credentials');
  }
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error("Spotify token error", res.status, res.statusText, errorText);
    throw new Error(`Failed to fetch Spotify app token (${res.status})`);
  }

  const data = await res.json().catch(() => ({}));
  const token = (data as any).access_token;

  if (typeof token !== "string" || !token) {
    throw new Error("Invalid Spotify app token response");
  }

  return token;
}
