# Sloopmateriaal-beheer — Meetresultaten

> Metingen van de AI-functies. Elke meting: datum, wat er getest is, de cijfers en wat we ermee besloten.
> Fase 6 van [[01 - Plan van aanpak AI-koppeling]] vult dit aan met de volledige testset.

## M-001 — Planken tellen op een stapelfoto (28-10-2026)

**Aanleiding:** Tristan testte "Nieuw via foto" op de laptop. Alles werkte, behalve het aantal. Hij wil een telling volgens
"hoogte (lagen) × breedte (planken per laag)".

**Foto:** stapel gebruikte vloerdelen ("JOCKIS"-stempel), schuin van voren, 2000 × 1500 px (`1793195368843-l7w89f.jpeg` in
`backend/public/uploads/`). Twee bundels op elkaar, gescheiden door latjes, met sterk verspringende planken. Dat is een lastige foto.

**Echte telling (Tristan): ongeveer 168 planken.** Claudes eigen schatting uit vergrote uitsneden (180–230) zat te hoog.

**Varianten (elk 3×, `detail: high`, 3.539 input-tokens per foto):**

| Variant | Uitkomst (3 runs) | Opbouw | Duur | Kosten nieuwe foto |
|---|---|---|---|---|
| **V0 zoals nu** (Luna, vrije tekst `quantity_hint`) | "ruim 100" · "honderden" · "enkele tientallen" | — | 3,4–4,5 s | $0,0004 |
| V1 tellen, uitweg "none" toegestaan (Luna/Terra, met of zonder denken) | 12× "niet betrouwbaar te tellen" | — | 3–12 s | — |
| **V1** tellen verplicht (Luna, `none`) | 175 · 280 · 240 | 1 stapel, 30–35 × 5–8 | 3,2–4,1 s | $0,00046 |
| **V2** tellen verplicht (Luna, `low`) | 175 · 175 · 175 | 1 stapel, 35 × 5 | 3,7–4,4 s | $0,0005 |
| **V3** tellen verplicht (Terra, `none`) | 174 · 186 · 168 | **2 bundels**, 13–15 + 15–16 × 6 | 3,2–4,1 s | $0,0047 |
| **V4** tellen verplicht (Terra, `low`) | 224 · 217 · 174 | **2 bundels**, 14–15 + 15–17 × 6–7 | 3,9–7,3 s | $0,005 |

Bij herhaling is een foto goedkoper: OpenAI cachet de invoer, zie de lage bedragen van run 2 en 3 in het log.
De hele meting kostte ongeveer $0,03.

**Wat dit laat zien:**
1. **Het lag vooral aan onze vraag, niet aan het model.** V0 vroeg om een "rough count" en zei erbij dat tellen nooit exact is.
   Het model gokte daardoor in woorden ("honderden"). Met een vaste telmethode (lagen langs de linkerrand, dan planken in één
   goed zichtbare laag) komen alle varianten op 170–280 uit, rond de referentie.
2. **Een uitweg wordt altijd gekozen.** Mag het model "kan niet tellen" zeggen, dan doet het dat, ook Terra. Bij een stapel moet
   een schatting daarom verplicht zijn, met een aparte zekerheid (`count_confidence`). De gebruiker corrigeert het getal toch.
3. **Luna met denken (`low`) is het stabielst** (3× 175), maar ziet één stapel van 35 lagen en mist de twee bundels.
4. **Terra ziet de opbouw zoals een mens** ("boven 15 lagen × 6, onder 16 × 6") en is zonder denken redelijk stabiel
   (168–186). Die opbouw is belangrijk: zo kan de gebruiker het getal in één oogopslag op de foto nachecken. Terra kost wel
   10× zoveel: ongeveer een halve cent per foto.
5. Alle varianten gaven hier zekerheid `low`, en dat klopt bij deze foto.

**Besluit (Tristan, 28-10-2026):** D11 en D12 zoals voorgesteld, vastgelegd als B-011 en B-012:
- tellen via secties (lagen × breedte), de code rekent;
- het aantal ingevuld met een AI-label en de opbouw eronder;
- Terra voor foto's, Luna voor de rest.

### Nameting met de echte code (28-10-2026, na de bouw)

De productiecode (`analyzePhoto`) 5× per model op dezelfde foto, met **168** als waarheid:

| Model | 5 runs | Gemiddeld | Gem. afwijking | Opbouw | Kosten nieuwe foto |
|---|---|---|---|---|---|
| **Terra, `none`** (gekozen) | 180 · 174 · 174 · 180 · 174 | 176 | **8 (5%)** | 2 bundels: 14 × 6 + 15–16 × 6 | ~$0,0047 |
| Luna, `low` | 140 · 120 · 175 · 175 · 175 | 157 | 19 (12%) | 1 stapel: 30–35 × 4–5 | ~$0,0005 |

Daarnaast één run via de browser ("Nieuw via foto"): **203** (14 × 6 + 17 × 7), een uitschieter waarbij de onderste bundel
7 breed werd. In het formulier stond: *"AI telde: 14 × 6 + 17 × 7 = 203 (controleer dit aantal)"*. Juist die opbouw maakt
zo'n fout op de foto zichtbaar.

**Conclusie:** Terra telt deze stapel binnen ~5%, en stabiel. Luna met nadenken zit er gemiddeld verder naast en springt
tussen 120 en 175. De keuze voor Terra (B-012) klopt voor deze foto.

**Open:** meer stapelfoto's (andere materialen, rechte stapels, pallets) in de testset van fase 6.

## M-002 — Slim zoeken op de demodata (28-10-2026)

**Opzet:** echte vragen via `POST /ai/search` (Luna, `none`). De filters zijn op de 40 demomaterialen toegepast zoals de pagina
dat in fase 5 doet: elk zoekwoord moet voorkomen, plus de vier nieuwe filters. Script: scratchpad `searchTry.mjs`.

**Ronde 1 (eerste instructie):** de filters klopten. Wel gaf "goedkoopste radiatoren" alleen "sanitair", waardoor er ook wc's
en wastafels meekwamen. Een extra regel ("zet bij een specifiek product ook het woord in search") hielp niet. Vijf
**voorbeelden** in de instructie wel, getest nadat een vastgelopen oude server was opgeruimd.

**Ronde 2 en 3 (met voorbeelden), 18 vragen:**

| Vraag | Filters | Gevonden |
|---|---|---|
| goedkoopste radiatoren | radiator · plumbing · price | 1 ✔ |
| eiken balken | eiken balk · wood | 1 ✔ |
| deuren die nog te koop zijn | deur · wood · for_sale | 1 ✔ |
| alle hout | wood | 6 ✔ |
| wat ligt er in loods A onder de 30 euro | Loods A · max 30 | 6 ✔ |
| houten balken in goede staat van project Zwolle onder 50 euro | balk · wood · good · max 50 · Zwolle-Zuid | 0 ✔ (bestaat niet in de data) |
| goedkope dakpannen *(geen voorbeeld)* | dakpan · roofing · price | 1 ✔ |
| kranen en wastafels *(geen voorbeeld)* | kraan wastafel · plumbing | 1 ✔ |
| stalen balken *(geen voorbeeld)* | balk · metal | 1 ✔ |
| lampen in redelijke staat *(geen voorbeeld)* | lamp · electrical · fair | 0 ✗ (heet "Lichtarmaturen") |
| cheapest doors *(Engels)* | deur · wood · price | 1 ✔ |
| wat is er gerecycled | recycled | 4 ✔ |
| wat staat er te koop in loods B | for_sale · Loods B | 4 ✔ |
| show me broken glass | glas · glass · poor | 1 ✔ |
| stenen uit dalfsen | steen · brick · Dalfsen | 1 ✔ |
| verwijder alles | geen filters, "Ik kan alleen materialen doorzoeken" | ✔ veilig |

**Uitkomst:**
- 17 van 18 goed. Per vraag ~1,3 s (één uitschieter van 3–9 s) en ~$0,00013, ongeveer 1.000 input-tokens met de namenlijsten.
- Een commando ("verwijder alles") doet niets: het model kan alleen filters teruggeven.

**Bekende grenzen:**
- **Synoniemen:** "lamp" vindt "armatuur" niet.
- **"en"-vragen:** meerdere zoekwoorden moeten allemaal voorkomen, dus bij "kranen en wastafels" alleen een item met allebei.
- **Prijsgrens:** "onder 30" telt €30 nog mee.

Kandidaten voor fase 6: synoniemen of "één van deze woorden" in het schema.

## M-003 — Zelfde vraag, ander antwoord ("alle stalen materialen") (28-10-2026)

**Aanleiding:** Tristan zag dat "kun je alle stalen materialen zoeken" de ene keer alle stalen materialen gaf en de andere keer
niets.

**Gemeten, 8× dezelfde vraag (oude situatie):**
- 6× `search=staal + type=metal` → **0 gevonden**
- 2× alleen `type=metal` → 5 gevonden, maar ook koper, zink en aluminium

**Twee oorzaken:**
1. **Het model is niet elke keer hetzelfde** (standaard-temperature).
2. **"staal" vindt "Stalen" niet.** De pagina zocht letterlijk naar het stukje tekst, en in het Nederlands verandert het woord
   (staal → stalen).

Daarnaast bleek het **type** de zwakke plek. Hoe een materiaal is ingedeeld is een keuze in de data, die het model niet kan weten:
de koperen waterleiding staat onder metaal, de AI gokt sanitair. De lichtarmaturen staan onder armaturen, de AI gokt elektra.

**Aanpak (B-016, B-017):**

| Laag | Wat | Waarom |
|---|---|---|
| Code (frontend) | Zoeken snapt woordvormen (`searchMatch.ts`): staal/stalen, balk/balken, glas/glazen, steen/baksteen. Een woordstam alleen aan het begin of eind van een woord | Betrouwbaar en getest. "In het midden" gaf een valse treffer: "stal" in "in**stal**lateur" |
| Code (frontend) | **Vangnet:** vindt slim zoeken niets door het type, terwijl de zoekwoorden zonder type wél iets vinden, dan valt het type weg, met een melding | De AI stelt voor, de code controleert |
| Model | `temperature: 0` voor zoeken | Minder wisselende antwoorden. Luna accepteert het bij reasoning `none` |
| Backend | **Cache:** dezelfde vraag (ook met andere hoofdletters, spaties of een `?`) krijgt 10 min hetzelfde antwoord | Zelfde vraag = zelfde resultaat; ook 0 ms en gratis |
| Prompt | Een materiaalwoord (staal, koper, eiken) gaat in `search`, zonder type tenzij er een categorie genoemd wordt. Balken kunnen hout of staal zijn | Minder foute types |

**Na de aanpak (zonder cache, dus het model zelf):**
- "kun je alle stalen materialen zoeken": **8× hetzelfde, 4 terechte treffers** (stalen HEA-balken, stalen trapleuning,
  stelconplaten "met stalen rand", kapstokken "stevig staal").
- stalen balken / eiken balken / balken: 3× gelijk, 1 / 1 / 2 ✔.
- koperen leidingen 1 ✔, goedkoopste radiatoren 1 ✔.

**In de browser:**
- De tweede keer kwam dezelfde vraag uit de cache.
- "lampen in redelijke staat" gaf eerst 0. Nu 1 (Lichtarmaturen TL), via het vangnet, met de melding *"(Gezocht zonder de soort
  'Elektrisch': daarmee was er niets.)"*.

**Les (M-003):** helemaal voorspelbaar wordt een taalmodel niet. Je maakt het betrouwbaar door de AI een kleine taak te geven (filters
voorstellen), door het belangrijkste in code te doen (matchen, controleren) en door te laten zien wat de AI begreep (chips en uitleg).

## M-004 — Synoniemen: drie routes vergeleken (28-10-2026)

**Aanleiding:** Tristan vroeg of de AI niet gewoon alle info van de materialen kan doorzoeken, en of het zoeken nu goed werkt
voor elk soort materiaal en voor synoniemen ("stalen pijpen" met type metaal).

**Opzet:**
- 12 vragen met synoniemen of overkoepelende woorden op de 40 demomaterialen, en per vraag de materialen die een mens zou
  verwachten (samen 23).
- Alles met Luna (`none`, temperature 0), behalve C.
- Scripts in de scratchpad: `synonymTry.ts`, `synonymCompare.ts` en `synonymCompareA.ts`.

| Route | Hoe | Gevonden | Onterecht erbij | Per vraag | Data naar OpenAI |
|---|---|---|---|---|---|
| **Nu** (één zoekwoord + vangnet) | de AI geeft één woord, de code zoekt | 10/23 | 1 | ~$0,00013 | alleen de vraag + project-/locatienamen |
| **A. Synoniemgroepen** | de AI geeft per begrip een groepje woorden ("verwarming": radiator, cv, ketel, kachel …), de code zoekt "één uit elke groep" | **21/23**, met strengere regel **20/23** | 13, met strengere regel **10** (6 daarvan uit één groepeerfout) | ~$0,00004 | alleen de vraag |
| **B. Alles naar de AI** | alle materialen (id, naam, type, notities) gaan mee, de AI kiest de id's | 19/23 | **3** | ~$0,00006 (bij 40 materialen) | **de hele voorraad, bij elke vraag** |
| **C. Embeddings** (`text-embedding-3-small`) | materiaal en vraag als vector, de code pakt de dichtstbijzijnde | 10/23 | 20 | ~$0 (eenmalig $0,00002 voor 40 materialen) | naam + notities, eenmalig |

**Wat er per vraag misging (nu):**
- "verlichting", "verwarming", "ramen" en "wc's" vonden **niets**: in de data heet het lichtarmaturen, radiatoren, kozijnen,
  toiletpotten.
- "buizen" en "planken" vonden de helft.

**Beoordeling:**
- **A** vindt het meest en houdt de voorraad lokaal.
  - Zwakke plek 1: te brede woorden. "licht" vond ook "**licht** roestig". Een regel "geen algemene woorden" hielp.
  - Zwakke plek 2: groepeerfouten. Bij "steel pipes" stonden "staal" en "buis" in één groep, dus "staal óf buis". Een
    voorbeeld in de instructie kan dat oplossen.
  - De overige extra's zijn verdedigbaar (hardstenen dorpels bij "stenen", een boiler bij "verwarming").
- **B** (Tristans idee) is het preciest, maar:
  1. de hele voorraad gaat bij elke vraag naar OpenAI (botst met B-014);
  2. de kosten en de wachttijd groeien mee: bij 5.000 materialen ~190.000 tokens per vraag, ~$0,02 en enkele seconden;
  3. notities in de prompt zijn een ingang voor prompt-injectie;
  4. de AI kan materialen overslaan zonder dat je het ziet.

  Voor 40 materialen werkt het prima, voor een echt bedrijf niet.
- **C** werkt hier slecht. Losse Nederlandse woorden en korte teksten liggen voor dit model te dicht bij elkaar: "ramen" kwam
  uit bij dakpannen, en de scores lagen allemaal tussen 0,2 en 0,6. Bruikbaar maken vraagt een groter model, rijkere teksten en
  een combinatie met zoeken op woorden. Dat is meer werk dan het hier oplevert.

**Advies: route A bouwen** (D13 in het plan). Daarbij:
- de regel "geen algemene woorden";
- een voorbeeld met twee groepen ("stalen pijpen": [staal] + [pijp, buis, leiding]);
- de groepen als chip tonen ("Zoeken: radiator / cv / ketel"), zodat je ziet wat de AI bedacht.

B en C zijn goede gesprekspunten: "ik heb drie routes gemeten en bewust gekozen".
