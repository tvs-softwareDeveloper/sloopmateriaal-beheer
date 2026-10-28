# Sloopmateriaal-beheer — CLAUDE.md

Webapp om sloopmateriaal een tweede leven te geven (React/Vite-frontend, Express/MySQL-backend). Zie `README.md`.

## Eerst lezen

De documentatie staat in de Obsidian-vault `sloop-vault/`. Begin bij de nieuwste `Sessie ... - Stand en overdracht.md`.
Daarna:
- `00 - Overzicht.md`: wat de app is en waar alles in de code staat
- `01 - Plan van aanpak AI-koppeling.md`: het lopende plan, met besluiten D1–D10 bovenaan en per fase het model
- `02 - Besluitenlog.md`: vaste keuzes, niet opnieuw bediscussiëren

Werk altijd de fase uit die in het plan op ⏳ NEXT staat. Meld aan het eind van een fase welk model de volgende vraagt.
Begin nooit stil aan een fase die een ander model vraagt dan het huidige.

## Werkafspraken

- Volg de stijl die al in het bestand staat. Backend-code en comments in het Engels: kort en gewoon.
- **Elk nieuw bestand begint met een korte comment over zijn verantwoordelijkheid**: wat het bestand doet, in 1 à 3 regels.
- **Geen verwijzingen naar het plan, fases of besluiten in de code** (dus niet `ai plan`, `phase 2`, `D2` of `B-003`).
  Een comment legt uit wat de code doet en waarom; die geschiedenis hoort in de vault.
- Bij een niet-vanzelfsprekende wijziging in bestaande code: een korte comment over het waarom.
- **Nooit code verwijderen**: wat weg moet wordt uitgecommentarieerd (`// old: ...`).
- Elke nieuwe zichtbare tekst meteen in **NL én EN** (`frontend/src/components/LanguageContext.tsx`).
- **Tristan commit en pusht zelf.** Niet committen en er ook niet om vragen.
- Besluiten in het plan: geen reactie van Tristan = akkoord met het advies.

## OpenAI-sleutel

- De sleutel staat alleen in `backend/.env` (`OPENAI_API_KEY`) en nooit in de frontend: alles met `VITE_` komt in de browser terecht.
- **Nooit de sleutel tonen, loggen of uitlezen**. Controleer alleen of de regel bestaat, met naam en lengte.
- Tests praten nooit met OpenAI: ze gebruiken een nep-sleutel of een nep-client.

## Commando's

Backend (`backend/`):
- `npm run dev`: server op http://localhost:3000. Met sleutel staat er `AI ON` in de log.
- `npm test`: vitest
- `npm run typecheck`: `tsc --noEmit`
- `npm run ai:ping`: rooktest tegen OpenAI. Kost een fractie van een cent: alleen draaien als dat nodig is.
- `npm run db:seed`: 40 demomaterialen. Vervangt alleen de eigen `MAT-SEED-`-rijen.
- `npm run sql -- migrations/<bestand>.sql`: een migratie draaien

Frontend (`frontend/`):
- `npm run dev`: http://localhost:5173
- `npm run dev:phone`: hetzelfde, maar ook bereikbaar vanaf een telefoon op dezelfde wifi (zie README)
- `npm run build`: typecheck plus build
- `npm test`: vitest (zoeken en filteren, `frontend/tests/`)

Controle in een browser: gebruik headless Edge via `playwright-core`, in een scratchpad-map en niet in het project.
De in-app browser van Claude crasht op deze laptop.

## Database

MySQL 8 (Windows-service MySQL80 op de werklaptop). Het schema staat in `backend/database.sql`.
Elke schemawijziging krijgt een eigen bestand in `backend/migrations/` en wordt ook in `database.sql` bijgewerkt.
