# Maghi 6ª Edizione - Fan Made

Il sistema di gioco di Maghi 6ª Edizione (M6) per Foundry Virtual Tabletop.
Prende il posto del modulo `wod5e-mage`, che poggiava sul sistema `wod5e`.
Qui dati, schede, dado e tiro sono di M6 da cima a fondo.

## Stato

Prima tappa, le fondamenta.

| Pezzo | Cosa c'è |
| :--- | :--- |
| Mago | I nove Attributi, le quattordici Abilità e la Salute |
| PNG | Le tre riserve (Fisico, Sociale, Mentale) e la Salute |
| Tiro | Si tira tutta la riserva in d10 e si contano i successi contro la soglia. Senza soglia il tiro non parte |
| Carta | In chat dice con cosa si è tirato, mostra i dadi, conta successi, soglia e margine, e chiude con la fascia dell'esito |
| Schede | Nude. Il nome di un tratto lo mette nel tiro, i pallini ne cambiano il valore |
| Telefono | Su uno schermo stretto una pagina sola prende il posto di Foundry |

Il dado ha la faccia vuota da 1 a 5, la scintilla da 6 a 9 e la stellina sul 10.
La scintilla vale un successo. Le stelline contano a coppie, 4 successi la
coppia e 1 la spaiata.

Le schede vere, il Narratore, gli oggetti e l'interfaccia dell'app arrivano
nelle tappe dopo.

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
tirare, la soglia, il tasto e l'elenco dei tiri di tutti.

In fondo alla pagina «Foundry intero» riporta all'interfaccia di Foundry per
quella visita. La scelta fissa sta nelle impostazioni del sistema, alla voce
«Pagina del telefono», e vale per il dispositivo. Le voci sono tre, cioè
solo sugli schermi stretti, sempre e mai.

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

Guarda la sintassi di ogni file e fa girare le prove in `tests/`. Le prove
coprono le regole del tiro sugli esempi del Sistema, la Salute, la carta, la
scelta del telefono, i modelli delle schede e il pacchetto com'è su disco.
`tests/finta/` tiene una Foundry finta, quanto basta per caricare il sistema
fuori da Foundry.

Un rilascio parte da un tag `x.y.z` senza «v», uguale alla versione scritta
in `system.json`, e lo costruisce GitHub Actions.

## Avviso

Maghi 6ª Edizione è un lavoro di fan, gratuito e non ufficiale. Non è
affiliato a Paradox Interactive né approvato da Paradox Interactive, a cui
appartengono Mage: The Ascension e il Mondo di Tenebra.
