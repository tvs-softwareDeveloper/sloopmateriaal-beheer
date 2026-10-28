# Sloopmateriaal-beheer — Besluitenlog

> Vaste keuzes, met de reden erbij. Niet opnieuw bediscussiëren wat hier staat; wil je iets omdraaien, zet er dan een nieuw
> besluit onder dat het oude vervangt. Open besluiten (D1 t/m D10) staan in [[01 - Plan van aanpak AI-koppeling]] en komen
> hier zodra ze vastliggen.

## B-001 — OpenAI als AI-leverancier (28-10-2026)

**Besluit:** de AI-koppeling gaat via de OpenAI API (Responses API, officiële npm-package `openai`).
**Reden:** Tristans keuze. Hij wil in zijn sollicitatiegesprek ervaring met een AI-API kunnen laten zien.

## B-002 — GPT-6 Luna als standaardmodel (28-10-2026)

**Besluit:** beide functies gebruiken standaard `gpt-6-luna` ($0,10 input / $0,50 output per 1M tokens, prijzen van 28-10-2026).
Welk model een functie gebruikt, staat in één regel in `backend/.env`, zodat wisselen geen codewijziging is.
**Reden:** Tristans keuze: het goedkoopste model dat niet wordt uitgefaseerd. `gpt-5-nano` is goedkoper, maar staat bij OpenAI
als deprecated. Of de foto-functie naar `gpt-6.1-terra` gaat (10× duurder, gemaakt voor beeld) beslissen we met metingen in
fase 6, zie D1.

## B-003 — Uitgangspunten van de AI-koppeling (28-10-2026)

**Besluit:** de zeven uitgangspunten uit [[01 - Plan van aanpak AI-koppeling]] §1 gelden voor alle AI-code:
- sleutel alleen in de backend;
- de AI stelt voor en de mens beslist;
- het model raakt de database nooit aan;
- strict structured outputs;
- de app werkt ook zonder AI;
- kosten zichtbaar;
- keuzes op basis van metingen.

**Reden:** Tristan gaf akkoord op het plan door fase 1 te starten ("begin aan fase 1").

## B-004 — Status `recycled` afgemaakt (28-10-2026, D2)

**Besluit:** `recycled` staat nu in de database-ENUM (tussen `sold` en `disposed`, dezelfde volgorde als `types/material.ts`) en
in alle statuslijsten van de frontend.
**Reden:** voor sloopmateriaal is "gerecycled" een echte eindstatus naast "afgevoerd". De vertaling en de kaartkleur bestonden al.
Opslaan met deze status ging eerst mis in de database.

## B-005 — Demodata via `seed.sql` (28-10-2026, D10)

**Besluit:** `backend/seed.sql` (`npm run db:seed`) zet 40 demomaterialen klaar. Het script vervangt alleen zijn eigen rijen
(`qr_code` begint met `MAT-SEED-`), zodat eigen materialen blijven staan.
**Reden:** zonder data valt er niets te zoeken in de demo (fase 4–5).

## B-006 — Foto's gaan mee met `detail: high` (28-10-2026, D3)

**Besluit:** de foto-analyse stuurt foto's mee met `detail: "high"`: de foto past in 2048 × 2048 px en kost ~3.000 tokens.
Nooit `auto`: dat is bij deze modellen de originele resolutie, ~14.000 tokens per telefoonfoto. De instelling staat in
`aiConfig.ts` (`photo.detail`).
**Reden:** scheuren, roest en verf moeten zichtbaar blijven om de conditie te beoordelen. Gemeten: Luna $0,0003 per foto.
Fase 6 vergelijkt `high` met `low` (252 tokens) op kwaliteit.

## B-007 — De AI vult alleen naam, soort, eenheid, conditie en notities in (28-10-2026, D4)

**Besluit:**
- Het schema van de foto-analyse heeft **geen** velden voor prijs, status, project, locatie of aantal.
- Een geschat aantal komt alleen als tekst (`quantity_hint`).
- De AI stelt alleen metrische eenheden voor (geen lbs, sqft of linear_ft); in het formulier blijven ze wel bestaan.

**Reden:** die waarden zijn niet op een foto te zien of zijn een keuze van de gebruiker. Tellen is volgens OpenAI zelf
onbetrouwbaar, en een taalmodel verzint prijzen. Omdat de velden niet in het schema staan, kán de AI ze ook niet invullen.

## B-008 — De AI vult alleen velden die je nog niet aanraakte, en alleen bij een nieuw materiaal (28-10-2026, D5)

**Besluit:**
- Het formulier onthoudt welke velden je zelf wijzigde; de AI slaat die over.
- Een veld dat de AI invulde krijgt het label **AI** tot je het verandert.
- De knop "Vul in met AI" staat alleen bij een **nieuw** materiaal.

**Reden:** "alleen lege velden" werkt niet, want het formulier heeft standaardwaarden. Een opgeslagen materiaal hoort niet
ongemerkt door een voorstel overschreven te worden.

## B-009 — Demo op de telefoon zonder extra instellingen (28-10-2026, D9)

**Besluit:**
- Het API-adres van de frontend is `VITE_API_URL`, en anders poort 3000 op dezelfde machine als de pagina.
- `PUBLIC_HOST` blijft leeg, zodat foto-adressen het adres volgen waarop de app geopend is.
- `npm run dev:phone` start Vite op het netwerk.
- "Nieuw via foto" gebruikte eerst `capture="environment"` (camera direct open). **Bijgesteld 28-10-2026 op Tristans
  verzoek:** zonder `capture`, zodat je op een telefoon kiest tussen camera en galerij en op de laptop een gewone
  bestandskiezer krijgt.

**Reden:** een foto maken met je telefoon en het formulier zien vollopen is het sterkste moment van de demo. Een vast
`localhost`-adres werkt op een telefoon niet.

## B-010 — Tristan commit en pusht zelf (28-10-2026)

**Besluit:** in dit project commit en pusht Tristan zelf. Claude commit niet en vraagt er ook niet om.
**Reden:** Tristans keuze ("commit pushen doe ik allemaal zelf later").

## B-011 — Aantal tellen per bundel en invullen met de opbouw erbij (28-10-2026, D11)

**Besluit:**
- De foto-analyse vraagt per stapel de **secties** (bundels) met **lagen hoog × planken breed**. Bij losse stuks vraagt hij
  het getelde aantal.
- De **code** rekent het totaal uit (`countTotal` in `photoAnalysis.ts`), nooit het model. Een telling die nergens op slaat
  (0 lagen, een lege stapel, meer dan 100.000) wordt "geen telling".
- Bij een stapel is een schatting verplicht, met een eigen zekerheid; "none" mag alleen bij een oppervlak of bulk.
- In het formulier komt het aantal in het veld met een **AI**-label, maar alleen als de eenheid "stuks" is. De opbouw staat
  eronder: "AI telde: 14 × 6 + 16 × 6 = 180" (en bij lage zekerheid "controleer dit aantal").

Dit **vervangt het deel van B-007** dat zei dat de AI het aantal niet invult.

**Reden:** meting M-001 in [[04 - Meetresultaten]]:
- De vrije tekst gaf "honderden" en "enkele tientallen".
- Mocht het model "kan niet tellen" zeggen, dan deed het dat altijd.
- Met de vaste telmethode zit Terra binnen ~5% van de echte 168.

De zichtbare opbouw maakt het voorstel in één blik controleerbaar op de foto.

## B-012 — Terra voor foto's, Luna voor de rest (28-10-2026, D12)

**Besluit:** `AI_MODEL_PHOTO=gpt-6.1-terra`; dit is ook de standaard in `aiConfig.ts` (`DEFAULT_MODELS`). Zoeken en alle
andere functies blijven op `gpt-6-luna`. Terra draait zonder nadenken (`reasoningEffort: "none"`). Dit **vult B-002 aan**:
Luna blijft het standaardmodel, behalve voor foto's.
**Reden:** in M-001 zag alleen Terra de twee bundels, en met de echte code telde hij 5× binnen 174–180 (echt: 168). Luna met
nadenken sprong tussen 120 en 175. Terra kost ~$0,0047 per nieuwe foto tegen ~$0,0005, maar een halve cent per foto is
verwaarloosbaar.

## B-013 — Vier extra filters voor slim zoeken (28-10-2026, D6)

**Besluit:** slim zoeken geeft naast zoektekst, soort, status, conditie en sortering ook **prijs vanaf, prijs tot, project en
locatie** terug. In fase 5 worden dat chips op de materialenpagina, geen losse velden in het filterpaneel.
**Reden:** vragen als "onder 50 euro" of "uit Dalfsen" zijn anders niet te beantwoorden.

## B-014 — Project- en locatienamen gaan mee naar OpenAI (28-10-2026, D7)

**Besluit:**
- De bestaande project- en locatienamen (max. 100 per lijst) gaan mee in de instructie.
- In het schema zijn ze een **enum**, dus het model kan alleen een bestaande naam kiezen.
- Er gaan geen prijzen, aantallen of andere voorraadgegevens mee.

**Reden:** zonder die lijst weet het model niet dat "Zwolle" het project "Sloop kantoorpand Zwolle-Zuid" is. Met de enum kan
het geen project verzinnen. Een naam die toch niet bestaat, wordt in `toFilters()` een zoekwoord.

## B-015 — Gewoon zoeken gaat woord voor woord (28-10-2026)

**Besluit:** het zoekveld op de materialenpagina zoekt nu per woord. Elk woord moet ergens voorkomen (in naam, locatie, project,
QR-code of notities). Eerst moest de hele tekst als één stuk in één veld staan.
**Reden:** slim zoeken geeft soms twee woorden terug ("eiken balk"), en ook met de hand vindt "eiken balk" nu "Eiken balken
20x20 cm". Met één woord werkt het precies als vroeger.

## B-016 — Slim zoeken: temperature 0 en een cache van 10 minuten (28-10-2026)

**Besluit:**
- Zoeken stuurt `temperature: 0` mee (`aiConfig.search.temperature`).
- De backend onthoudt het antwoord op een vraag 10 minuten (max. 200 vragen, `searchCache.ts`). Hoofdletters, dubbele spaties
  en een `?` aan het eind maken geen verschil. De project- en locatienamen horen bij de sleutel.
- Een mislukt antwoord wordt niet onthouden.

**Reden:** M-003 in [[04 - Meetresultaten]]: dezelfde vraag gaf zonder dit 2 van de 8 keer andere filters. Een herhaalde vraag
is nu gegarandeerd gelijk, direct en gratis.

## B-017 — Zoeken snapt woordvormen, en een vangnet voor het type (28-10-2026)

**Besluit:**
- **Woordvormen:** de materialenpagina zoekt per woord. Het woord mag letterlijk voorkomen, of als woordstam aan het begin of
  eind van een woord (`searchMatch.ts`: staal/stalen, glas/glazen, steen/baksteen). Dit vervangt het letterlijke zoeken van B-015.
- **Filteren in één functie:** het filteren staat in `filterMaterials.ts`, zodat slim zoeken dezelfde regels gebruikt.
- **Vangnet:** vindt slim zoeken niets door het type, terwijl de zoekwoorden zonder type wél iets vinden, dan valt het type weg
  en zegt de uitleg dat (`dropTypeIfEmpty`).

**Reden:** M-003. "staal" vond "Stalen" niet, en het type is een keuze in de data die het model niet kan weten (koper onder
metaal, lampen onder armaturen). De AI stelt voor, de code controleert.

## Na de volgende fases

De overige D-besluiten (D1 voor zoeken, D8) komen hier zodra ze vastliggen, als B-018 en verder. D1 is voor foto's
beantwoord door B-012; zoeken blijft Luna.
