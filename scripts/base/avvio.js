/**
 * La base del sistema di Foundry: quello che serve a ogni scheda e a ogni
 * tiro, e che non è una regola di M6.
 *
 *   i dati       i due tipi di scheda (Mago e PNG), i cinque tipi di oggetto, il tiro della 0.1.0
 *   i dadi       il dado della riserva e il tiro con la sua carta in chat
 *   gli oggetti  una scheda sola per tutti i tipi
 *   la chat      il ritratto di chi parla accanto al nome
 *   il telefono  la pagina stretta al posto di Foundry intero
 *
 * Le schede del Mago e del PNG, con tutte le regole, le registra main.js.
 */
import { PEZZI_COMUNI, registraAiuti } from "./aiuti.js";
import { vestiChiParla } from "./chi-parla.js";
import { ID } from "./costanti.js";
import { registraDadi } from "./dadi.js";
import { MagoData, OGGETTI, PngData, TiroData } from "./dati.js";
import { registraIconeDelTipo } from "./icone-tipo.js";
import { SchedaOggetto } from "./scheda-oggetto.js";
import { porta, registraTelefono, telefonoAlPronto, telefonoAlSetup } from "./telefono.js";
import { registraTiro } from "./tiro-m6.js";
import { tira, vestiCarta } from "./tiro-semplice.js";

Hooks.once("init", () => {
  // I dati.
  Object.assign(CONFIG.Actor.dataModels, { mago: MagoData, png: PngData });
  Object.assign(CONFIG.Item.dataModels, OGGETTI);
  Object.assign(CONFIG.ChatMessage.dataModels, { tiro: TiroData });
  // Chi crea una scheda nuova parte dal Mago.
  CONFIG.Actor.defaultType = "mago";

  // I dadi e il tiro.
  registraDadi();
  registraTiro();

  // I modelli: gli aiuti e i pezzi comuni.
  registraAiuti(globalThis.Handlebars);
  foundry.applications.handlebars.loadTemplates([...PEZZI_COMUNI]);

  // La scheda degli oggetti.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Item, ID, SchedaOggetto, { label: "M6.Comuni.Oggetto.Scheda", makeDefault: true });

  // Armi e armature create senza immagine prendono quella del loro genere.
  registraIconeDelTipo();

  // L'ingresso dal telefono: impostazioni, e la scelta fra pagina e Foundry intero.
  registraTelefono();

  // Per le macro e per la console: game.m6.tira(attore, { attributo, abilita, soglia }).
  // `game.m6.telefono` è la porta dove un pacchetto a parte mette la sua interfaccia.
  game.m6 = { tira, telefono: porta };
});

// Il segnalino di un Mago è il Mago stesso: quello che gli succede sulla mappa resta sulla scheda.
Hooks.on("preCreateActor", (actor, dati) => {
  if (actor.type !== "mago" || dati?.prototypeToken?.actorLink !== undefined) return;
  actor.updateSource({ "prototypeToken.actorLink": true });
});

Hooks.once("setup", telefonoAlSetup);
Hooks.once("ready", telefonoAlPronto);

// La carta del tiro semplice si veste a ogni disegno del messaggio.
Hooks.on("renderChatMessageHTML", vestiCarta);
// Chi parla ha il suo ritratto accanto al nome.
Hooks.on("renderChatMessageHTML", vestiChiParla);
