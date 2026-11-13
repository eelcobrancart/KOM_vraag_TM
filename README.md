# TM Minorkeuze semester 2: wat horen jullie?

Nederlandstalige webapp voor leercoaches Tourism Management bij Inholland.
De publieke versie gebruikt **GitHub Pages + Supabase**. Iedereen met de link kan direct lezen, antwoorden, reageren en herkenningen geven of intrekken. Er zijn geen accounts nodig.

## Versie 3

Het logo, de kleinere titel en de taalwissel staan samen in de magenta balk. Via het vlaggetje wisselt de volledige interface tussen Nederlands en Engels, inclusief labels, statussen, tellers en datums. De taalkeuze blijft bewaard op het apparaat. Bijdragen blijven in de taal waarin ze zijn geschreven. Bij wisselen blijven ingetypte teksten staan.

Vanaf 700 pixels schermbreedte staan het formulier en het bijdragenoverzicht in twee aparte kolommen. Op telefoons staan ze onder elkaar. De titel blijft op computer en tablet op één regel; op telefoons mag deze omslaan om leesbaar te blijven. ‘Reageer’ is een magenta knop met witte tekst. De asset-URL’s bevatten nu inhoudshashes zodat gewijzigde CSS en JavaScript opnieuw geladen worden.

Per antwoord blijven vier onafhankelijk aan- en uitzetbare icoontjes met gedeelde tellers beschikbaar: 👍 Dit herken ik, ✅ Mee eens, 😢 Jammer en 😊 Mooi. De al opgeslagen bijdragen en herkenningen blijven behouden.

## Eigen bijdrage verwijderen

Bij nieuw geplaatste inzichten verschijnt **Verwijder mijn bijdrage** uitsluitend in de browser waarmee het inzicht is geplaatst. De server bewaart daarvoor een SHA-256-hash van de bestaande willekeurige browsercode; de hash wordt niet naar bezoekers teruggestuurd. Het tonen van de knop is geen beveiligingsgrens: de server controleert het eigenaarschap opnieuw voor iedere verwijdering.

Na bevestiging worden het inzicht, alle bijbehorende tekstreacties en alle icoonreacties in één databasetransactie verwijderd. Een andere browser kan dit niet doen door dezelfde naam of verzendcode te gebruiken. De knop en bevestiging zijn beschikbaar in Nederlands en Engels. Andere bezoekers zien de verwijdering bij de volgende verversing.

Voor bijdragen van vóór deze wijziging is geen eigenaar vastgelegd. Deze kunnen daarom alleen via beheer worden verwijderd. Wissen van browsergegevens, een privévenster of een andere browser levert een andere browsercode op en geeft geen toegang tot eerdere eigen bijdragen. De app biedt geen account of herstelmogelijkheid voor die code.

## Automatische databasecontrole

De automatische taak **TM-databasecontrole** staat ingeschakeld voor dagelijks 08:00 en 20:00, tijdzone Europe/Amsterdam. De planning loopt via de ingebouwde automatische taken, onafhankelijk van de repositoryactiviteit op GitHub. Er is geen account bij cron-job.org gebruikt.

Elke controle roept deze URL aan met een unieke queryparameter:

```text
https://ageaxnonkvrrnnvvsiyq.supabase.co/functions/v1/tm-kom-api/api/health
```

Deze route voert via de server één echte databaseleesopdracht uit op `tm_kom_insights` (`select=id&limit=1`). De response bevat uitsluitend `{"ok":true}` als de database bereikbaar is. Er worden geen bijdragen of reacties aangemaakt of gewijzigd, geen persoonsgegevens teruggestuurd en geen browsercodes aangemaakt. De response wordt niet gecachet. Databasefouten geven een HTTP-foutstatus in plaats van een onterechte succesmelding.

De taak probeert bij een fout eenmaal opnieuw en meldt alleen blijvende fouten aan de beheerder. Bij geslaagde controles volgt geen melding. De website voor bezoekers blijft hetzelfde. De eerste rechtstreekse online controle is geslaagd; toekomstige geplande uitvoeringen moeten nog plaatsvinden. Beheer of pauzeer de planning via de automatische taak ‘TM-databasecontrole’.

Dit ondersteunt dagelijkse activiteit op het gratis Supabase-abonnement. Het is geen beschikbaarheidsgarantie of back-up: automatische taken kunnen mislukken of worden uitgeschakeld. Een betaald Supabase-abonnement is de route om automatisch pauzeren wegens inactiviteit uit te sluiten. Zie https://supabase.com/docs/guides/platform/free-project-pausing

## Website publiceren / Pages-instelling

De publicatiebestanden staan in `docs/`. De online API en gedeelde database zijn ingesteld en getest. Pages is al actief; onderstaande instellingen zijn ter referentie.

1. Open https://github.com/eelcobrancart/KOM_vraag_TM/settings/pages
2. Kies onder **Build and deployment → Source**: **Deploy from a branch**.
3. Kies onder **Branch**: **main**, en als map **/docs**.
4. Klik **Save**. Wacht tot GitHub de publicatie heeft afgerond (meestal enkele minuten).
5. Open de door GitHub bevestigde website-URL en deel die met collega's:
   https://eelcobrancart.github.io/KOM_vraag_TM/

De URL hierboven is het verwachte adres; totdat Pages is ingeschakeld en de bouw geslaagd is, kan deze een 404 tonen. Kijk bij **Actions** naar de taak `pages build and deployment` als de site nog niet verschijnt. Laat HTTPS ingeschakeld als GitHub die optie toont.

**GitHub Pages host de website. Supabase bewaart de bijdragen.** Alleen Pages inschakelen zonder de bijbehorende API/database levert geen werkende gedeelde app op. Deze backend is al ingericht in het gekoppelde project `ageaxnonkvrrnnvvsiyq`.

## Bestanden en wijzigingen

- `public/`: bronbestanden, het logo `tm-logo.svg` en de vertalingen in `i18n.js`.
- `scripts/build-pages.mjs`: maakt de zelfstandige Pages-versie met relatieve assetpaden en Content Security Policy.
- `docs/`: gegenereerde Pages-bestanden; deze map staat in GitHub en wordt gepubliceerd.
- `supabase/functions/tm-kom-api/index.ts`: publieke API met servervalidatie en beperkte schrijfbewerkingen.
- `supabase/config.toml`: accountvrije toegang tot deze functie, zoals de app vereist.
- `database/tm_kom_schema.sql`: oorspronkelijke bootstrap, toegepast als `tm_kom_shared_storage`.
- `database/tm_kom_reaction_options.sql`: aanvullende schemawijziging voor de icoontjes, toegepast als `tm_kom_reaction_options`.
- `database/tm_kom_ownership.sql`: aanvullende eigenaarschapskolom en beperkte, atomaire verwijderfunctie, toegepast als `tm_kom_ownership`. Pas voor een nieuwe omgeving deze drie SQL-bestanden in de genoemde volgorde toe.
- `server.mjs`, `migrations/001-init.sql` en `migrations/002-emotions.sql`, `migrations/003-ownership.sql`: optionele zelfstandige Node/SQLite-versie voor lokaal gebruik.

Na wijzigen van de interface:

```sh
npm run build:pages
npm test
```

Commit zowel `public/` als de opnieuw gegenereerde `docs/` naar `main`. GitHub publiceert de wijzigingen zodra Pages is ingeschakeld. Voor alleen bouwen is Node.js 24 nodig; er zijn geen npm-afhankelijkheden en `npm install` is niet nodig.

De Pages-configuratie bevat uitsluitend de publieke API-URL. **Er staan geen geheime sleutels in frontendcode of GitHub.** De serverfunctie leest `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` uit de door Supabase beheerde runtime.

## Gedeelde opslag en toegang

De vier tabellen `tm_kom_insights`, `tm_kom_comments`, `tm_kom_recognitions` en `tm_kom_emotions` staan in Postgres. Row Level Security is ingeschakeld. Rechtstreekse tabeltoegang en de interne snapshotfunctie zijn ingetrokken voor `anon` en `authenticated`. De Edge Function biedt uitsluitend lezen, invoegen en toevoegen/intrekken van de eigen browserherkenning. Bezoekers kunnen bestaande tekst niet wijzigen. Alleen de eigenaar van een nieuw inzicht kan via de beperkte verwijder-API zijn eigen inzicht en de onderliggende thread verwijderen; de server controleert de browsercode.

De browser bewaart lokaal de naam en een willekeurige browsercode. De server slaat voor eigenaarschap en herkenningen uitsluitend een SHA-256-hash van die code op; hashes worden niet naar bezoekers teruggestuurd. De database dwingt één selectie per icoontje, browsercode en antwoord af. Cookie-/browsergegevens wissen of een andere browser gebruiken levert een nieuwe identiteit op. Dit is bewust geen verificatie per persoon.

Unieke verzendcodes voorkomen dubbele opslag bij opnieuw proberen. Invoer wordt op server en database gevalideerd en in de interface uitsluitend als tekst weergegeven. CORS accepteert de publieke oorsprong `https://eelcobrancart.github.io`; bij een eigen domein moet die configuratie worden aangepast en de functie opnieuw uitgerold. CORS is geen authenticatie: de API is bewust publiek en ook buiten een browser benaderbaar. Namen worden niet geverifieerd.

De interface ververst elke acht seconden, bewaart formuliertekst bij opslaan-fouten en behoudt reactiedrafts tijdens verversen. Na herladen blijft opgeslagen data bestaan; niet-verzonden formuliertekst wordt niet bewaard. Datum/tijd staat in Europe/Amsterdam.

De API heeft een extra begrenzing van 40 schrijfacties per minuut per browser per serverinstantie. De unieke databasebeperking voor herkenningen en dubbele verzending blijft ook gelden bij meerdere instanties.

De Supabase security advisor geeft alleen een informatieve melding dat RLS aanstaat zonder policies. Dat is hier bewust: de tabellen zijn voor bezoekers volledig afgesloten, en alleen de beperkte server-API heeft toegang. Achtergrond: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Uitgevoerde controles

De online Supabase-API is getest met twee onafhankelijke browsercodes: antwoord plaatsen en in de andere sessie ophalen, reactie plaatsen, opnieuw verzenden zonder dubbele opslag, herkenning geven en intrekken, nieuwe verzoeken zonder gegevensverlies, afwijzen van lege tekst en verkeerde oorsprong, blokkering van wijzigen en verwijderen door een andere browser en CORS-preflight. **Geslaagd.** De eigen tijdelijke testbijdragen zijn na afloop verwijderd. Voor versie 2 zijn alle vier icoontjes daarnaast getest op onafhankelijk selecteren, herhaald klikken zonder dubbele telling, gedeelde aantallen, intrekken zonder andere browsers te raken en behoud van de eerdere duimpjes.

De zelfstandige Node-versie heeft daarnaast een integratietest met echte SQLite-opslag, twee HTTP-sessies en een volledige serverherstart: `npm test`. **Geslaagd.**

Het verwijderen van een eigen inzicht is online met twee onafhankelijke browsersessies getest: de eigenaar mag verwijderen, een andere browser niet, ook niet met dezelfde naam of een herhaalde verzendcode. Reacties en herkenningen verdwijnen mee, andere bijdragen blijven staan en de eigenaarshash is afgeschermd. Lokaal zijn daarnaast oude bijdragen zonder eigenaar en het behoud van verwijdering na een serverherstart getest.

De taalwissel is aanvullend getest op vertalingen, vlag/knoplabel, onthouden van de voorkeur, behoud van de ingevulde naam, labels in reactietemplates en cachecodes voor alle Pages-assets.

**Verificatiegrens:** interactieve browser-, mobiele scherm- en toetsenbordtests zijn nog niet uitgevoerd doordat het browserbedieningstool in de bouwomgeving niet beschikbaar is. Pages is inmiddels actief; de publicatie wordt aanvullend gecontroleerd door de gepubliceerde HTML, CSS en scripts op te halen.

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

Bewaar bijdragen nooit in GitHub. Voor back-ups, gegevenscorrecties en verwijdering gebruikt de beheerder het Supabase-dashboard of gecontroleerde databasebeheeracties. De bezoekersinterface biedt alleen verwijderen van een eigen nieuw inzicht, met bevestiging; bredere beheerfuncties blijven op de server. Controleer in Supabase welke back-upmogelijkheden en gebruikslimieten bij je bestaande abonnement horen. Deel geen namen of herkenbare gegevens van studenten.
