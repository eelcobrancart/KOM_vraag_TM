# Minorkeuze semester 2: wat horen jullie?

Nederlandstalige webapp voor leercoaches Tourism Management bij Inholland.
De publieke versie gebruikt **GitHub Pages + Supabase**. Iedereen met de link kan direct lezen, antwoorden, reageren en herkenningen geven of intrekken. Er zijn geen accounts nodig.

## Website publiceren: nog één instelling

De publicatiebestanden zijn voorbereid in `docs/`. De online API en gedeelde database zijn ingesteld en getest.

1. Open https://github.com/eelcobrancart/KOM_vraag_TM/settings/pages
2. Kies onder **Build and deployment → Source**: **Deploy from a branch**.
3. Kies onder **Branch**: **main**, en als map **/docs**.
4. Klik **Save**. Wacht tot GitHub de publicatie heeft afgerond (meestal enkele minuten).
5. Open de door GitHub bevestigde website-URL en deel die met collega's:
   https://eelcobrancart.github.io/KOM_vraag_TM/

De URL hierboven is het verwachte adres; totdat Pages is ingeschakeld en de bouw geslaagd is, kan deze een 404 tonen. Kijk bij **Actions** naar de taak `pages build and deployment` als de site nog niet verschijnt. Laat HTTPS ingeschakeld als GitHub die optie toont.

**GitHub Pages host de website. Supabase bewaart de bijdragen.** Alleen Pages inschakelen zonder de bijbehorende API/database levert geen werkende gedeelde app op. Deze backend is al ingericht in het gekoppelde project `ageaxnonkvrrnnvvsiyq`.

## Bestanden en wijzigingen

- `public/`: bronbestanden van de interface.
- `scripts/build-pages.mjs`: maakt de zelfstandige Pages-versie met relatieve assetpaden en Content Security Policy.
- `docs/`: gegenereerde Pages-bestanden; deze map staat in GitHub en wordt gepubliceerd.
- `supabase/functions/tm-kom-api/index.ts`: publieke API met servervalidatie en beperkte schrijfbewerkingen.
- `supabase/config.toml`: accountvrije toegang tot deze functie, zoals de app vereist.
- `database/tm_kom_schema.sql`: bootstrap-schema dat online is toegepast als migratie `tm_kom_shared_storage`.
- `server.mjs`, `migrations/001-init.sql`: optionele zelfstandige Node/SQLite-versie voor lokaal gebruik.

Na wijzigen van de interface:

```sh
npm run build:pages
npm test
```

Commit zowel `public/` als de opnieuw gegenereerde `docs/` naar `main`. GitHub publiceert de wijzigingen zodra Pages is ingeschakeld. Voor alleen bouwen is Node.js 24 nodig; er zijn geen npm-afhankelijkheden en `npm install` is niet nodig.

De Pages-configuratie bevat uitsluitend de publieke API-URL. **Er staan geen geheime sleutels in frontendcode of GitHub.** De serverfunctie leest `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` uit de door Supabase beheerde runtime.

## Gedeelde opslag en toegang

De drie tabellen `tm_kom_insights`, `tm_kom_comments` en `tm_kom_recognitions` staan in Postgres. Row Level Security is ingeschakeld. Rechtstreekse tabeltoegang en de interne snapshotfunctie zijn ingetrokken voor `anon` en `authenticated`. De Edge Function biedt uitsluitend lezen, invoegen en toevoegen/intrekken van de eigen browserherkenning. Er bestaat geen bezoekers-API om bestaande antwoorden of reacties te wijzigen of verwijderen.

De browser bewaart lokaal de naam en een willekeurige browsercode. De server slaat voor herkenningen uitsluitend een SHA-256-hash van die code op; hashes worden niet naar bezoekers teruggestuurd. De database dwingt één herkenning per browsercode en antwoord af. Cookie-/browsergegevens wissen of een andere browser gebruiken levert een nieuwe identiteit op. Dit is bewust geen verificatie per persoon.

Unieke verzendcodes voorkomen dubbele opslag bij opnieuw proberen. Invoer wordt op server en database gevalideerd en in de interface uitsluitend als tekst weergegeven. CORS accepteert de publieke oorsprong `https://eelcobrancart.github.io`; bij een eigen domein moet die configuratie worden aangepast en de functie opnieuw uitgerold. CORS is geen authenticatie: de API is bewust publiek en ook buiten een browser benaderbaar. Namen worden niet geverifieerd.

De interface ververst elke acht seconden, bewaart formuliertekst bij opslaan-fouten en behoudt reactiedrafts tijdens verversen. Na herladen blijft opgeslagen data bestaan; niet-verzonden formuliertekst wordt niet bewaard. Datum/tijd staat in Europe/Amsterdam.

De API heeft een extra begrenzing van 40 schrijfacties per minuut per browser per serverinstantie. De unieke databasebeperking voor herkenningen en dubbele verzending blijft ook gelden bij meerdere instanties.

De Supabase security advisor geeft alleen een informatieve melding dat RLS aanstaat zonder policies. Dat is hier bewust: de tabellen zijn voor bezoekers volledig afgesloten, en alleen de beperkte server-API heeft toegang. Achtergrond: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Uitgevoerde controles

De online Supabase-API is getest met twee onafhankelijke browsercodes: antwoord plaatsen en in de andere sessie ophalen, reactie plaatsen, opnieuw verzenden zonder dubbele opslag, herkenning geven en intrekken, nieuwe verzoeken zonder gegevensverlies, afwijzen van lege tekst en verkeerde oorsprong, blokkering van wijzigen/verwijderen en CORS-preflight. **Geslaagd.** De eigen tijdelijke testbijdragen zijn na afloop verwijderd.

De zelfstandige Node-versie heeft daarnaast een integratietest met echte SQLite-opslag, twee HTTP-sessies en een volledige serverherstart: `npm test`. **Geslaagd.**

**Verificatiegrens:** interactieve browser-, mobiele scherm- en toetsenbordtests zijn nog niet uitgevoerd doordat het browserbedieningstool in de bouwomgeving niet beschikbaar is. De Pages-website kan pas definitief worden gecontroleerd nadat de eigenaar bovenstaande Pages-instelling heeft opgeslagen.

Handmatige acceptatie na publicatie:

1. Open de website in een gewoon venster en een privévenster, zonder eerst een antwoord te geven.
2. Plaats een inzicht met naam en controleer de bevestiging; binnen acht seconden staat het ook in het andere venster.
3. Reageer vanuit het tweede venster, geef een herkenning en trek die weer in.
4. Herlaad beide vensters en controleer dat alle bijdragen bewaard blijven.
5. Controleer de interface op telefoon en met Tab/Enter. Onderbreek tijdelijk de verbinding om te controleren dat tekst bij fouten blijft staan.

## Lokaal starten (optioneel)

```sh
git clone https://github.com/eelcobrancart/KOM_vraag_TM.git
cd KOM_vraag_TM
npm start
```

Open http://localhost:3000. Deze zelfstandige variant gebruikt `data/tm.sqlite`, **een andere database dan de online Supabase-versie**. De map wordt automatisch aangemaakt. De oorspronkelijke Node/Docker-optie blijft bruikbaar voor eigen hosting.

| Variabele | Standaard | Betekenis voor de Node-versie |
| --- | --- | --- |
| `PORT` | `3000` | Luisterpoort |
| `HOST` | `0.0.0.0` | Luisteradres |
| `DATA_DIR` | `./data` naast server.mjs | Blijvende SQLite-map |
| `APP_ORIGIN` | `http://` + aangevraagde host | Exacte publieke oorsprong; instellen bij eigen HTTPS-proxy |
| `COOKIE_SECURE` | `false` | Zet op true bij HTTPS |

Docker: `docker compose up --build -d`. Het volume `tm-data` bewaart de lokale SQLite-database. Docker is als optie meegeleverd en is hier niet getest. Node 24 kan melden dat de ingebouwde SQLite-module experimenteel is.

## Beheer

Bewaar bijdragen nooit in GitHub. Voor back-ups, gegevenscorrecties en verwijdering gebruikt de beheerder het Supabase-dashboard of gecontroleerde databasebeheeracties. De bezoekersinterface biedt bewust geen beheerfuncties. Controleer in Supabase welke back-upmogelijkheden en gebruikslimieten bij je bestaande abonnement horen. Deel geen namen of herkenbare gegevens van studenten.
