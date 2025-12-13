import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mood = searchParams.get('mood') || 'vrolijk'

  return NextResponse.json({
    mood,
    recommendations: [
      {
        title: `Voorbeeld muziek voor ${mood}`,
        youtube: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ],
  })
}
