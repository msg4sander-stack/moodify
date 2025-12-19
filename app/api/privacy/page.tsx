export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Privacyverklaring</h1>

      <p className="mb-4">
        Moodify maakt gebruik van de Spotify API om muziek aan te bevelen op basis van stemming en genre. 
        Wij hechten veel waarde aan jouw privacy en beperken het gebruik van persoonlijke gegevens tot een minimum.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Welke gegevens verzamelen we?</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Alleen een tijdelijk toegangstoken via Spotify OAuth (indien je inlogt)</li>
        <li>Geen gebruikersnamen, e-mailadressen of opgeslagen data</li>
        <li>Gegevens worden uitsluitend gebruikt om aanbevelingen te genereren</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Delen we je gegevens?</h2>
      <p className="mb-4">
        Nee. Moodify deelt of verkoopt geen gegevens aan derden.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Opslag</h2>
      <p className="mb-4">
        Wij slaan geen gegevens op. Alle data wordt verwerkt in real-time tijdens je sessie.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Contact</h2>
      <p>
        Voor vragen of opmerkingen kun je contact opnemen via GitHub of het contactformulier (indien beschikbaar).
      </p>
    </div>
  );
}
