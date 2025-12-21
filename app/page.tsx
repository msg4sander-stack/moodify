'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import MoodGrid from '@/app/components/MoodGrid'
import { translations } from '@/lib/translations'

const moods = [
  { value: 'blij', label: '\u{1F604} Blij' },
  { value: 'energiek', label: '\u{1F4AA} Energiek' },
  { value: 'relaxed', label: '\u{1F60C} Relaxed' },
  { value: 'verdrietig', label: '\u{1F622} Verdrietig' },
  { value: 'romantisch', label: '\u2764\uFE0F Romantisch' },
  { value: 'boos', label: '\u{1F620} Boos' },
  { value: 'neutraal', label: '\u{1F636} Neutraal' },
  { value: 'dromerig', label: '\u2728 Dromerig' },
  { value: 'gestrest', label: '\u{1F92F} Gestrest' },
]

export default function HomePage() {
  const { status } = useSession()
  const [lang, setLang] = useState<keyof typeof translations>('en')
  const [selectedMood, setSelectedMood] = useState('')

  useEffect(() => {
    const langCode = navigator.language.slice(0, 2)
    if (Object.keys(translations).includes(langCode)) {
      setLang(langCode as keyof typeof translations)
    }
  }, [])

  const t = translations[lang]
  const connecting = status === 'loading'
  const isAuthed = status === 'authenticated'

  return (
    <main className="min-h-screen bg-neutral-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-fuchsia-600/10 to-neutral-900 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.35)] grid place-items-center">
              <img src="/moodify-logo.svg" alt="Moodify logo" className="w-12 h-12" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Moodify</p>
              <h1 className="text-3xl font-bold leading-tight">{t.welcome}</h1>
              <p className="text-sm text-zinc-300 mt-1">
                Kies je stemming, verbind en ontdek tracks die erbij passen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-300">
              {connecting
                ? 'Verbinden met Spotify...'
                : isAuthed
                  ? 'Verbonden met Spotify'
                  : 'Log in om Spotify-tracks te gebruiken'}
            </div>
            <button
              onClick={() => signIn('spotify')}
              disabled={connecting || isAuthed}
              className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isAuthed ? 'Verbonden' : t.login}
            </button>
          </div>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur">
          <details className="group cursor-pointer">
            <summary className="flex items-center justify-between text-sm font-semibold text-white">
              Spotify Developer Terms (v10) - korte samenvatting
              <span className="text-xs text-emerald-300 ml-2 group-open:hidden">uitklappen</span>
              <span className="text-xs text-emerald-300 ml-2 hidden group-open:inline">inklappen</span>
            </summary>
            <div className="mt-3 text-sm text-zinc-200 space-y-2 leading-relaxed">
              <p>Door te verbinden met je Spotify-account ga je akkoord met de Spotify Developer Terms (15 mei 2025).</p>
              <ul className="list-disc list-inside space-y-1 text-zinc-300">
                <li>Gebruik is gebonden aan privacyregels en alleen voor jouw sessie.</li>
                <li>Geen verkoop of delen van jouw data; enkel nodig voor aanbevelingen.</li>
                <li>Spotify kan toegang beperken of beeindigen bij misbruik.</li>
                <li>Volledige tekst beschikbaar via Spotify Developer Terms.</li>
              </ul>
              <a
                className="inline-block text-emerald-300 underline"
                href="https://developer.spotify.com/terms"
                target="_blank"
                rel="noreferrer"
              >
                Bekijk volledige voorwaarden
              </a>
            </div>
          </details>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur">
          <div>
            <label className="block text-sm font-semibold mb-2">{t.mood}</label>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full p-3 rounded-lg bg-neutral-900 border border-white/10 focus:border-emerald-400 focus:outline-none"
            >
              <option value="">{lang === 'nl' ? 'Selecteer een stemming' : 'Select a mood'}</option>
              {moods.map((mood) => (
                <option key={mood.value} value={mood.value}>
                  {mood.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {selectedMood && <MoodGrid mood={selectedMood} />}
      </div>
    </main>
  )
}
