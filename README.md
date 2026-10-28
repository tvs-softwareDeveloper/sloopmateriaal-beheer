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

De frontend praat met de backend via het adres in `frontend/src/components/config.ts`. Standaard is dat poort 3000 op
dezelfde machine waarop je de app opent. Met `VITE_API_URL` in `frontend/.env.local` kies je een ander adres.

## Testen op je telefoon

Laptop en telefoon moeten op hetzelfde wifi-netwerk zitten.

1. Laat `PUBLIC_HOST` in `backend/.env` leeg. De foto-adressen volgen dan het adres waarop je de app opent.
2. Start de backend (`npm run dev` in `backend/`) en de frontend met `npm run dev:phone` in `frontend/`.
   Vite laat dan een `Network`-adres zien, bijvoorbeeld `http://192.168.1.23:5173`.
3. Open dat adres op je telefoon. De app praat dan vanzelf met `http://192.168.1.23:3000`.

Vraagt Windows bij de eerste start of Node.js het netwerk op mag, kies dan **privé netwerk**. Laadt de pagina niet op je
telefoon, dan blokkeert de firewall of het wifi-netwerk het verkeer tussen apparaten. Dat gebeurt vaak op bedrijfs- of
gastennetwerken; een hotspot van je telefoon werkt dan wel.
