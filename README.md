# Minorkeuze semester 2: wat horen jullie?

Nederlandstalige webapp voor leercoaches Tourism Management bij Inholland.
De server bewaart alle antwoorden, reacties en herkenningen in één echte SQLite-database. Alle bezoekers van dezelfde server zien dezelfde gegevens. Er zijn geen accounts nodig.

## Starten

Vereist: Node.js 24 of nieuwer. Er zijn geen npm-afhankelijkheden en er is geen `npm install` nodig.

```sh
git clone https://github.com/eelcobrancart/KOM_vraag_TM.git
cd KOM_vraag_TM
npm start
```

Open http://localhost:3000. De server maakt bij de eerste start `data/tm.sqlite` aan en past `migrations/001-init.sql` toe. Stop met Ctrl+C en start opnieuw: alle bijdragen blijven bestaan. Node kan een melding tonen dat de ingebouwde SQLite-module experimenteel is; de app gebruikt de ingebouwde Node 24-module.

## Delen met collega's

Er is **nog geen openbare hosting of gedeelde internetlink ingesteld**. De code is functioneel met gedeelde opslag, maar deze oplevering is geen gepubliceerde website.

Voor een korte test op hetzelfde vertrouwde netwerk: start de app op één computer en deel `http://<IP-adres-van-die-computer>:3000`. Zorg dat inkomend verkeer naar poort 3000 is toegestaan. Iedere collega gebruikt diezelfde server. `localhost` verwijst op ieder apparaat naar dat apparaat en is dus geen deelbare link.

Voor normaal gebruik:

1. Plaats deze map op één Node.js 24-server of gebruik de meegeleverde Docker-configuratie.
2. Zorg voor een blijvende, beschrijfbare datamap. Bewaar deze buiten tijdelijke releases. Gebruik één serverinstantie met één lokale database; gebruik geen netwerkfilesystem of losse databases per replica.
3. Koppel een domein en HTTPS via de hostingprovider of reverse proxy. Stel `APP_ORIGIN` in op de exacte publieke oorsprong, bijvoorbeeld `https://tm-inzichten.voorbeeld.nl` (zonder afsluitende slash), en `COOKIE_SECURE=true`.
4. Start de server blijvend als service en deel de HTTPS-link. Er zijn geen databaseaccounts, API-sleutels of andere geheimen nodig.

Omgevingsvariabelen:

| Variabele | Standaard | Betekenis |
| --- | --- | --- |
| `PORT` | `3000` | Luisterpoort |
| `HOST` | `0.0.0.0` | Luisteradres |
| `DATA_DIR` | `./data` naast `server.mjs` | Blijvende map voor SQLite |
| `APP_ORIGIN` | `http://` + aangevraagde host | Exacte oorsprong voor controle van schrijfacties; verplicht instellen achter HTTPS-proxy |
| `COOKIE_SECURE` | `false` | Zet op `true` bij HTTPS |

### Docker

```sh
docker compose up --build -d
```

Open http://localhost:3000. Het volume `tm-data` bewaart de database bij het opnieuw bouwen en starten. Verwijder dit volume niet. Stel voor een andere host de variabelen hierboven in, bijvoorbeeld via een `.env` naast `compose.yaml`:

```dotenv
APP_ORIGIN=https://tm-inzichten.voorbeeld.nl
COOKIE_SECURE=true
```

Plaats bij deze configuratie een HTTPS-proxy vóór poort 3000. Docker is meegeleverd als startoptie; de Docker-build is hier niet getest.

## Werking en toegang

- Alle bezoekers kunnen meteen alle antwoorden en reacties lezen; de app zegt expliciet dat iedereen met de link dit kan.
- Naam is verplicht, wordt niet geverifieerd en wordt op het apparaat onthouden via localStorage. Bijdragen staan uitsluitend in de serverdatabase.
- Reacties staan onder hun antwoord, met één niveau.
- Een willekeurige HttpOnly-browsercookie beperkt herkenningen tot één per browser en antwoord. Herkenningen kunnen worden ingetrokken. Cookie wissen of een andere browser gebruiken geeft een nieuwe identiteit: dit is geen verificatie per persoon.
- Nieuwste eerst is standaard; sorteren op meest herkend is beschikbaar. De app haalt elke acht seconden gegevens op en bewaart ondertussen ingevulde reactieformulieren en toetsenbordfocus.
- Datum en tijd worden getoond in de tijdzone Europe/Amsterdam.
- Servervalidatie, lengtegrenzen, voorbereide SQL-queries, unieke verzendcodes en unieke browserherkenningen voorkomen lege invoer en dubbele opslag bij opnieuw verzenden. Bij netwerkfouten blijft de tekst in het formulier staan. Herladen vóór succesvol verzenden bewaart niet-verzonden tekst niet.
- Gebruikersinvoer wordt als tekst weergegeven, nooit als HTML. Een Content Security Policy blokkeert scripts uit invoer. Schrijfacties vereisen JSON en dezelfde oorsprong. Er is een beperkte frequentiebegrenzing per browser.
- De database is alleen bereikbaar via de server. Er zijn geen publieke API-bewerkingen om bestaande antwoorden of reacties te wijzigen of verwijderen. Een browser kan alleen zijn eigen herkenning toevoegen of intrekken. De servergebruiker moet als enige bij de datamap kunnen.
- De link is geen toegangsbeveiliging. Namen zijn zelf ingevuld. Deel geen herkenbare studentgegevens, zoals ook in de app staat.

## Controleren

```sh
npm test
```

De integratietest gebruikt een tijdelijke echte database en twee onafhankelijke HTTP-sessies met aparte cookies. Gecontroleerd: leeg overzicht, antwoord plaatsen, zichtbaarheid in de andere sessie, reageren, herhaalde verzending, herkenning geven en intrekken, begrenzing per browser, lege/te lange invoer, verkeerde oorsprong, ontbrekend antwoord, blokkering van wijzigen/verwijderen, beveiligingsheaders en gegevensbehoud na een echte serverherstart. Testdata komen niet in de normale database.

**Resultaat bij oplevering: geslaagd.** Ook de syntaxis van server en frontend is gecontroleerd.

**Testbeperking:** geen interactieve browser-, mobiele scherm- of toetsenbordtest uitgevoerd. Het benodigde browserbedieningstool was in de bouwomgeving niet beschikbaar. Er is nog geen hosting of browserpreview opgeleverd.

Handmatige browseracceptatie na starten:

1. Open de app in een gewone browser en een privévenster; lees zonder eerst een antwoord te geven.
2. Plaats in het eerste venster een inzicht met naam. Controleer de bevestiging en de zichtbaarheid in het tweede venster binnen acht seconden.
3. Reageer in het tweede venster en controleer naam, datum/tijd en groepering.
4. Geef daar een herkenning, klik opnieuw om deze in te trekken en controleer het aantal in beide vensters.
5. Herlaad beide vensters: gegevens blijven staan, de eerder ingevulde naam staat klaar. Test ook op een telefoon en met Tab/Enter.
6. Onderbreek de verbinding tijdens verzenden: tekst blijft staan en opnieuw proberen slaat dezelfde verzending niet dubbel op.

## Back-up en beheer

Gebruik bijvoorbeeld de SQLite-back-upfunctie voor een consistente liveback-up. Of stop de app netjes en kopieer de gehele datamap naar een veilige locatie. Test herstel voordat je een oude back-up verwijdert. Serveer de datamap nooit als statische bestanden. Voor correcties of verwijdering is bewuste beheeractie op de serverdatabase nodig; de bezoekersinterface biedt dit niet.
