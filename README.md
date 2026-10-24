# Sloopmateriaal-beheer

Een webapp om materialen die vrijkomen bij sloop een tweede leven te geven. Per materiaal leg je de soort, hoeveelheid, conditie, locatie, prijs, het project en foto's vast. Elk materiaal krijgt een eigen QR-code, die je kunt downloaden, afdrukken en met de camera scannen om het meteen terug te vinden.

## Functies

- Statussen per materiaal: beschikbaar, gereserveerd, te koop, voor hergebruik, voor afvoer, verkocht en afgevoerd
- Dashboard met voorraadwaarde, omzet en grafieken per status, soort en conditie
- Zoeken, filteren en sorteren, en meerdere materialen tegelijk bijwerken of verwijderen
- Importeren en exporteren als CSV, Excel of JSON
- Nederlands en Engels

## Techniek

- **Frontend** (`frontend/`): React, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, Recharts
- **Backend** (`backend/`): Node.js, Express, TypeScript, MySQL, Multer voor uploads

## Lokaal starten

Nodig: Node.js en een MySQL-server. Maak een database aan en daarin de tabel uit `backend/database.sql`.

```bash
cd backend
npm install
cp .env.example .env   # vul je eigen databasegegevens in
npm run dev            # http://localhost:3000
```

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

De frontend praat met de backend via het adres in `frontend/src/components/config.ts`.
