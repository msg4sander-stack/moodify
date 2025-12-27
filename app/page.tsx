'use client'

import { useEffect, useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import MoodGrid from '@/app/components/MoodGrid'
import { translations } from '@/lib/translations'
import { allowedSeedGenres } from '@/lib/spotifySeeds'
import { countries } from '@/lib/countries'

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
  const [selectedSeed, setSelectedSeed] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')

  useEffect(() => {
    const langCode = navigator.language.slice(0, 2)
    if (Object.keys(translations).includes(langCode)) {
      setLang(langCode as keyof typeof translations)
    }

    // Auto-detect region
    const countryCode = navigator.language.split('-')[1]?.toUpperCase()
    if (countryCode && countries[countryCode]) {
      setSelectedMarket(countryCode)
    } else {
      // Fallback to lang code if it maps to a country (e.g. NL, DE, not EN)
      const langUpper = langCode.toUpperCase()
      if (countries[langUpper]) {
        setSelectedMarket(langUpper)
      } else {
        setSelectedMarket('US') // Default fallback
      }
    }
  }, [])

  const t = translations[lang]
  const connecting = status === 'loading'
  const isAuthed = status === 'authenticated'
  const statusLabel = connecting ? 'Authenticeren...' : isAuthed ? 'Ingelogd' : 'Niet ingelogd'

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
            <div className="text-sm text-zinc-300 flex items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${connecting ? 'bg-amber-400' : isAuthed ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
              />
              {statusLabel}
            </div>
            <button
              onClick={() => (isAuthed ? signOut() : signIn('spotify'))}
              disabled={connecting}
              className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isAuthed ? 'Log uit' : 'Log in met Spotify'}
            </button>
          </div>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur">
          <div>
            <div className="md:flex md:gap-4 mb-4">
              <div className="flex-1 mb-4 md:mb-0">
                <label className="block text-sm font-semibold mb-2">Regio / Land</label>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full p-3 rounded-lg bg-neutral-900 border border-white/10 focus:border-emerald-400 focus:outline-none"
                >
                  {Object.entries(countries).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">Muziekgenre (optioneel)</label>
                <select
                  value={selectedSeed}
                  onChange={(e) => setSelectedSeed(e.target.value)}
                  className="w-full p-3 rounded-lg bg-neutral-900 border border-white/10 focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">{lang === 'nl' ? 'Kies automatisch op basis van stemming' : 'Auto (based on mood)'}</option>
                  {allowedSeedGenres.map((seed) => (
                    <option key={seed} value={seed}>
                      {seed}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

        {selectedMood && <MoodGrid mood={selectedMood} seed={selectedSeed || undefined} market={selectedMarket} />}

      </div>
    </main>
  )
}
