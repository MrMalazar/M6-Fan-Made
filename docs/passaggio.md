# Passaggio

Un mondo nato col modulo `wod5e-mage` si porta nel sistema senza rifarlo. Il
passaggio lavora su una copia del mondo. L'originale resta com'era, col suo
sistema `wod5e` e il suo modulo, e si può riaprire quando si vuole.

Serve Foundry 14 e il sistema dalla versione 0.6.0.

## Esame

Prima di copiare niente si può guardare che cosa il passaggio farebbe. Si
apre il mondo del modulo da Narratore, si preme F12 e nella console si
incolla questa riga.

```js
(await import("/systems/m6/scripts/passaggio/esegui.js")).apri();
```

Si apre una finestra coi conti di quello che passerebbe e con l'elenco di
quello che resterebbe com'è. L'esame non scrive niente. Il sistema deve
essere installato in quel Foundry, anche se il mondo non lo usa.

## Copia

A Foundry spento, o almeno col mondo chiuso, si copia la cartella del mondo
dentro `Data/worlds` e alla copia si dà un nome nuovo, per esempio da
`cronaca` a `cronaca-m6`. Nella copia si apre `world.json` con un editor di
testo e si cambiano queste voci.

| Voce | Valore |
| :--- | :--- |
| `id` | Il nome della cartella nuova |
| `title` | Un titolo che distingua la copia |
| `system` | `m6` |
| `systemVersion` | La versione del sistema installata, per esempio `0.6.0` |
| `packs`, ogni voce | `"system": "m6"` al posto di `"system": "wod5e"` |

Il resto del file non si tocca.

## Giri

Si apre la copia e si entra da Narratore, a tavolo vuoto. Foundry apre il
mondo ma non le schede, perché hanno un tipo che il sistema non conosce.
Il sistema se ne accorge e mostra la finestra «Passaggio dal modulo», coi
conti e due tasti. «Più tardi» chiude la finestra e non tocca niente. «Porta
il mondo» fa il passaggio.

Il passaggio va a giri. Dopo ogni giro la pagina si ricarica da sola e il
lavoro riprende, quindi basta aspettare.

| Giro | Cosa succede |
| :--- | :--- |
| Primo | Le schede prendono il tipo e i dati del sistema. Passano i messaggi della chat, i diari, le macro, le tavole e gli oggetti del mondo |
| Secondo | A schede aperte si tolgono gli oggetti che il sistema non ha, poi passano le scene coi segnalini |
| Ultimo | La pagina fresca non trova più niente da fare. Passano le impostazioni e si scrive il rapporto |

Un passaggio interrotto, per una pagina chiusa o una connessione caduta,
riprende da dove era alla prossima entrata del Narratore.

## Regole

| Cosa c'era | Cosa diventa |
| :--- | :--- |
| Scheda `mortal`, `vampire`, `ghoul`, `hunter`, `werewolf` | Mago |
| Scheda `spc` | PNG, con la scheda del nemico |
| Scheda `group` | Resta com'è. Nel mondo c'è ancora, ma non si vede |
| Bandiere e impostazioni del modulo | Le stesse, sotto il nome del sistema |
| Rimandi ai compendi e ai file del modulo, in diari, macro e chat | Puntano ai compendi e ai file del sistema |
| Tiri salvati in chat | Si leggono con la carta del sistema. I dadi usciti non cambiano |
| Abilità che il sistema non ha più | Finiscono nel rapporto coi loro pallini, da travasare a mano |
| Condizioni scritte a mano coi dadi in meno | Tolte ai Maghi e scritte nel rapporto. Nel sistema quei dadi pesano sul tiro, e una Condizione vecchia comincerebbe a contare da sola |
| Tratti a dadi di un PNG | Casi della scheda del nemico. Un tratto col nome di una Sfera accende il Dominio |
| Oggetti di un tipo che il sistema non ha, come poteri e tiri su misura | Tolti dalle schede. Nome e dati restano nel registro della scheda |
| Barre dei segnalini sulla Salute di wod5e | Sulla Salute del sistema. Le altre barre di wod5e si spengono |

Quello che il passaggio toglie da una scheda resta scritto nella scheda
stessa, in `flags.m6.passaggio`, insieme al tipo che aveva e alla data.

## Rapporto

Alla fine si apre il rapporto. Resta nel mondo, in un diario che si chiama
«Passaggio dal modulo, rapporto del» seguito dalla data. La prima pagina ha
i conti e gli elenchi. La seconda riporta per intero i testi che la scheda
nuova non mostra, come la biografia e le note di wod5e.

Dopo il passaggio restano da fare a mano tre cose, e il rapporto le elenca
scheda per scheda.

1. Travasare i pallini delle Abilità che non hanno più una casella.
2. Riscrivere le Condizioni tolte che valgono ancora.
3. Controllare il campo di ogni caso nato da un tratto o da una riserva.

Se il rapporto ha la sezione «File che non rispondono», il mondo cerca nel
sistema immagini o suoni che non ci sono. Vanno ricaricati o sostituiti.

## Inciampi

Se dopo quattro giri c'è ancora qualcosa da fare, il passaggio si ferma e
lo dice. Il rapporto ha allora due sezioni in più. «Errori» porta il nome
del documento e quello che Foundry ha risposto, «Non ancora portati» elenca
quello che manca. Il resto del mondo è passato comunque. Corretta la causa,
il passaggio si riapre dalla console.

```js
game.m6.passaggio.apri();
```

Tre cose restano come sono, per scelta.

| Cosa | Perché |
| :--- | :--- |
| Le impostazioni di `wod5e` | Non le legge più nessuno e non danno fastidio |
| Quello che un segnalino legato alla scheda portava di suo | Foundry lo tiene da parte e non lo lascia ritoccare. Torna in gioco solo se il segnalino viene slegato |
| Le schede e gli oggetti senza un posto nel sistema | Restano nei dati del mondo. A ogni avvio la console li nomina fra gli errori, senza conseguenze |
