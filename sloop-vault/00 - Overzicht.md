# Sloopmateriaal-beheer — Overzicht

> Aangemaakt 28-10-2026. Startpunt van de vault: lees dit eerst, daarna [[01 - Plan van aanpak AI-koppeling]].
> **Laatste stand en hoe je thuis verder gaat:** [[Sessie 2026-10-28 - Stand en overdracht]].

## Wat is de app

Een webapp om materialen die vrijkomen bij sloop een tweede leven te geven. Per materiaal leg je soort, hoeveelheid,
conditie, locatie, prijs, project en foto's vast. Elk materiaal krijgt een QR-code die je kunt afdrukken en scannen.

- **Frontend** (`frontend/`): React 19, TypeScript, Vite, Tailwind, Radix UI, TanStack Query, Recharts. Talen: NL en EN
  (`frontend/src/components/LanguageContext.tsx`).
- **Backend** (`backend/`): Node, Express 5, TypeScript, MySQL (`mysql2`), Multer voor foto-uploads (`backend/public/uploads/`).
- **Database:** één tabel `materials` (`backend/database.sql`).
- **Geen login.** Prima voor een lokale demo, niet voor online (zie het plan, "Na het gesprek").

## Waar we nu mee bezig zijn

Een **AI-koppeling met de OpenAI API**, zodat Tristan in zijn sollicitatiegesprek (week van 2-11-2026) kan laten zien dat
hij ervaring heeft met AI-API-koppelingen. Twee functies:

1. **Foto → formulier:** je maakt een foto van een materiaal en de AI stelt naam, soort, conditie, eenheid en notities voor.
   Jij controleert en slaat op.
2. **Zoeken in gewone taal:** "houten balken in goede staat van project Zwolle onder 50 euro" wordt omgezet naar de filters
   die de app al heeft.

Het plan staat in [[01 - Plan van aanpak AI-koppeling]], de vaste keuzes in [[02 - Besluitenlog]], en wat Tristan zelf moet
regelen (OpenAI-account, API-sleutel, tegoed) in [[03 - OpenAI-account en API-sleutel]].

## Belangrijkste plekken in de code (stand 28-10-2026)

| Wat | Waar |
|---|---|
| Formulier met foto-upload (max. 5) | `frontend/src/components/materials/MaterialForm.tsx` |
| Filters en zoeken (in de browser) | `frontend/src/Pages/Materials.tsx` (state `filters`, `useMemo` filteredMaterials) |
| Filterpaneel + chips van actieve filters | `frontend/src/components/materials/FilterPanel.tsx` |
| Materiaal als JSON-schema (met enums) | `frontend/src/Entities/Material.json` |
| API-adres van de backend | `frontend/src/components/config.ts` (nu vast `http://localhost:3000`) |
| Upload-route en server | `backend/src/server.ts` |
| CRUD-routes | `backend/src/routes/materials.ts` |
| Instellingen en geheimen | `backend/.env` (kopie van `.env.example`, staat in `.gitignore`) |

## Lokaal starten

Zie `README.md` in de repo. Op de werklaptop draait de Windows-service **MySQL80** (MySQL Server 8.0); `mysql.exe` staat
niet in het PATH maar in `C:\Program Files\MySQL\MySQL Server 8.0\bin\`. `backend/.env` bestond op 28-10-2026 nog niet.
