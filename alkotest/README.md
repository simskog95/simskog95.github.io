# Alkoflash

Träningsapp för **kunskapsprov om alkohollagstiftningen** – provet du måste klara för att få serveringstillstånd för alkohol på restaurang.

123 frågor uppdelade på provets tre delområden: alkoholpolitik, servering och tillsyn.

## Använda appen

Öppna `index.html` i en webbläsare. Inget att installera, ingen server, inget internet.

På startskärmen väljer du:

- **Kategorier** – en, två eller alla tre. Knapparna *Alla* och *Inga* snabbar upp.
- **Antal kort** – 10, 20, 30, 50 eller alla tillgängliga.
- **Läge** – *Flashkort* (tänk efter, visa sedan svaret) eller *Quiz* (fyra svarsalternativ).

Knappen *Allt, blandat* startar alla 123 frågor i slumpad ordning.

Korten blandas alltid, och i quizläget slumpas även ordningen på svarsalternativen.

### Flashkort

Frågan visas först. Tryck **Visa svar** (eller mellanslag) för att se svaret, förklaringen och lagrummet. Bedöm dig själv med **Kunde inte** / **Kunde**.

### Quiz

Välj bland de fyra alternativen. Du får rätt svar, en förklaring och lagrummet direkt.

### Efter ett pass

Du får resultat i procent, uppdelat per delområde, plus en lista över frågorna du missade. Därifrån kan du repetera bara felen, köra samma kort igen eller starta ett nytt pass.

### Tangentbord

| Tangent | Funktion |
| --- | --- |
| `Mellanslag` / `Enter` | Visa svar, eller gå vidare |
| `1` / `2` | *Kunde inte* / *Kunde* (flashkort) |
| `1`–`4` | Välj svarsalternativ (quiz) |
| `Esc` | Avbryt passet |

## Om provet

- Tre delområden: alkoholpolitik, servering och tillsyn.
- Godkänt kräver minst 75 % rätta svar **i varje delområde**.
- Resultatet gäller i fem år. Ett prov och två omprov ingår i ansökan.
- Provet finns på svenska, engelska och arabiska.

Frågorna är eget studiematerial och **inte officiella provfrågor** – de riktiga är sekretessbelagda. Kontrollera alltid mot gällande lagtext och Folkhälsomyndighetens föreskrifter.

Källor: [Alkohollag (2010:1622)](https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/alkohollag-20101622_sfs-2010-1622) och [Folkhälsomyndigheten – kunskapsprov om alkohollagstiftning](https://www.folkhalsomyndigheten.se/kunskapsprov-om-alkohollagstiftning/).

## Ändra frågebanken

Frågorna ligger i `data/questions.json`. Efter varje ändring:

```bash
python3 scripts/build.py                # bäddar in frågorna i index.html
python3 scripts/validate-questions.py   # kontrollerar formatet
```

`index.html` är en enda självständig fil: frågorna bäddas in i ett `<script id="alkoflash-data">`-block så att appen fungerar offline. Redigera därför alltid `data/questions.json` – inte det inbäddade blocket.

Vill du bara ändra utseende eller beteende? Redigera CSS/JS direkt i `index.html`; det påverkas inte av bygget.

```bash
deno run --allow-read scripts/smoke-test.js   # valfritt UI-test, kräver Deno
```
