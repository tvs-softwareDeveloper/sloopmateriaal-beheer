# Sessie 2026-10-28 — Stand en overdracht

## Update 28-10 avond (persoonlijke laptop, `C:\eigen projecten\sloopmateriaal-beheer`)

- **D13 gebouwd als combinatie A+B** (B-018 in [[02 - Besluitenlog]]): woordgroepen in `smartSearch.ts`, nieuwe route
  `POST /ai/narrow` (`narrowResults.ts`, `candidates.ts`), en in de frontend `matchesGroups`, `narrowWithAi`, een chip per
  woordgroep en een chip "Weggelaten door AI".
- **Tests:** backend 78/78, frontend 18/18. Typecheck en build schoon. `npm install` gedraaid in beide mappen (`openai` ontbrak).
- **Database thuis:** `backend/.env` stond nog op de oude gehoste database van de Emergis-versie (filess.io, niet meer te
  bereiken). Nu lokale MySQL80, database `develop_materials_app`; de oude regels staan als `# old:` in `.env`. Die database
  bestond al met 1 eigen materiaal en een oude tabel: migratie `001_recycled_status.sql` gedraaid, daarna `db:seed` (41 materialen).
- **Sleutel:** Tristan maakte een nieuwe OpenAI-sleutel voor deze laptop (een sleutel is maar één keer te zien). `AI ON`.
- **Gemeten (M-005):** A 21/26 zonder valse treffers; B streept in losse tests precies de verkeerde kandidaten weg. In de
  browser gecontroleerd met "pannen om mee te koken". Meetscript: `npm run eval:search` in `frontend/`.
- **Instructie aangescherpt (M-006):** testvragen A 23/26 (was 21), controlevragen 5/5. Wel: B haalde bij "ramen" de
  aluminium kozijnen weg, en "elektra" gaf een andere groep met de boiler erbij. Niet verder geschaafd op dezelfde vragen.
- **Servers:** backend en frontend draaien in de Terminal-tabs van de Claude-app.
- Niet gecommit (Tristan commit zelf).

Hieronder de stand van overdag op de werklaptop.

> Eind van de dag op de werklaptop. Tristan gaat thuis verder. **Lees dit eerst**, daarna [[01 - Plan van aanpak AI-koppeling]].

## ⚠️ Vóór je van laptop wisselt

**Niets is gecommit.** Alles van vandaag staat alleen op de werklaptop (`C:\Users\tristan\GamesDev\sloopmateriaal-beheer`), ook
deze vault. Tristan commit en pusht zelf (B-010). Doe dat vóór je weggaat, anders is het thuis niet terug te vinden.

De OpenAI-sleutel zit **niet** in git (`backend/.env` wordt genegeerd). Thuis heb je hem opnieuw nodig, zie hieronder.

## Wat er af is

| | Stand |
|---|---|
| Fase 0 | OpenAI-account, project `sloopmateriaal-beheer`, $5 tegoed, automatisch bijkopen uit, sleutel in `backend/.env` |
| Fase 1 | AI-laag in de backend (`backend/src/ai/`), rooktest `npm run ai:ping`, kostenlog, limiet per minuut, status `recycled`, 40 demomaterialen |
| Fase 2 | `POST /ai/analyze-photo`: foto → voorstel voor het formulier (strict schema, base64, `store: false`) |
| Fase 3 | "Vul in met AI" + "Nieuw via foto" (camera of galerij), AI-labels, telefoon via `npm run dev:phone` |
| Extra | **Tellen per bundel** (lagen × breedte, de code rekent) en **Terra voor foto's**: plankenstapel 174–180 tegen echt 168 |
| Fase 4 | `POST /ai/search`: vraag → filters. Project/locatie als enum van de bestaande namen |
| Fase 5 | "✨ Slim zoeken" op de materialenpagina, chips, uitleg van de AI |
| Extra | **Betrouwbaar zoeken:** woordvormen (staal/stalen), vangnet voor het type, `temperature 0`, cache van 10 min |

**Tests:** backend 64/64 (`npm test` in `backend/`), frontend 13/13 (`npm test` in `frontend/`). Builds schoon.
**Kosten tot nu toe:** minder dan $0,10 van de $5.

**Bestaande bugs die onderweg zijn gefixt:**
- onzichtbare knoppen in de lichte modus, en grijze knoppen bij hover (`index.css`);
- chips waren niet weg te klikken;
- foto's gingen kapot na het bewerken van een materiaal;
- de server negeerde "poort bezet" en draaide stil oude code.

Details per fase staan in het plan, de keuzes in [[02 - Besluitenlog]] (B-001 t/m B-017) en de metingen in
[[04 - Meetresultaten]] (M-001 t/m M-004).

## Wat er openstaat (in deze volgorde)

1. **D13 — synoniemen (besluit van Tristan nodig).**
   - Nu vindt slim zoeken 10 van de 23 verwachte materialen bij synoniemvragen ("verlichting" vindt "Lichtarmaturen" niet).
   - **Advies: route A**: de AI bedenkt synoniemgroepen, de code zoekt "één uit elke groep", de voorraad blijft lokaal.
     Gemeten 20–21/23.
   - Niet B (alles naar de AI, Tristans idee: 19/23, maar de hele voorraad bij elke vraag naar OpenAI en niet schaalbaar), en
     niet C (embeddings: 10/23).
   - Zie M-004.
   - **Model: Sonnet 5.5 · medium** — prompt, schema en matching op bestaande code; een fout geeft een verkeerd zoekresultaat, geen schade.
2. **Fase 7 — demo en gesprek voorbereiden.**
   - README "AI-functies", draaiboek van 2 minuten, gesprekspunten, "wat ik in productie anders zou doen".
   - Demovraag: gebruik "goedkoopste radiatoren" of "kun je alle stalen materialen zoeken", niet de vraag over Zwolle (die
     geeft 0 resultaten).
   - **Model: Sonnet 5.5 · medium**.
3. **Fase 6 — meten** met 20 eigen foto's van Tristan (D8). **Model: Opus 5.5 · medium**.
4. **Op de telefoon testen** (S22). Nog nooit gedaan.

## Thuis opzetten (andere laptop)

1. `git pull` (na de commit en push hierboven).
2. `npm install` in `backend/` én in `frontend/`.
3. **MySQL:** maak de database `develop_materials_app` en voer `backend/database.sql` uit. Die bevat `recycled` al, dus de
   migratie in `backend/migrations/` is niet nodig.
4. **`backend/.env`:** kopieer `backend/.env.example` en vul in:
   - je MySQL-gegevens;
   - `OPENAI_API_KEY`: de sleutel is niet terug te halen bij OpenAI. Neem hem veilig mee (bv. via een wachtwoordmanager),
     of maak thuis een nieuwe in het project `sloopmateriaal-beheer` op platform.openai.com. Nooit in git of in de chat;
   - laat `PUBLIC_HOST` leeg;
   - `AI_MODEL_PHOTO=gpt-6.1-terra` en `AI_MODEL_SEARCH=gpt-6-luna` staan al in het voorbeeld.
5. **Demodata:** `npm run db:seed` in `backend/`.
6. **Starten:** `npm run dev` in `backend/` (de log moet `AI ON: photo=gpt-6.1-terra search=gpt-6-luna` tonen) en
   `npm run dev` in `frontend/` → http://localhost:5173.
7. **Controle:** `npm run ai:ping` in `backend/` (kost minder dan 1 cent) en `npm test` in beide mappen.

## Valkuilen

- **"app crashed" met `EADDRINUSE`** na een herstart van nodemon: er draait nog een oude Node-server op poort 3000. Stop dat
  proces (`netstat -ano | findstr :3000`, dan `taskkill /PID <pid> /F`).
- **Telefoon bereikt de laptop niet:** Windows-firewall ("privé netwerk" toestaan) of een wifi die apparaten van elkaar
  scheidt. Een hotspot werkt wel.
- **De experimentscripts van vandaag** (tellen, zoeken, synoniemen, browsertests) stonden in een tijdelijke map van Claude
  en zijn thuis **niet** beschikbaar. De uitkomsten staan in [[04 - Meetresultaten]]. Fase 6 zet echte evaluatiescripts in
  `backend/eval/`.
- **Browsercontrole:** de in-app browser van Claude crasht op de werklaptop. Gebruik headless Edge via `playwright-core`
  (zie `CLAUDE.md`).
