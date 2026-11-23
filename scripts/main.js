/**
 * Maghi 6ª Edizione - Fan Made: il sistema di gioco per Foundry VTT.
 *
 * Prima tappa, le fondamenta: i due tipi di scheda (Mago e PNG) coi loro
 * dati, il dado e il tiro di M6, la carta in chat, due schede nude e
 * l'ingresso dal telefono.
 */
import { ID } from "./costanti.js";
import { MagoData, PngData, TiroData } from "./dati.js";
import { SchedaMago, SchedaPng } from "./scheda.js";
import { registraTelefono, telefonoAlPronto, telefonoAlSetup } from "./telefono.js";
import { tira, vestiCarta } from "./tiro.js";

Hooks.once("init", () => {
  // I dati: due tipi di scheda e il tiro in chat.
  Object.assign(CONFIG.Actor.dataModels, { mago: MagoData, png: PngData });
  Object.assign(CONFIG.ChatMessage.dataModels, { tiro: TiroData });
  // Chi crea una scheda nuova parte dal Mago.
  CONFIG.Actor.defaultType = "mago";

  // Le schede.
  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(Actor, ID, SchedaMago, { types: ["mago"], label: "M6.Scheda.Mago", makeDefault: true });
  DocumentSheetConfig.registerSheet(Actor, ID, SchedaPng, { types: ["png"], label: "M6.Scheda.Png", makeDefault: true });

  // L'ingresso dal telefono: impostazioni, e la scelta fra pagina e Foundry intero.
  registraTelefono();

  // Per le macro e per la console: game.m6.tira(attore, { attributo, abilita, soglia }).
  game.m6 = { tira };
});

Hooks.once("setup", telefonoAlSetup);
Hooks.once("ready", telefonoAlPronto);

// La carta del tiro si veste a ogni disegno del messaggio.
Hooks.on("renderChatMessageHTML", vestiCarta);
