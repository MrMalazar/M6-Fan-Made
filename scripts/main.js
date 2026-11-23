// La base viene prima: i dati, i dadi, gli oggetti e il telefono si registrano prima delle regole.
import "./base/avvio.js";
import { registerActorCreationChoice } from "./actor-creation.js";
import { registraAttore } from "./attore.js";
import { MODULE_ID } from "./constants.js";
import { isMageActor, registerMageDiceRendering } from "./mage-dice.js";
import { registerParadoxDice } from "./paradox-dice.js";
import { registerLineageSpheres } from "./famiglie.js";
import { registerRollCardRendering } from "./roll-card.js";
import { assignCondizione, listCondizioni, openCondizioniMaster, selectedActors } from "./condizioni-master.js";
import { CONDIZIONI_VERSIONE, CONDIZIONI_VERSIONE_SETTING, findCondizione, riallineaCondizioni } from "./condizioni.js";
import { registerVolonta } from "./volonta.js";
import { registerRossi } from "./rossi.js";
import { registerDanni } from "./danni.js";
import { registerAvanzamenti } from "./formule-avanzamenti.js";
import { registerIndulgere } from "./indulgere.js";
import { registerSaggezza } from "./wisdom.js";
import { registerPrezzo } from "./prezzo.js";
import { registerUstione } from "./ustione.js";
import { registerParadossoNarratore } from "./paradosso-narratore.js";
import { registerQuadroNarratore } from "./quadro-narratore.js";
import { registerGrimorioComune } from "./grimorio-comune.js";
import { registraSocketVerdetto, TIRO_NARRATORE_SETTING } from "./verdetto-narratore.js";
import { SCALA_PREDEFINITA, SCALA_SETTING, TEMA_CHIARO, TEMA_SCURO, TEMA_SETTING } from "./tema.js";
import { registraCreazioneGuidata } from "./creazione-guidata-finestra.js";
import { MageActorSheet } from "./sheets/mage-actor-sheet.js";
import { NemicoSheet } from "./sheets/nemico-sheet.js";
import { POTERI_MOD_SETTING } from "./poteri-mod.js";
import { POTERI_ALLINEATI_SETTING, riallineaPoteriDelMondo } from "./poteri-allinea.js";
import { registraNemicoChat } from "./nemico-chat.js";
import { registraHelperIcone } from "./icone-oggetti.js";
import { apriVathra, mandaVathra, registraVathra } from "./vathra/traduttore.js";
import { traduciTesto } from "./vathra/vathra.js";
import { registraNomiScheda } from "./nomi-scheda.js";

/**
 * Le porte del sistema per le macro e per la console: stanno in `game.m6`,
 * accanto al tiro semplice della base.
 */
function createApi() {
  return {
    id: MODULE_ID,

    get version() {
      return game.system.version ?? "0.0.0";
    },

    isMage(actor) {
      return isMageActor(actor);
    },

    /** Il Vathrâ (25/9): il traduttore, la carta in chat, la traduzione nuda per le macro. */
    vathra: Object.freeze({
      apri: apriVathra,
      manda: mandaVathra,
      traduci: traduciTesto
    }),

    /** Le Condizioni per il Master: la finestra, o l'assegnazione diretta. */
    condizioni: Object.freeze({
      assign: openCondizioniMaster,
      list: listCondizioni,
      async toggle(id, actors = selectedActors(canvas?.tokens?.controlled)) {
        const entry = findCondizione(id);
        if (!entry) throw new Error(`Condizione sconosciuta: ${id}`);
        return assignCondizione(actors, entry);
      }
    })
  };
}

function debug(message, ...data) {
  if (!game.settings.get(MODULE_ID, "debugLogging")) return;
  console.debug(`${MODULE_ID} | ${message}`, ...data);
}

Hooks.once("init", () => {
  console.info(`${MODULE_ID} | Initializing`);

  // L'attore del sistema: la Salute come la leggono le barre dei token.
  registraAttore();

  // L'icona propria di un oggetto nella pagina Tratti (23/9): l'immagine del
  // Rifugio, la lettera solo per chi ha il segnaposto.
  registraHelperIcone(globalThis.Handlebars);

  // Each player picks how the header Wheel dresses: arc or compact bar.
  game.settings.register(MODULE_ID, "headerWheelMode", {
    name: "M6.Settings.HeaderWheelMode.Name",
    hint: "M6.Settings.HeaderWheelMode.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      wheel: "M6.Settings.HeaderWheelMode.Wheel",
      bar: "M6.Settings.HeaderWheelMode.Bar"
    },
    default: "wheel"
  });

  // La modalità chiara (16/9): il tema della scheda del Mago, per giocatore.
  // Si gira anche dal tasto accanto ai tre pallini della finestra; cambiando,
  // riveste le schede aperte senza render.
  game.settings.register(MODULE_ID, TEMA_SETTING, {
    name: "M6.Settings.SheetTheme.Name",
    hint: "M6.Settings.SheetTheme.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      [TEMA_SCURO]: "M6.Settings.SheetTheme.Scuro",
      [TEMA_CHIARO]: "M6.Settings.SheetTheme.Chiaro"
    },
    default: TEMA_SCURO,
    onChange: (value) => MageActorSheet.applicaTemaOvunque(value)
  });

  // La misura del testo (16/9 sera): piccolo, medio, grande; una scala sul
  // contenuto della finestra, ogni cosa tiene la sua proporzione. Si gira
  // anche dal tasto a sinistra di quello del tema.
  game.settings.register(MODULE_ID, SCALA_SETTING, {
    name: "M6.Settings.SheetScale.Name",
    hint: "M6.Settings.SheetScale.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      piccolo: "M6.Scala.Piccolo",
      medio: "M6.Scala.Medio",
      grande: "M6.Scala.Grande"
    },
    default: SCALA_PREDEFINITA,
    onChange: (value) => MageActorSheet.applicaScalaOvunque(value)
  });

  // Le Abilità tutte in fila (16/9 sera): il tasto accanto al + della prima pagina.
  // Le modifiche di base dei poteri (Blue, 27/9): il Narratore le scrive, valgono per tutti; le schede aperte si ridisegnano.
  // «Dal Narratore» (Blue, 27/9): il tiro passa dal Narratore o parte subito; la scelta di chi tira, per client.
  game.settings.register(MODULE_ID, TIRO_NARRATORE_SETTING, { scope: "client", config: false, type: Boolean, default: true });
  game.settings.register(MODULE_ID, POTERI_MOD_SETTING, {
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: () => {
      for (const app of foundry.applications?.instances?.values?.() ?? []) {
        if (app instanceof MageActorSheet && app.rendered) app.render();
      }
    }
  });
  // Le Condizioni riallineate alla regola di base del 29/9 (una volta per mondo, dal Narratore).
  game.settings.register(MODULE_ID, CONDIZIONI_VERSIONE_SETTING, { scope: "world", config: false, type: String, default: "" });
  // Il catalogo dei poteri a cui le schede sono allineate (30/9): quando il catalogo cambia, al primo avvio si riallineano.
  game.settings.register(MODULE_ID, POTERI_ALLINEATI_SETTING, { scope: "world", config: false, type: String, default: "" });
  game.settings.register(MODULE_ID, "skillsFlat", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "debugLogging", {
    name: "M6.Settings.DebugLogging.Name",
    hint: "M6.Settings.DebugLogging.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    MODULE_ID,
    MageActorSheet,
    {
      types: ["mago"],
      label: "M6.Sheets.Mage",
      makeDefault: true
    }
  );

  // La scheda del nemico (Blue, 25/9; 27/9): la scheda dei PNG.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    Actor,
    MODULE_ID,
    NemicoSheet,
    {
      types: ["png"],
      label: "M6.Nemico.Sheet",
      makeDefault: true
    }
  );
  registraNemicoChat();

  registerActorCreationChoice();
  registerMageDiceRendering();
  registerRollCardRendering();
  registerVolonta();
  // I rossi presi (il Sistema): il tasto che aggiunge al tiro i successi dei rossi, e lo fa paradossale.
  registerRossi();
  // L'Indulgere (3/10, al posto dello Sforzare la realtà): il tasto Tira Saggezza
  // sotto il lancio indulto, dopo la Volontà; e la riga dell'esito sotto i tiri di Saggezza.
  registerIndulgere();
  registerSaggezza();
  registerPrezzo();
  // Il dado dei danni (il Sistema): il tasto sotto i lanci riusciti con la Potenza in Danni, e la carta dei danni.
  registerDanni();
  // Gli avanzamenti delle Formule (il Sistema): il tasto sotto il lancio di una Formula fallito.
  registerAvanzamenti();
  // Il ramo C (11/9): la scelta dell'Ustione sotto la carta, e i punti
  // Paradosso del Narratore col pannello e la lobby.
  registerUstione();
  registerParadossoNarratore();
  registerQuadroNarratore();
  registerGrimorioComune();
  registerLineageSpheres();
  registerParadoxDice();
  // La creazione guidata (23/9): i testi del Narratore e l'apertura sul Mago nuovo.
  registraCreazioneGuidata();
  // Il Vathrâ (25/9): il traduttore per tutti, la carta in chat col senso a chi capisce, le due mani fra i caratteri.
  registraVathra();
  // Il nome della scheda sui token (25/9): per il Narratore sempre visibile, per i giocatori niente cambia.
  registraNomiScheda();

  // Le porte: game.m6.tira (la base), game.m6.condizioni, game.m6.vathra…
  const porte = createApi();
  Object.defineProperties(game.m6, Object.getOwnPropertyDescriptors(porte));
});

Hooks.once("ready", () => {
  // Il verdetto del Narratore sui tiri dei giocatori (16/9 sera): il canale del modulo.
  registraSocketVerdetto();

  // Le Condizioni del 29/9: quelle già accese prendono simbolo, dadi e testo di oggi (una volta, dal primo Narratore).
  if (game.user?.isGM && game.users?.activeGM?.id === game.user.id && game.settings.get(MODULE_ID, CONDIZIONI_VERSIONE_SETTING) !== CONDIZIONI_VERSIONE) {
    const tokens = (game.scenes?.contents ?? []).flatMap((scene) => (scene.tokens?.contents ?? []).filter((token) => !token.actorLink));
    riallineaCondizioni({ actors: game.actors?.contents ?? [], tokens })
      .then(async (toccate) => {
        await game.settings.set(MODULE_ID, CONDIZIONI_VERSIONE_SETTING, CONDIZIONI_VERSIONE);
        if (toccate) ui.notifications.info(game.i18n.format("M6.Condizioni.Riallineate", { count: toccate }));
      })
      .catch((error) => console.warn("m6 | Riallineamento delle Condizioni interrotto.", error));
  }

  // Il rifacimento dei poteri (30/9): le righe prese dal catalogo prendono il testo, il nome, il grado e il costo di oggi,
  // se non sono state cambiate a mano (una volta per catalogo, dal primo Narratore).
  riallineaPoteriDelMondo().catch((error) => console.warn("m6 | Riallineamento dei poteri interrotto.", error));

  debug("Ready", {
    foundryVersion: game.version,
    systemVersion: game.system.version
  });
});
