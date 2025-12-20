'use client';

import { useEffect, useState } from 'react';
import { translations } from '@/lib/translations';
import MoodGrid from '@/app/components/MoodGrid'; // ✅ import toevoegen

const genres = ['Pop', 'Rock', 'Salsa', 'Bachata', 'Jazz', 'Hip-Hop'];
const moods = ['Vrolijk', 'Verdrietig', 'Energiek', 'Romantisch', 'Rustig'];

export default function HomePage() {
  const [lang, setLang] = useState<keyof typeof translations>('en');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLang(getUserLang());
  }, []);

  const t = translations[lang];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center text-white">
      <div className="bg-white/10 p-8 rounded-lg shadow-lg backdrop-blur-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">{t.welcome}</h1>

        {/* Genre Combo Box */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Music genre</label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full p-2 rounded text-black"
          >
            <option value="">{lang === 'nl' ? 'Selecteer een genre' : 'Select a genre'}</option>
            {genres.map((genre) => (
              <option key={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* Mood Combo Box */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">{t.mood}</label>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="w-full p-2 rounded text-black"
          >
            <option value="">{lang === 'nl' ? 'Selecteer een stemming' : 'Select a mood'}</option>
            {moods.map((mood) => (
              <option key={mood}>{mood}</option>
            ))}
          </select>
        </div>

        {/* Submit knop */}
        <button
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded font-semibold"
          onClick={() => {
            if (!selectedGenre || !selectedMood) {
              alert('Selecteer beide velden');
              return;
            }
            setSubmitted(true);
          }}
        >
          {lang === 'nl' ? 'Zoek muziek' : 'Find music'}
        </button>
      </div>

      {/* Render resultaten */}
      {submitted && (
        <div className="mt-8 w-full max-w-3xl">
          <MoodGrid mood={selectedMood.toLowerCase()} />
        </div>
      )}
    </main>
  );
}

// Helper functie
const getUserLang = (): keyof typeof translations => {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language.slice(0, 2);
  return (Object.keys(translations) as Array<keyof typeof translations>).includes(lang as any)
    ? (lang as keyof typeof translations)
    : 'en';
};
