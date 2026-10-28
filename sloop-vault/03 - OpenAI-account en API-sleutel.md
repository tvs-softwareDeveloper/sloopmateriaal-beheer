# Sloopmateriaal-beheer — OpenAI-account en API-sleutel (fase 0, jij)

> 28-10-2026. Dit is fase 0 van [[01 - Plan van aanpak AI-koppeling]]: wat jij moet regelen voordat ik kan bouwen.
> Accounts aanmaken en betalen doe jij; dat mag ik niet voor je doen. Duurt ongeveer 15 minuten.
> De menunamen kunnen iets afwijken: OpenAI past het dashboard vaak aan. Zoek dan op het woord tussen aanhalingstekens.

## Goed om te weten vooraf

- **ChatGPT Plus is iets anders dan de API.** Een ChatGPT-abonnement geeft geen API-tegoed: de API heeft een eigen account op
  het ontwikkelaarsplatform en een eigen tegoed (vooraf betalen).
- **Minimaal $5.** Betalen gaat in dollars, met een gewone creditcard of debitcard (geen prepaid card). Tegoed vervalt na een jaar
  en krijg je meestal niet terug.
- **$5 is ruim genoeg** voor het hele plan, inclusief de metingen met Terra (schatting: samen < $2).

## Stap 1 — Account

1. Ga naar **platform.openai.com** en log in. Heb je al een ChatGPT-account, dan kun je dat gebruiken; het platform is wel apart.
2. Volg de eerste stappen (naam organisatie: bv. je eigen naam).

## Stap 2 — Project aanmaken

1. Linksboven staat de **projectkiezer** (meestal "Default project"). Klik erop → **"Create project"**.
2. Naam: `sloopmateriaal-beheer`.
3. Werk vanaf nu in dit project. Zo staan sleutel, kosten en limiet van deze app los van alles wat je later nog bouwt
   (bijvoorbeeld Bomb Pass).

## Stap 3 — Tegoed kopen

1. Ga naar **Settings → "Billing"** (instellingen van de organisatie).
2. **"Add payment details"** / **"Add to credit balance"** → vul je kaart in.
3. Bedrag: **$5** (het standaardbedrag is $10, zet het op 5).
4. ⚠️ **Zet "auto recharge" / "auto reload" UIT.** Die staat standaard **aan** en koopt dan zelf bij als je tegoed laag is.

## Stap 4 — Limiet op het project

1. Kies het project `sloopmateriaal-beheer` → **"Limits"**.
2. **"Monthly spend limit"**: `$5`.
3. **"Alert when spend reaches"**: `$2` (je krijgt dan een mail).
4. Zet de **harde limiet** aan als je die optie ziet. Bij de grens geeft de API dan een foutmelding (429) in plaats van door te gaan.
   Het afremmen gebeurt niet op de seconde: je kunt er een paar cent overheen gaan.

## Stap 5 — API-sleutel maken

1. In het project: **"API keys"** → **"Create new secret key"**.
2. Naam: `sloop-backend-werklaptop`. Project: `sloopmateriaal-beheer`. Rechten: **"All"** is voor nu prima.
3. **Kopieer de sleutel meteen.** Je ziet hem maar één keer (hij begint met `sk-`).

## Stap 6 — Sleutel en database in `backend/.env`

`backend/.env` bestaat nog niet. Maak hem zelf aan:

1. Kopieer `backend/.env.example` naar `backend/.env` (in dezelfde map).
2. Vul hem zo in. Laat `AI_MODEL_...` gewoon zo staan:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=jouw-mysql-wachtwoord
DB_NAME=develop_materials_app
PORT=3000
PUBLIC_HOST=http://localhost:3000

# OpenAI (fase 1 van het AI-plan). Nooit committen, nooit in de frontend.
OPENAI_API_KEY=sk-...jouw-sleutel...
AI_MODEL_PHOTO=gpt-6-luna
AI_MODEL_SEARCH=gpt-6-luna
```

3. **Database:** de service **MySQL80** draait al op deze laptop. Open **MySQL Workbench** → maak het schema
   `develop_materials_app` → voer `backend/database.sql` uit (die maakt de tabel `materials`).

### Regels voor de sleutel

- ❌ **Niet in de chat plakken.** Ik heb hem niet nodig: de backend leest hem uit `.env`. Ik controleer alleen óf de regel er staat,
  zonder hem te tonen.
- ❌ **Niet in de frontend.** Alles met `VITE_` komt in de JavaScript van de browser terecht.
- ❌ **Niet committen.** `.env` staat al in `.gitignore` (gecontroleerd op 28-10-2026).
- ❌ **Niet met `setx` als Windows-variabele zetten**, wat de quickstart van OpenAI voorstelt. Dan kan elk programma op je laptop
  erbij; in `.env` geldt hij alleen voor deze backend.
- 🚨 **Uitgelekt?** (per ongeluk gecommit, gedeeld, in een screenshot) → in hetzelfde scherm "API keys" de sleutel **intrekken**
  ("Revoke") en een nieuwe maken. Daarna alleen `.env` aanpassen.

## Klaar? Laat het me weten

Zeg "fase 0 klaar". Dan start fase 1 (**Opus 5.5 · high**) en draai ik als eerste de rooktest `npm run ai:ping`. Die laat alleen
"ok", het model en het aantal tokens zien.

## Bronnen

- Tegoed vooraf betalen: https://help.openai.com/en/articles/8264778-what-is-prepaid-billing
- Limieten: https://developers.openai.com/api/docs/guides/spend-limits
- Quickstart (sleutel, `OPENAI_API_KEY`): https://developers.openai.com/api/docs/quickstart
