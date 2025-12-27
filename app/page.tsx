'use client'

import { useEffect, useState, useRef } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import MoodGrid from '@/app/components/MoodGrid'
import { translations } from '@/lib/translations'
import { allowedSeedGenres } from '@/lib/spotifySeeds'
import { countries } from '@/lib/countries'

const moods = [
  { value: 'happy', label: '\u{1F604} Blij' },
  { value: 'energetic', label: '\u{1F4AA} Energiek' },
  { value: 'relaxed', label: '\u{1F60C} Relaxed' },
  { value: 'sad', label: '\u{1F622} Verdrietig' },
  { value: 'romantic', label: '\u2764\uFE0F Romantisch' },
  { value: 'angry', label: '\u{1F620} Boos' },
  { value: 'neutral', label: '\u{1F636} Neutraal' },
  { value: 'dreamy', label: '\u2728 Dromerig' },
  { value: 'stressed', label: '\u{1F92F} Gestrest' },
]

export default function HomePage() {
  const { status } = useSession()
  const [lang, setLang] = useState<keyof typeof translations>('en')
  const [selectedMood, setSelectedMood] = useState('')
  const [selectedSeed, setSelectedSeed] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [marketSearch, setMarketSearch] = useState('')
  const [isMarketOpen, setIsMarketOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMarketOpen(false)
        // Reset search if no selection made or just cleanup
        setMarketSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCountries = Object.entries(countries).filter(([code, name]) =>
    name.toLowerCase().includes(marketSearch.toLowerCase())
  )

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
            <img src="/moodify-logo.svg" alt="Moodify logo" className="w-14 h-14" />
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
                <div className="relative" ref={dropdownRef}>
                  {selectedMarket && (
                    <img
                      src={`https://flagcdn.com/w40/${selectedMarket.toLowerCase()}.png`}
                      alt={selectedMarket}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-6 rounded shadow-sm z-10"
                    />
                  )}
                  <input
                    type="text"
                    className={`w-full p-3 rounded-lg bg-neutral-900 border border-white/10 focus:border-emerald-400 focus:outline-none ${selectedMarket ? 'pl-12' : ''
                      }`}
                    placeholder={lang === 'nl' ? 'Zoek land...' : 'Search country...'}
                    value={
                      isMarketOpen
                        ? marketSearch
                        : selectedMarket && countries[selectedMarket]
                          ? countries[selectedMarket]
                          : ''
                    }
                    onFocus={() => {
                      setIsMarketOpen(true)
                      setMarketSearch('')
                    }}
                    onChange={(e) => {
                      setMarketSearch(e.target.value)
                      setIsMarketOpen(true)
                    }}
                  />
                  {isMarketOpen && (
                    <ul className="absolute z-50 w-full mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.slice(0, 50).map(([code, name]) => (
                          <li
                            key={code}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedMarket(code)
                              setMarketSearch('')
                              setIsMarketOpen(false)
                            }}
                          >
                            <img
                              src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                              alt={name}
                              className="w-6 h-auto rounded shadow-sm"
                            />
                            <span>{name}</span>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-zinc-500 italic">No results found</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">Muziekgenre</label>
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

        {selectedMood && <MoodGrid mood={selectedMood} seed={selectedSeed || undefined} market={selectedMarket} lang={lang} />}

      </div>
    </main>
  )
}
