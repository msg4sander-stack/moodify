import MoodGrid from "@/app/components/MoodGrid"

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Moodify 🎧</h1>
      <MoodGrid />
    </main>
  )
}
