export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Gebruiksvoorwaarden</h1>

      <p className="mb-4">
        Door gebruik te maken van Moodify, ga je akkoord met deze voorwaarden.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Doel van de app</h2>
      <p className="mb-4">
        Moodify is een experimentele applicatie die muziek aanbeveelt op basis van stemming en muziekgenre, via de Spotify API.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Geen garantie</h2>
      <p className="mb-4">
        Deze app wordt aangeboden "zoals het is". We garanderen geen beschikbaarheid, nauwkeurigheid of prestaties van aanbevelingen.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Beperkingen</h2>
      <p className="mb-4">
        Je mag deze app niet gebruiken voor commerciële doeleinden zonder toestemming.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Inloggen met Spotify</h2>
      <p className="mb-4">
        Inloggen is optioneel. Indien je inlogt, geef je Moodify toestemming om tijdelijk jouw Spotify toegangstoken te gebruiken voor het ophalen van gepersonaliseerde aanbevelingen.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Wijzigingen</h2>
      <p className="mb-4">
        Deze voorwaarden kunnen op elk moment worden aangepast. Raadpleeg deze pagina voor de meest actuele versie.
      </p>
    </div>
  );
}
