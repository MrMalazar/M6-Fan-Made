# Maghi 6ª Edizione - Fan Made

Il sistema di gioco di Maghi 6ª Edizione (M6) per Foundry Virtual Tabletop.
Prende il posto del modulo `wod5e-mage`, che poggiava sul sistema `wod5e`.
Qui dati, schede, dado e tiro sono di M6 da cima a fondo.

## Stato

Quarta tappa, gli oggetti. La scheda e le regole del modulo sono nel sistema,
su una base scritta da capo; gli strumenti del Narratore sono stati provati
con due utenti collegati insieme; gli oggetti hanno la loro scheda.

| Pezzo | Cosa c'è |
| :--- | :--- |
| Mago | La scheda a nove pagine, cioè Stat, Tratti, Magick, Formule, Credo, Bussola, Sfida, Esperienza e Note |
| Tiro | Il tiro di Abilità e il lancio di Magick, con Specializzazioni, Condizioni, soglia, dadi rossi e Volontà |
| Carta | In chat mostra con cosa si è tirato, i dadi, i successi contro la soglia e la fascia dell'esito |
| Oggetti | Pregi, Difetti, Background, Condizioni, armi, armature ed equipaggiamento. Una scheda sola, coi campi di ogni tipo presi da una tavola: danno, portata, rarità, grado di Background, punti armatura, usi |
| Compendi | Quindici, dai Vantaggi all'Equipaggiamento alla Bussola |
| PNG | La scheda del nemico, con le tre riserve, i casi, la Salute e la Natura |
| Narratore | Il Quadro col menù circolare, il verdetto sui tiri dei giocatori, le Condizioni dal Master, il Vathrâ e la Salute sulle barre dei token |
| Telefono | Su uno schermo stretto una pagina sola prende il posto di Foundry |

Il dado ha la faccia vuota da 1 a 5, la scintilla da 6 a 9 e la stellina sul 10.
La scintilla vale un successo. Le stelline contano a coppie, 4 successi la
coppia e 1 la spaiata.

La prossima tappa è l'interfaccia dell'app sul telefono.

## Installazione

Serve Foundry Virtual Tabletop 14. Dalla schermata di Setup si apre «Game
Systems», poi «Install System», e nel campo del manifesto si incolla questo
indirizzo.

```text
https://github.com/MrMalazar/M6-Fan-Made/releases/latest/download/system.json
```

Poi si crea un mondo che usa il sistema «Maghi 6ª Edizione - Fan Made».

## Telefono

Chi entra da un telefono usa lo stesso indirizzo e lo stesso utente di
sempre. Il sistema riconosce lo schermo stretto, spegne la mappa e al posto
dell'interfaccia di Foundry mostra una pagina sola, con la scheda da cui
tirare, la soglia, il tasto e l'elenco dei tiri.

In fondo alla pagina «Foundry intero» riporta all'interfaccia di Foundry per
quella visita. La scelta fissa sta nelle impostazioni del sistema, alla voce
«Pagina del telefono», e vale per il dispositivo. Le voci sono tre, cioè
solo sugli schermi stretti, sempre e mai.

## Impianto

Il sistema è fatto per cambiare un pezzo senza toccare gli altri.

| Cartella | Cosa tiene |
| :--- | :--- |
| `scripts/base/` | Quello che parla con Foundry e non è una regola. Dati, dadi, tiro, scheda di base, oggetti, telefono |
| `scripts/base/tratti.js` | La tavola degli Attributi e delle Abilità. Dati, pallini e tiri la leggono da qui |
| `scripts/base/campi-oggetto.js` | La tavola dei campi degli oggetti, tipo per tipo. La scheda degli oggetti disegna quello che trova lì |
| `scripts/attore.js` | L'attore del sistema: la Salute come la leggono le barre dei token |
| `scripts/sistema.js` | Il motore delle regole del tiro, senza niente di Foundry |
| `scripts/data/` | I cataloghi, cioè poteri, Formule, Condizioni, Strumenti e menù del Paradosso |
| `scripts/sheets/` | Le due schede, il Mago e il nemico |
| `templates/actor/parts/` | I riquadri della scheda, un file per riquadro |
| `tools/` | Gli attrezzi che rigenerano cataloghi e compendi dalle loro sorgenti |

I tratti stanno nei campi della scheda (`system.attributes`, `system.skills`).
Il resto del Mago sta nelle bandiere `flags.m6`, senza schema, così una regola
che cambia non chiede una migrazione dei mondi.

## Sviluppo

La cartella va messa, o collegata, dentro i dati di Foundry.

```text
<dati di Foundry>/Data/systems/m6
```

Il controllo intero gira con Node 22.

```text
npm ci
npm run check
```

Guarda la sintassi di ogni file e fa girare le prove in `tests/`. Quelle in
`tests/base/` provano la base, le altre le regole e le schede. `tests/finta/`
tiene una Foundry finta, quanto basta per far girare le schede fuori da
Foundry.

Un rilascio parte da un tag `x.y.z` senza «v», uguale alla versione scritta
in `system.json`, e lo costruisce GitHub Actions.

## Crediti

Le icone delle mosse del menù circolare vengono da Game-icons
(https://game-icons.net), di Lorc, Delapouite e degli altri autori del sito,
con licenza CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Sono
prese da `@iconify-json/game-icons`. L'elenco di quelle in uso sta in
`tools/dati/icone_game_icons.json`.

## Avviso

Maghi 6ª Edizione è un lavoro di fan, gratuito e non ufficiale. Non è
affiliato a Paradox Interactive né approvato da Paradox Interactive, a cui
appartengono Mage: The Ascension e il Mondo di Tenebra.
