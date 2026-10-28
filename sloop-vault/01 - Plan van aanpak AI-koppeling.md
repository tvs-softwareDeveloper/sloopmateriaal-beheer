# Sloopmateriaal-beheer — Plan van aanpak: AI-koppeling (OpenAI)

> Versie 1.0 — 28-10-2026
> Status: ✅ **Fase 0 t/m 5 af (28-10-2026)**: beide AI-functies werken in de app, plus de telverbetering (B-011, B-012).
> Tristan testte de foto-demo op de laptop. Slim zoeken is nog niet door Tristan geprobeerd, en niets is op zijn telefoon getest.
> Tristan commit en pusht zelf. Fase 6 (meten, **Opus 5.5 · medium**) is NEXT; voor de demo kan fase 7 ook eerst.
> Doel: in de week van 2-11-2026 in een sollicitatiegesprek een werkende AI-koppeling laten zien, plus het verhaal erachter:
> waarom zo gebouwd, wat het kost, en hoe goed het werkt (gemeten).
> Achtergrond: [[00 - Overzicht]] · vaste keuzes: [[02 - Besluitenlog]] · jouw stappen voor de sleutel: [[03 - OpenAI-account en API-sleutel]]

---

## ⚠️ BESLUITEN — DIT EERST LEZEN

🔴 **NOG TE BEANTWOORDEN.** Geen reactie = akkoord met het advies. Per besluit staat erbij vóór welke fase het nodig is.
🟢 **D2 en D10 = het advies** (fase 1 gestart zonder reactie, 28-10-2026), gebouwd en vastgelegd als B-004 en B-005 in
[[02 - Besluitenlog]]. **D3:** de rooktest heeft de tokens per foto gemeten (zie §2, Kosten); de keuze blijft `high`, en fase 6 meet de kwaliteit.
🟢 **D3 en D4 = het advies** (fase 2 gestart zonder reactie, 28-10-2026), gebouwd en vastgelegd als B-006 en B-007.
🟢 **D5 en D9 = het advies** (fase 3 gestart zonder reactie, 28-10-2026), gebouwd en vastgelegd als B-008 en B-009.
🟢 **D11 en D12 akkoord van Tristan** (28-10-2026), gebouwd en vastgelegd als B-011 en B-012. Daarmee is D1 voor foto's
beantwoord: Terra. Nameting: Terra telt de plankenstapel 5× binnen 174–180, en echt zijn het er 168 ([[04 - Meetresultaten]]).
🟢 **D6 en D7 = het advies** (fase 4 gestart zonder reactie, 28-10-2026), gebouwd en vastgelegd als B-013 en B-014.
🟢 **D13: Tristan koos een combinatie van A en B** (28-10-2026, avond): eerst woordgroepen (A), daarna kiest Luna uit de
gevonden kandidaten (B, maar alleen naam en type van max. 50). Gebouwd en vastgelegd als B-018, gemeten in M-005.

| # | Besluit | Mijn advies | Nodig vóór |
|---|---|---|---|
| **D1** | Welk model per functie? (jouw vraag over **GPT-6.1 Terra**) | **Zoeken: altijd Luna.** Tekst omzetten naar filters is een simpele taak met veel aanroepen, daar voegt Terra niets toe. **Foto's: we beginnen met Luna en meten in fase 6 Luna tegen Terra op dezelfde 20 foto's.** Terra is gemaakt voor beeld (OpenAI noemt "productfoto's koppelen aan een catalogus" letterlijk als toepassing), maar kost 10× zoveel ($1 / $5 per 1M tokens tegen $0,10 / $0,50). Terra wordt het alleen als hij duidelijk beter scoort, bijvoorbeeld minstens 3 van de 20 foto's meer goed op soort + conditie. Wisselen is één regel in `.env` | fase 6 (de bouw werkt met elk model) |
| **D2** | De status `recycled` bestaat maar half: wel in de TS-types, `Material.json`, de vertalingen en de kaartkleur, **niet** in de ENUM van de database en niet in het formulier. Opslaan met die status gaat mis | **Afmaken:** toevoegen aan de database-ENUM (`ALTER TABLE`) en aan de lijsten in formulier, filter en bulk-update. Voor sloopmateriaal is "gerecycled" een echte eindstatus naast "afgevoerd", en vertaling en kleur bestaan al | fase 1 |
| **D3** | Hoe scherp sturen we de foto mee (`detail`)? | **`high`**: de foto past dan in 2048 × 2048 px, maximaal ~3.000 tokens per foto. Scheuren, roest en verf blijven zichtbaar en dat is nodig voor de conditie. `low` (512 px, ~300 tokens) meten we in fase 6 als goedkoper alternatief. **Nooit `auto`**: dat is bij deze modellen de originele resolutie, en een telefoonfoto kost dan ~14.000 tokens | fase 2 |
| **D4** | Welke velden vult de AI in? | **Naam, soort, eenheid, conditie en notities.** Niet: **aantal** (tellen is volgens OpenAI zelf onbetrouwbaar, dus de schatting komt als hint onder het veld), **prijs** (een taalmodel verzint prijzen), **status, project en locatie** (niet op een foto te zien, en dat is jouw keuze) | fase 2 |
| **D5** | Wat als het formulier al ingevuld is? | De AI vult de velden die **jij nog niet hebt aangeraakt** en zet er een klein label "AI" bij tot je ze wijzigt. "Alleen lege velden vullen" werkt hier niet: het formulier heeft standaardwaarden (soort `other`, conditie `good`), dus niets is echt leeg | fase 3 |
| **D6** | Slim zoeken heeft meer filters nodig dan er nu zijn (zoektekst, soort, status, conditie, sortering) | Vier filters erbij: **prijs vanaf, prijs tot, project en locatie**. Je ziet ze als chips (zoals de bestaande filters) en kunt ze wegklikken. Ze komen niet als losse velden in het filterpaneel: dat is extra werk zonder demo-waarde | fase 4 |
| **D7** | Mogen de bestaande **project- en locatienamen** mee naar OpenAI? | **Ja.** Zonder die lijst weet het model niet dat "Zwolle" jouw project "Nieuwbouw Zwolle-Zuid" is. Er gaan geen prijzen, aantallen of andere voorraadgegevens mee, alleen de namen en je zoekvraag | fase 4 |
| **D8** | Waar komen de 20 testfoto's vandaan? | **Eigen foto's**: schuur, zolder, bouwmarkt-restbak, een sloopproject als je toegang hebt. Een mix van soorten en condities (zie fase 6). Geen internetfoto's: die zijn vaak te "mooi" en je mag ze niet zomaar in een demo tonen | fase 6 |
| **D9** | Demo ook op je **telefoon** (foto maken, de laptop rekent)? | **Ja**, dat is het sterkste moment van de demo. Het backend-adres wordt dan instelbaar (`VITE_API_URL`), zodat je telefoon via de wifi bij de laptop kan. Een foto kiezen of maken via een gewoon bestandsveld werkt ook over `http` | fase 3 |
| **D11** (nieuw 28-10) | Het aantal stuks telt slecht ([[04 - Meetresultaten]] M-001): de AI geeft nu alleen een vage tekst ("honderden") | **Tellen via een vast schema:** per bundel lagen hoog × planken breed, de code rekent het totaal uit. Een schatting is verplicht bij een stapel, met een aparte zekerheid. Het aantal wordt **ingevuld met een AI-label** en de opbouw staat eronder ("AI telde: 15 × 6 + 16 × 6 = 186"), zodat je het op de foto kunt nachecken. Dit draait B-007 (aantal niet invullen) voor een deel om: met de zichtbare opbouw is het voorstel controleerbaar | vóór fase 4 (klein, past tussendoor) |
| **D12** (nieuw 28-10) | Luna of Terra voor de foto's? (vervroegd uit D1) | **Terra voor foto's, Luna voor zoeken.** Op de stapelfoto zag alleen Terra de twee bundels, zoals een mens telt. Luna met denken was wel stabiel, maar zag één stapel. Kosten: ~$0,005 tegen ~$0,0005 per foto, dus een halve cent. Eén regel in `.env` (`AI_MODEL_PHOTO`); fase 6 controleert het op 20 foto's | samen met D11 |
| **D13** (nieuw 28-10) | Synoniemen: "verlichting" vindt "lichtarmaturen" niet, "verwarming" geen radiatoren. Nu worden 10 van de 23 verwachte materialen gevonden ([[04 - Meetresultaten]] M-004) | **Route A: synoniemgroepen.** De AI geeft per begrip een groepje woorden, de code zoekt "één uit elke groep", de voorraad blijft lokaal. Gemeten: 20–21/23. Met een regel tegen algemene woorden, een voorbeeld met twee groepen en de groepen zichtbaar als chip. **Niet** route B (alles naar de AI: preciezer, maar de hele voorraad naar OpenAI bij elke vraag en niet schaalbaar) en **niet** C (embeddings: hier 10/23) | vóór fase 7 (de demo) |
| **D10** | Demodata in de database | Een **seed-script met ~40 realistische materialen** (Nederlandse namen, 5 projecten, 4 locaties, alle soorten, statussen en condities). Zonder genoeg data valt er niets te zoeken. Heb je eigen data, dan slaan we dit over | fase 1 |

---

## 1. Uitgangspunten (worden B-003 na akkoord)

1. **De sleutel staat alleen in de backend** (`backend/.env`). Nooit in de frontend: alles wat met `VITE_` begint komt in de
   JavaScript van de browser terecht en is dan voor iedereen te lezen.
2. **De AI stelt voor, de mens beslist.** De AI slaat nooit zelf iets op: hij vult een formulier of filters in, jij drukt op opslaan.
3. **Het model raakt de database nooit aan.** Bij zoeken maakt de AI alleen een filter-object; de bestaande code filtert. Een vreemde
   zoekvraag ("verwijder alles") kan dus niets kapotmaken.
4. **Vast antwoordformaat** (structured outputs met `strict: true`): het antwoord past altijd in ons schema, met alleen bestaande
   soorten, eenheden en condities. Geen losse tekst die we moeten "parsen".
5. **Werkt ook zonder AI.** Zonder sleutel, bij een timeout of bij een fout verdwijnt of faalt alleen de AI-knop netjes; de app werkt
   zoals nu.
6. **Kosten zichtbaar.** Elke aanroep logt model, duur, tokens en geschatte kosten, en `/ai/status` toont het totaal sinds de start.
7. **Gemeten, niet gegokt.** Fase 6 meet met vaste testsets hoe goed het werkt, en kiest daarmee het model (D1) en `detail` (D3).

**Werkafspraken voor de bouw:** volg de stijl die al in het bestand staat; elk nieuw bestand begint met een korte comment over wat
het doet; **geen verwijzingen naar dit plan, fases of besluiten in de code** (Tristan, 28-10-2026: die horen in de vault); code die
weg moet wordt uitgecommentarieerd, niet verwijderd; elke nieuwe zichtbare tekst meteen in **NL én EN** (`LanguageContext.tsx`);
niets committen zonder jouw akkoord.

---

## 2. Samenvatting

| Fase | Wat | Model · effort | Nodig voor de demo? |
|---|---|---|---|
| **0** | Jij: OpenAI-account, tegoed, limiet, API-sleutel, `backend/.env`, database | — (jij) | ✅ ja |
| **1** | Fundament: AI-laag in de backend, status-route, rooktest, kostenlog, limiet per minuut, `recycled`, demodata, tests | **Opus 5.5 · high** | ✅ ja |
| **2** | Foto-analyse: backend-route + schema + prompt | **Opus 5.5 · medium** | ✅ ja |
| **3** | Foto-analyse: knop in het formulier + "nieuw via foto" + telefoon | **Sonnet 5.5 · medium** | ✅ ja |
| **4** | Slim zoeken: backend-route + schema | **Sonnet 5.5 · high** | ⭐ sterk |
| **5** | Slim zoeken: zoekbalk + chips + nieuwe filters | **Sonnet 5.5 · medium** | ⭐ sterk |
| **6** | Meten: testsets, evaluatiescript, Luna tegen Terra | **Opus 5.5 · medium** | ⭐ sterk (je verhaal) |
| **7** | Afronding: README, demo-draaiboek, gespreksvoorbereiding | **Sonnet 5.5 · medium** | ✅ ja |

**Tijdlijn:** fase 0+1 zo snel mogelijk; fase 2+3 daarna (dan heb je een werkende demo); daarna 4+5 en 6; fase 7 vlak voor het
gesprek. Raakt de tijd op, dan is **0 → 1 → 2 → 3 → 7** de kleinste complete demo.

**Kosten (prijzen van 28-10-2026; tokens per foto gemeten met `npm run ai:ping` op 28-10-2026):**

Gemeten met een testbeeld van 2048 × 1536 px. Bij `high`: **2.963 input-tokens**, Luna $0,000299, Terra $0,002993. Bij `low`:
**252 input-tokens**, Luna $0,000028, Terra $0,000282. Duur: 1,5 tot 3,2 s per aanroep. De hele rooktest (6 aanroepen) kostte $0,0036.

| Aanroep | Luna | Terra |
|---|---|---|
| 1 foto (`detail: high`, ~3.000 beeld- + ~800 tekst-tokens in, ~200 uit) | ~$0,0005 | ~$0,005 |
| 1 foto (`detail: low`) | ~$0,0002 | ~$0,002 |
| 1 zoekvraag (~600 in, ~100 uit) | ~$0,0001 | (niet gebruikt) |
| Hele ontwikkeling + metingen + demo (schatting) | **< $1** | **+ ~$1** voor de Terra-meting |

Het minimale tegoed van **$5** is ruim genoeg. Tegoed vervalt na een jaar.

---

## 3. Fases

### Fase 0 — Account, sleutel en database (jij) ✅ DONE

- **Model:** — (dit doe jij)

> Gedaan 28-10-2026. Gecontroleerd zonder de sleutel te tonen: de sleutel is een projectsleutel (`sk-proj-`) en werkt
> (`GET /v1/models` → 200, kost niets); `gpt-6-luna` en `gpt-6.1-terra` zijn beschikbaar voor dit project. `backend/.env` wordt
> door git genegeerd. Twee correcties door mij: de regel heette `API_KEY= ` (met spatie) en is nu `OPENAI_API_KEY` (de naam die de
> `openai`-package zelf leest); `AI_MODEL_PHOTO`/`AI_MODEL_SEARCH` erbij gezet. De database bestond, maar de tabel nog niet: aangemaakt
> uit `backend/database.sql` (leeg, 0 materialen). `npm install` in `backend/` gedraaid (bestaande dependencies).
> Bij het maken van de sleutel kun je geen model kiezen; dat hoort zo. Het model kies je per aanroep in de code.

**Wat:** stap voor stap in [[03 - OpenAI-account en API-sleutel]].
- [x] OpenAI-platformaccount + project `sloopmateriaal-beheer`
- [x] $5 tegoed
- [ ] **automatisch bijkopen UIT** (niet bevestigd)
- [ ] Projectlimiet $5 per maand, melding bij $2, harde limiet aan (niet bevestigd)
- [x] API-sleutel gemaakt en in `backend/.env` gezet
- [x] `backend/.env` ook met je MySQL-gegevens
- [x] Database `develop_materials_app` met de tabel uit `backend/database.sql`
- [ ] Antwoorden op D1-D10 waar je iets anders wilt (geen reactie = advies)

**Klaar als:** `npm run dev` in `backend/` start zonder fouten en de materialenpagina laadt (leeg mag).

### Fase 1 — Fundament ✅ DONE

- **Model: Opus 5.5 · high** — alles bouwt hierop (sleutel, foutafhandeling, limieten, kosten). Een fout hier lekt geld of de sleutel,
  of komt in elke latere fase terug: kost dagen, geen minuten.

> Gedaan 28-10-2026, **niet gecommit**.
> - **Backend `src/ai/`:**
>   - `aiConfig.ts`: `readAiConfig(env)`, prijstabel `MODEL_PRICES`, timeout 20 s, 1 herhaling, 20 per minuut
>   - `openaiClient.ts`
>   - `usage.ts`: kosten per aanroep, logregel en totaal
>   - `rateLimit.ts`
>   - `aiRoutes.ts`: `GET /ai/status`, sleutelbewaking en limiet
>   - aangesloten in `server.ts`, met de logregel `AI ON` of `AI OFF`
> - **Scripts:** `npm run ai:ping` (`src/scripts/aiPing.ts`) en `npm run sql` / `npm run db:seed` (`src/scripts/runSql.ts`).
> - **Packages:** `openai` 7.45.1; `vitest` 5.0.5 als dev-dependency.
> - **D2:** `migrations/001_recycled_status.sql` gedraaid, `database.sql` bijgewerkt (oude regel uitgecommentarieerd), `recycled` in
>   formulier, filter, bulk-update, import en dashboardgrafiek. In de grafiek telde een gerecycled materiaal eerst als NaN.
> - **D10:** `seed.sql` met 40 materialen geladen (5 projecten, 4 locaties, alle soorten, statussen en condities).
> - **Overig:** `CLAUDE.md` in de repo-root, en `.env.example` met de AI-regels.
>
> **Afwijking van de plantekst:** `GET /ai/status` valt **niet** onder de limiet per minuut. De frontend vraagt hem bij elke pagina
> en hij kost niets. Alle andere `/ai/*`-routes wel, ook de routes die nog gaan komen: de limiet staat in de router vóór die routes,
> dus een nieuwe route kan hem niet vergeten.
>
> **Gecontroleerd:**
> - `npm test`: 17/17
> - `tsc --noEmit` schoon, frontend `npm run build` schoon
> - `ai:ping`: 6/6 (Luna en Terra, tekst, foto high en low)
> - echte serverrun met sleutel: `AI ON`, status `enabled: true`
> - echte serverrun zonder sleutel: `AI OFF`, `POST /ai/search` gaf 503 `AI_NOT_CONFIGURED`, `/materials` gaf 40 materialen
> - nog niet in de browser bekeken (de `recycled`-keuze in het formulier)

**Bouw:**
- `npm install openai` in `backend/`; `vitest` als dev-dependency (de backend heeft nog geen tests).
- `backend/src/ai/openaiClient.ts`: leest `OPENAI_API_KEY`; `AI_MODEL_PHOTO` en `AI_MODEL_SEARCH` (standaard `gpt-6-luna`);
  timeout 20 s, één herhaling. Zonder sleutel: `aiEnabled() === false` en alle AI-routes geven `503 AI_NOT_CONFIGURED`.
- `backend/src/ai/usage.ts`: na elke aanroep één logregel (functie, model, ms, input-/output-tokens, geschatte $) + een teller sinds de start.
  De prijzen staan in één tabel in de config (geen losse getallen).
- `GET /ai/status` → `{ photo: boolean, search: boolean, models, usageSinceStart }`. De frontend toont alleen knoppen die werken.
- **Limiet per minuut** op alle `/ai/*`-routes (eigen middleware van ~20 regels, per IP, bv. 20 per minuut): de backend heeft geen login,
  dus zonder dit kan elke pagina je tegoed opmaken.
- **Rooktest** `npm run ai:ping`: één tekstaanroep en één kleine foto naar Luna én Terra. Toont alleen "ok", het model en het echte
  aantal tokens, nooit de sleutel. Zo weten we zeker dat de modelnamen kloppen en wat een foto écht kost.
- **D2:** `recycled` toevoegen (migratie-SQL `backend/migrations/001_recycled_status.sql` + `database.sql` bijwerken + formulier/filter/bulk).
- **D10:** `backend/seed.sql` (of `npm run seed`) met ~40 demomaterialen.
- `CLAUDE.md` in de repo-root: verwijzing naar deze vault + de werkafspraken uit §1, zodat elke volgende sessie meteen goed start.

**Tests:** zonder sleutel geeft elke AI-route 503 en werkt `/materials` gewoon; de limiet blokkeert de 21e aanroep binnen een minuut;
de kostenberekening klopt voor een bekend aantal tokens. **Geen enkele test roept OpenAI echt aan** (nep-client).

**Klaar als:** `ai:ping` slaagt voor beide modellen, `/ai/status` klopt, en de app zonder sleutel exact werkt zoals nu.

### Fase 2 — Foto-analyse: backend ✅ DONE

- **Model: Opus 5.5 · medium** — de prompt en het schema bepalen de kwaliteit van de hele functie, en de route leest bestanden van
  schijf (beveiliging).

> Gedaan 28-10-2026, **niet gecommit**.
>
> **Nieuwe bestanden:**
> - `src/ai/photoAnalysis.ts`, met:
>   - `resolveImages`: alleen de bestandsnaam telt, dus `../`, een ander domein en verborgen bestanden lezen nooit iets buiten `uploads/`;
>     alleen jpg, png en webp; max. 5 foto's en 20 MB per foto
>   - `PHOTO_SCHEMA` (strict)
>   - `buildInstructions(lang)`
>   - `analyzePhoto`
> - `src/types/materialOptions.ts`: de toegestane waarden als lijsten; een test vergelijkt ze met de ENUM's in `database.sql`.
>
> **Aanpassingen:**
> - `aiConfig.ts` kreeg `photo`: `detail: high`, reasoning `none`, max. 800 output-tokens.
> - `aiRoutes.ts` kreeg `POST /ai/analyze-photo` onder de limiet.
> - `server.ts` geeft de client en de uploads-map door.
>
> **Keuzes tijdens de bouw:**
> - De AI stelt alleen metrische eenheden voor (geen lbs, sqft of linear_ft); in het formulier blijven ze bestaan.
> - `store: false`: OpenAI bewaart de foto's niet na het antwoord. Goed punt voor de AVG-vraag in het gesprek.
> - Tekst op de foto geldt als informatie, nooit als opdracht. Dat staat in de instructie, tegen prompt-injectie via een foto.
> - Het antwoord wordt na strict mode nog een keer gecontroleerd, zodat er nooit een kapotte suggestie in het formulier komt.
>
> **Gecontroleerd:**
> - `npm test`: 38/38, waarvan 21 nieuw, allemaal met een nep-client
> - `tsc` schoon
> - **echte aanroep** via de server met een testbeeld (bruine strepen, 1024 × 768): HTTP 200, "Bruin houten paneel", `wood`,
>   `sqm`, conditie `null` (niet te beoordelen, zoals de instructie vraagt), confidence `low`, 3,8 s, 1.519 tokens in, $0,00019.
>   OpenAI accepteert het strikte schema dus.
> - Foute invoer (`../.env`) gaf 400 `IMAGE_NOT_FOUND`.
> - **Nog niet:** een échte foto van een materiaal. Die komt in fase 3 (op je telefoon) en fase 6 (de testset).
>
> **API-contract voor fase 3** — `POST /ai/analyze-photo`, body `{ images: string[], lang: "nl" | "en" }`:
>
> | Status | Antwoord |
> |---|---|
> | 200 | `{ suggestion: { is_material, name, material_type, unit, condition \| null, notes, quantity_hint \| null, confidence }, usage }` |
> | 400 | `INVALID_INPUT` met reason `NO_IMAGES` / `TOO_MANY_IMAGES` / `IMAGE_NOT_FOUND` / `UNSUPPORTED_IMAGE` (bv. HEIC van een iPhone) / `IMAGE_TOO_LARGE` |
> | 422 | `AI_REFUSED` |
> | 429 | `AI_RATE_LIMITED` (+ `retryAfterSec`) |
> | 502 | `AI_FAILED` (+ reason, bv. `insufficient_quota` = tegoed op) |
> | 503 | `AI_NOT_CONFIGURED` |
> | 504 | `AI_TIMEOUT` |

**Bouw:** `POST /ai/analyze-photo` met `{ images: string[], lang: 'nl' | 'en' }`.
- **Invoer controleren:** max. 5 foto's; van elke URL alleen de bestandsnaam, en die moet bestaan in `backend/public/uploads/`
  (geen `../`-trucs, geen externe URL's die de server voor een ander gaat ophalen); alleen jpg/png/webp.
- **Foto meesturen als base64** (`data:image/jpeg;base64,...`): OpenAI kan `http://localhost:3000/uploads/...` niet ophalen.
  `detail` volgens D3.
- **Schema (strict):** `is_material` (boolean), `name`, `material_type` (enum), `unit` (enum), `condition` (enum of `null` als het niet te
  zien is), `notes`, `quantity_hint` (tekst of `null`), `confidence` (`low`/`medium`/`high`). De enums komen uit één lijst in de AI-laag;
  een test vergelijkt die met de ENUM's in `database.sql`, zodat een verschil zoals bij `recycled` niet nog eens kan ontstaan.
- **Prompt:** alleen beschrijven wat zichtbaar is; nooit prijs, status, project of locatie (D4); naam en notities in `lang`; per conditie
  een concrete omschrijving voor sloopmateriaal (bv. *good* = "kleine gebruikssporen, direct herbruikbaar", *poor* = "beschadigd, alleen
  nog als grondstof"), zodat het model elke keer dezelfde lat gebruikt.
- **Fouten:** weigering (`refusal`), onvolledig antwoord of timeout → nette foutcode (`AI_REFUSED`, `AI_TIMEOUT`, `AI_FAILED`), nooit een crash.
- **Antwoord:** `{ suggestion, usage: { model, ms, inputTokens, outputTokens, costUsd } }`.

**Tests (nep-client):** `../`-pad geweigerd, 6 foto's geweigerd, onbekend bestand geweigerd, weigering → `AI_REFUSED`, geldig antwoord
→ juiste suggestie, enum-lijst gelijk aan `database.sql`.

**Klaar als:** een foto van een plank via `curl` of het testscript een kloppende suggestie geeft, met kosten in de log.

### Fase 3 — Foto-analyse: frontend ✅ DONE

- **Model: Sonnet 5.5 · medium** — afgebakend UI-werk op een bestaand formulier; een fout zie je meteen en is snel hersteld.
  (Gebouwd met Opus 5.5: Tristan zei "begin maar" in de Opus-sessie.)

> Gedaan 28-10-2026.
>
> **Nieuw en aangepast:**
> - **Nieuw: `frontend/src/components/ai/aiApi.ts`:** `useAiStatus()` (TanStack Query, 1 min), `analyzePhotos()`, `AiError` en
>   `aiErrorKey()` (foutcode → vertaalsleutel).
> - **`MaterialForm.tsx`:**
>   - knop "Vul in met AI", alleen bij een **nieuw** materiaal (een opgeslagen materiaal wordt nooit door een voorstel overschreven);
>   - melding "AI bekijkt de foto's…" bovenaan;
>   - label **AI** bij elk ingevuld veld tot je het wijzigt (`touchedRef` + `aiFields`);
>   - `quantity_hint` als "Schatting AI" onder het aantal;
>   - nieuwe prop `initialFiles`;
>   - de upload staat nu in `uploadFiles()`, die zowel de fotoknop als "nieuw via foto" gebruikt.
> - **`Materials.tsx`:** knop **"Nieuw via foto"**, alleen als AI aan staat. Zonder `capture`: op een telefoon kies je tussen camera
>   en galerij, op de laptop krijg je de bestandskiezer (eerst `capture="environment"`, op Tristans verzoek aangepast). De foto
>   gaat naar het formulier, dat uploadt en vanzelf de AI laat invullen.
> - **D9:**
>   - `config.ts`: het API-adres is `VITE_API_URL`, anders poort 3000 op dezelfde machine als de pagina; de telefoon werkt dus
>     zonder instelling;
>   - `npm run dev:phone` (`vite --host`);
>   - `PUBLIC_HOST` uitgezet in `backend/.env` en leeg in `.env.example`, zodat de foto-adressen het adres volgen waarop de app
>     geopend is;
>   - README-sectie "Testen op je telefoon".
> - **Teksten:** 18 nieuwe teksten in NL en EN.
>
> **Twee bestaande bugs gefixt** (nodig voor de demo):
> 1. **Foto's kapot na bewerken.** `PUT /materials/:id` sloeg volledige foto-URL's op, terwijl `mapMaterial` er nog een keer het
>    adres voor zet. Nu slaat PUT alleen bestandsnamen op, net als POST.
> 2. **Onzichtbare knoppen in de lichte modus.** In `index.css` stond `button { background-color: #f9f9f9 }` uit het
>    Vite-sjabloon buiten de Tailwind-lagen. Die regel won van elke `bg-*`-klasse, waardoor "Materiaal Toevoegen" (en de nieuwe
>    paarse knop) wit op wit werden. In de donkere modus viel het niet op. De regel staat nu in `@layer base`.
>
> **Gecontroleerd in de echte app** (backend + Vite, headless Edge via playwright-core, met een echte baksteentextuur uit de
> Sillyballs-assets):
> - **"Nieuw via foto":** het formulier was in **5,8 s** ingevuld: "Beige bakstenen gevelwand", Baksteen, Goed, Vierkante meter,
>   notities, en AI-labels op alle 5 velden.
> - **Eigen naam:** zelf een naam typen en de AI opnieuw draaien → de eigen naam bleef staan en het AI-label ging weg.
> - **Opslaan:** werkt.
> - **Bewerken (PUT):** laat de foto-URL heel.
> - **Telefoonbreedte (390 px):** de knop past in de kop.
> - **Geen consolefouten.**
> - **Builds en tests:** `npm run build` schoon, backend 38/38.
> - Mijn testmateriaal en de testfoto's zijn weer verwijderd.
>
> **Opvallend voor fase 6:**
> - **Andere conditie bij een tweede run.** Dezelfde foto gaf de tweede keer "Redelijk" in plaats van "Goed". Meet in fase 6
>   daarom elke foto 2× (consistentie).
> - **Caching.** De tweede aanroep kostte $0,000079 in plaats van $0,0004: OpenAI cachet herhaalde invoer vanzelf. Goed punt
>   voor het gesprek.
>
> **Nog te doen door Tristan:** de test op de S22 via `npm run dev:phone`. Windows kan bij de eerste keer om netwerktoegang voor
> Node vragen; kies dan "privé". Op een bedrijfs- of gastenwifi kan verkeer tussen apparaten geblokkeerd zijn; een hotspot werkt
> dan wel.

**Bouw:**
- `MaterialForm.tsx`: knop **"✨ Vul in met AI"** onder de foto's, alleen zichtbaar als `/ai/status` foto-AI meldt en er ≥ 1 foto is.
  Laadstatus tijdens het wachten.
- **Invullen volgens D5:** het formulier onthoudt welke velden jij aanraakte; de AI vult de rest en zet er een label **AI** bij tot je
  het veld wijzigt. `quantity_hint` verschijnt als hint onder "aantal". Melding: "Controleer de suggestie".
- `is_material: false` → melding "Geen materiaal herkend op de foto".
- **Snelle start** op de materialenpagina: knop **"📷 Nieuw via foto"** → foto kiezen of maken → uploaden → formulier opent met de foto
  en de AI-suggestie al ingevuld. Dit is de demo in 30 seconden.
- **D9:** `config.ts` leest `VITE_API_URL` (terugval `http://localhost:3000`); `npm run dev -- --host` om met je telefoon op dezelfde
  wifi te testen. Uitleg in de README.
- Alle nieuwe teksten in NL en EN.

**Klaar als:** jij op je telefoon een foto maakt en binnen enkele seconden een ingevuld formulier ziet.

### Fase 4 — Slim zoeken: backend ✅ DONE

- **Model: Sonnet 5.5 · high** — de structuur ligt vast na fase 1 en 2 (zelfde client, limiet en log). Het enige ontwerpwerk is het
  schema; een fout geeft hooguit een verkeerd filter, geen schade (uitgangspunt 3).
  (Gebouwd met Opus 5.5, in dezelfde sessie.)

> Gedaan 28-10-2026.
>
> **Nieuw:**
> - **`src/ai/structuredCall.ts`:** `callStructured()`, de gedeelde OpenAI-aanroep met kostenlog en alle foutcodes. Die code
>   kwam ongewijzigd uit `photoAnalysis.ts`, dus foto en zoeken gebruiken nu hetzelfde pad. De fototests bleven groen.
> - **`src/ai/smartSearch.ts`:**
>   - `smartSearch()`: vraag van max. 200 tekens;
>   - `buildSearchSchema(names)`: strict, en **project en locatie zijn een enum van de bestaande namen**, dus het model kan geen
>     project verzinnen;
>   - `buildSearchInstructions()`: met 5 voorbeelden;
>   - `toFilters()`: null → "all", namen exact zoals in de lijst, een onbekende naam wordt een zoekwoord, prijs min/max
>     omgedraaid als ze verkeerd om staan.
> - **`src/ai/knownNames.ts`:** `SELECT DISTINCT` project- en locatienamen, max. 100 per lijst (D7).
> - **Route:** `POST /ai/search`, onder de limiet.
> - **Tests:** `tests/smartSearch.test.ts`. Backend nu 58/58.
>
> **API-contract voor fase 5** — `POST /ai/search`, body `{ query, lang }`, antwoord
> `{ filters: { search, type, status, condition, sort | null, priceMin, priceMax, project, location }, explanation, usage }`.
> - `type`, `status` en `condition` zijn `"all"` als er niet op gefilterd wordt.
> - `sort: null` betekent: houd de huidige sortering.
> - `search` kan **meer woorden** bevatten ("eiken balk"). Fase 5 moet dan elk woord laten matchen; nu zoekt de pagina op de hele
>   tekst als één stuk.
> - Fouten: 400 `INVALID_INPUT` (`EMPTY_QUERY`, `QUERY_TOO_LONG`), en verder dezelfde codes als bij de foto.
>
> **Gecontroleerd** met 18 echte vragen tegen Luna op de 40 demomaterialen ([[04 - Meetresultaten]] M-002): 17 goed. De
> uitschieter is "lampen in redelijke staat", omdat het product in de data "Lichtarmaturen" heet. Duur ~1,3 s, ~$0,00013 per vraag.
>
> **Onderweg gevonden en opgelost:** `server.ts` negeerde de fout in de `listen`-callback van Express 5. Bleef er na een
> nodemon-herstart een oude server op poort 3000 hangen, dan meldde de nieuwe toch "Server running" en stopte hij stil. Daardoor
> draaide de backend een tijdje oude code. Nu gooit hij de fout, en zie je "app crashed" in plaats van een stille stop.
>
> **Voor fase 7 (demo):** de voorbeeldvraag uit dit plan ("houten balken in goede staat van project Zwolle onder 50 euro") geeft
> netjes de juiste filters, maar 0 resultaten, want die balken liggen in Dalfsen. Kies voor de demo een vraag die iets vindt,
> bijvoorbeeld "goedkoopste radiatoren" of "wat staat er te koop in loods B".

**Bouw:** `POST /ai/search` met `{ query: string, lang }` → `{ filters, explanation, usage }`.
- Zoekvraag max. 200 tekens, niet leeg.
- **Schema (strict):** `search`, `type`, `status`, `condition`, `priceMin`, `priceMax`, `project`, `location` (elk `null` als niet
  genoemd) en `sort` (vaste lijst van de bestaande sorteeropties). `explanation`: één korte zin "Ik zocht naar …" in `lang`.
- **D7:** de bestaande project- en locatienamen (`SELECT DISTINCT`) gaan mee in de prompt; het model kiest daaruit of laat het leeg.
- Model: `AI_MODEL_SEARCH` (Luna, D1).

**Tests (nep-client):** lege of te lange vraag geweigerd; `null`-velden worden "alle"; een onbekende projectnaam valt terug op de
zoektekst; weigering of timeout → foutcode.

### Fase 5 — Slim zoeken: frontend ✅ DONE

- **Model: Sonnet 5.5 · medium** — UI op een bestaand filterpaneel dat al chips voor actieve filters heeft.
  (Gebouwd met Opus 5.5, in dezelfde sessie.)

> Gedaan 28-10-2026.
>
> **Gebouwd:**
> - **`FilterPanel.tsx`:**
>   - knop **"✨ Slim zoeken"**, alleen als AI aan staat; onder 1360 px alleen het icoon, anders past de rij niet naast de zijbalk;
>   - aan: het zoekveld wordt een vraagveld (paars, eigen placeholder), en Enter of de knop in het veld vraagt de AI;
>   - een nieuwe vraag zet alle filters opnieuw; zonder sortering van de AI blijft de huidige sortering staan;
>   - de **uitleg** van de AI staat met ✨ onder de chips;
>   - 4 nieuwe chips: project, locatie, prijs vanaf, prijs tot;
>   - lukt de AI niet, dan wordt er gewoon op de tekst gezocht, met een melding.
> - **`emptyFilters.ts`:** `EMPTY_FILTERS` (eigen bestand voor de Fast Refresh-regel van eslint).
> - **`Materials.tsx`:**
>   - de 4 nieuwe filters (een materiaal zonder prijs valt buiten een prijsfilter);
>   - **gewoon zoeken gaat nu woord voor woord** (B-015).
> - **`aiApi.ts`:** `searchWithAi()` en de foutmelding voor een te lange vraag.
> - **Teksten:** 9 nieuwe teksten in NL en EN.
>
> **Twee bestaande bugs gefixt:**
> 1. **Chips waren niet weg te klikken.** Badge zet `pointer-events: none` op een svg die er direct in staat, dus de klik op de X
>    kwam nooit aan. Nu is er een echte knop `ChipRemove` op alle 8 chips (4 bestaande + 4 nieuwe).
> 2. **Gekleurde knoppen werden grijs bij hover.** `button:hover { background-color: darkgray }` uit het Vite-sjabloon stond buiten de
>    Tailwind-lagen. Die regel staat nu in `@layer base`, net als de eerdere fix voor de achtergrondkleur.
>
> **Gecontroleerd in de echte app** (headless Edge, backend + Vite):
> - **"goedkoopste radiatoren":** in 2,2 s 1 resultaat, met de chips "Zoeken: radiator" en "Type: Loodgieterswerk", sortering op
>   prijs en de uitleg eronder.
> - **"wat staat er te koop in loods B":** 4 resultaten. De locatie-chip wegklikken gaf er 12.
> - **"Wis alles":** terug naar 40, de uitleg weg.
> - **Gewoon zoeken op "eiken balk":** vindt "Eiken balken 20x20 cm".
> - **Breedtes:** geen horizontaal scrollen op 1280, 1366, 1440 en 1920 px; op telefoonbreedte past het.
> - **Builds:** geen consolefouten, `npm run build` schoon.
>
> **Nagekomen, zelfde dag ([[04 - Meetresultaten]] M-003):** Tristan zag dat dezelfde vraag soms niets vond. Opgelost met:
> - zoeken dat woordvormen snapt;
> - een vangnet voor het type;
> - `temperature 0`;
> - een cache van 10 minuten;
> - een paar prompt-regels.
>
> Vastgelegd als B-016 en B-017. De frontend heeft nu ook tests (vitest, `npm test`, 13/13); backend 64/64.

**Bouw:**
- `FilterPanel.tsx`: een **✨-knop** in het zoekveld (alleen als `/ai/status` zoek-AI meldt). Enter met ✨ aan → `/ai/search` → `setFilters`.
- De bestaande chips laten zien wat de AI begreep, plus de chips voor de vier nieuwe filters (D6) en de `explanation` als regel eronder.
  Je kunt elk filter wegklikken: de AI stelt voor, jij houdt de controle.
- `Materials.tsx`: het type `Filters` en de `useMemo` krijgen `priceMin`, `priceMax`, `project` en `location`.
- **Terugval:** AI uit of fout → gewoon tekstzoeken met dezelfde vraag + melding.
- Alle nieuwe teksten in NL en EN.

**Klaar als:** "houten balken in goede staat van project Zwolle onder 50 euro" de juiste materialen toont, met vier zichtbare chips.

### Fase 6 — Meten ⏳ NEXT

- **Model: Opus 5.5 · medium** — meetresultaten interpreteren en er besluiten (D1, D3) op baseren vraagt nauwkeurigheid: een verkeerde
  conclusie vertel je straks in een gesprek.

**Jij levert (D8):** 20 eigen foto's in `backend/eval/photos/` (niet in git) en per foto de juiste soort, eenheid en conditie.
Richtlijn: elke soort minstens één keer (hout, metaal, beton, baksteen, glas, armaturen, apparaten, dakbedekking, sanitair,
elektra); alle vier de condities; 2 lastige (twee materialen op één foto, slecht licht) en 1 foto zonder materiaal (bv. je kat).
**Ik lever:** 30 zoekvragen met het juiste filter (`backend/eval/search.csv`); jij leest ze na of vult aan met vragen die jij zou typen.

**Bouw:**
- `npm run eval:photo -- --model gpt-6-luna --detail high` → tabel: % goed per veld (soort, eenheid, conditie), gemiddelde duur,
  kosten per foto. Draaien voor **Luna high, Luna low en Terra high**.
- `npm run eval:search -- --model gpt-6-luna` → % goed per filterveld + hoeveel vragen helemaal goed.
- Resultaten in de vault: `04 - Meetresultaten.md`, met het besluit over D1 en D3 erbij.

**Klaar als:** D1 en D3 zijn gekozen op basis van de cijfers en die keuze staat in `.env.example` en in het besluitenlog.

### Fase 7 — Afronding en demo

- **Model: Sonnet 5.5 · medium** — documentatie en een draaiboek, geen kerncode.

**Bouw / schrijf:**
- `README.md`: sectie "AI-functies" (wat, hoe aanzetten, kosten) + `.env.example` met `OPENAI_API_KEY=`, `AI_MODEL_PHOTO`, `AI_MODEL_SEARCH`.
- Vault `05 - Demo en gesprek.md`:
  - **draaiboek van 2 minuten:** telefoonfoto → formulier → opslaan → slim zoeken → `/ai/status` met de kosten;
  - **gesprekspunten:** waarom Luna (en de meting tegen Terra), structured outputs, sleutel alleen in de backend, terugval zonder AI,
    "de AI stelt voor, de mens beslist", tests zonder echte aanroepen, kosten per aanroep;
  - **wat ik in productie anders zou doen:** login en limieten per gebruiker, AVG (foto's gaan naar OpenAI: verwerkersovereenkomst,
    bewaartermijn), monitoring van kosten en fouten, eventueel een wachtrij voor foto-analyse.
- Eén volledige proefrun op de laptop én de telefoon.
- Committen en pushen doet Tristan zelf (28-10-2026).

---

## 4. Na het gesprek (niet in dit plan)

- Online zetten vraagt eerst een **login**: zonder login kan iedereen met het adres je tegoed opmaken (de limiet per minuut remt dat
  alleen af).
- Bomb Pass: gebruikersnaam-moderatie via de server (zie het advies van 28-10-2026). Komt pas aan bod als dit plan af is.

---

## 5. Voortgang

- [x] **Fase 0** — account, sleutel, database (jij) — **Model:** — (jij) — ✅ 28-10-2026 (limiet en bijkopen nog bevestigen)
- [x] **Fase 1** — fundament — **Model: Opus 5.5 · high** — ✅ 28-10-2026 (niet gecommit)
- [x] **Fase 2** — foto-analyse backend — **Model: Opus 5.5 · medium** — ✅ 28-10-2026
- [x] **Fase 3** — foto-analyse frontend — **Model: Sonnet 5.5 · medium** — ✅ 28-10-2026 (S22-test door Tristan nog open)
- [x] **Fase 4** — slim zoeken backend — **Model: Sonnet 5.5 · high** — ✅ 28-10-2026
- [x] **Fase 5** — slim zoeken frontend — **Model: Sonnet 5.5 · medium** — ✅ 28-10-2026
- [ ] **Fase 6** — meten — **Model: Opus 5.5 · medium** — ⏳ NEXT
- [ ] **Fase 7** — afronding en demo — **Model: Sonnet 5.5 · medium**

---

## Bronnen (geraadpleegd 28-10-2026)

- Prijzen: https://developers.openai.com/api/docs/pricing
- Modellen: https://developers.openai.com/api/docs/models · `gpt-6-luna` en `gpt-6.1-terra` hebben elk een eigen modelpagina
- Beeld als invoer, `detail` en token-rekenregel: https://developers.openai.com/api/docs/guides/images-vision
- Structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Tegoed en limieten: https://help.openai.com/en/articles/8264778-what-is-prepaid-billing ·
  https://developers.openai.com/api/docs/guides/spend-limits
