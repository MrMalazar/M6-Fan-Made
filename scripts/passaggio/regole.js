/**
 * Il passaggio dal modulo al sistema: le regole, tutte in tavole.
 *
 * Un mondo nato col modulo `wod5e-mage` sopra il sistema wod5e porta schede,
 * oggetti, messaggi e impostazioni fatti per loro. Qui sta scritto che cosa
 * diventa che cosa. Chi cambia una scelta cambia una riga di questo file: i
 * conti (converti.js), l'esame (piano.js) e chi scrive in Foundry
 * (esegui.js) leggono da qui.
 *
 * Niente in questo file tocca Foundry: si legge anche da un mondo che gira
 * ancora col modulo, per sapere prima che cosa succederebbe.
 */
import { CASELLE_PNG_MAX, RISERVA_PNG_MAX } from "../base/costanti.js";
import { CAMPI, TUTTE_ABILITA, TUTTI_ATTRIBUTI } from "../base/tratti.js";

/** Da dove si viene e dove si arriva. */
export const VECCHIO_MODULO = "wod5e-mage";
export const VECCHIO_SISTEMA = "wod5e";
export const NUOVO = "m6";

/** La bandiera che tiene il registro del passaggio su ogni documento toccato. */
export const REGISTRO = "passaggio";

/**
 * Il tipo di ogni scheda: quello di prima e il nostro. Il PNG di wod5e è il
 * nostro PNG; chi aveva la scheda intera (Attributi e Abilità) prende quella
 * del Mago, che è l'unica scheda intera del sistema. Un tipo che qui non c'è
 * (il gruppo) resta com'è: non si vede, non si perde, e il rapporto lo dice.
 */
export const TIPI_ATTORE = Object.freeze({
  mortal: "mago",
  vampire: "mago",
  ghoul: "mago",
  hunter: "mago",
  werewolf: "mago",
  spc: "png"
});

/** I tipi di oggetto che il sistema ha uguali a prima: passano com'erano. */
export const TIPI_OGGETTO = Object.freeze(["feature", "condition", "weapon", "armor", "gear"]);

/** Il tratto a dadi del PNG di wod5e: nel sistema è un caso a dadi della scheda del nemico. */
export const TIPO_TRATTO = "trait";

/**
 * Che cosa passa dei dati `system`, per tipo d'arrivo. Ogni voce dice dove
 * sta il dato e come si legge; quello che non è in tavola finisce nel
 * registro del passaggio (la bandiera), mai perso.
 */
export const DATI_SISTEMA = Object.freeze({
  mago: Object.freeze({
    attributi: TUTTI_ATTRIBUTI,
    abilita: TUTTE_ABILITA,
    testate: Object.freeze(["concept", "chronicle", "ambition", "desire"]),
    impostazioni: Object.freeze(["skillAttributeInputs"])
  }),
  png: Object.freeze({
    campi: CAMPI,
    abilita: TUTTE_ABILITA,
    testate: Object.freeze(["concept"]),
    riservaMax: RISERVA_PNG_MAX,
    caselleMax: CASELLE_PNG_MAX
  })
});

/**
 * Le tredici Abilità assorbite dal canone dell'11/9: sulla scheda nuova non
 * hanno una casella. I pallini di un Mago restano nel registro, da travasare
 * a mano (la tavola «Dove va quello che muore» ha voci che vanno in più
 * posti); le riserve eccezionali accese di un PNG diventano casi a dadi col
 * nome di prima.
 */
export const ABILITA_ASSORBITE = Object.freeze({
  melee: Object.freeze({ nome: "Mischia (armi)", campo: "physical" }),
  stealth: Object.freeze({ nome: "Furtività", campo: "physical" }),
  drive: Object.freeze({ nome: "Guidare", campo: "physical" }),
  animalken: Object.freeze({ nome: "Affinità Animale", campo: "social" }),
  etiquette: Object.freeze({ nome: "Galateo", campo: "social" }),
  insight: Object.freeze({ nome: "Intuito", campo: "social" }),
  intimidation: Object.freeze({ nome: "Intimidire", campo: "social" }),
  leadership: Object.freeze({ nome: "Autorità", campo: "social" }),
  streetwise: Object.freeze({ nome: "Bassifondi", campo: "social" }),
  finance: Object.freeze({ nome: "Finanza", campo: "mental" }),
  politics: Object.freeze({ nome: "Politica", campo: "mental" }),
  science: Object.freeze({ nome: "Scienze", campo: "mental" }),
  technology: Object.freeze({ nome: "Tecnologia", campo: "mental" })
});

/**
 * I nomi delle Sfere, per riconoscere i tratti dei PNG maghi scritti a mano
 * («Forze», tre dadi): il tratto resta un caso a dadi e in più accende il
 * Dominio nella Magick del nemico. Italiano e inglese, come nei file di lingua.
 */
export const NOMI_SFERE = Object.freeze({
  correspondence: Object.freeze(["Corrispondenza", "Correspondence"]),
  entropy: Object.freeze(["Entropia", "Entropy"]),
  forces: Object.freeze(["Forze", "Forces"]),
  life: Object.freeze(["Vita", "Life"]),
  matter: Object.freeze(["Materia", "Matter"]),
  mind: Object.freeze(["Mente", "Mind"]),
  prime: Object.freeze(["Primordio", "Prime"]),
  spirit: Object.freeze(["Spirito", "Spirit"]),
  time: Object.freeze(["Tempo", "Time"])
});

/**
 * Le barre dei segnalini: l'attributo di prima e il nostro. La Salute ha la
 * sua barra; la Volontà in M6 sta dentro la Salute e la barra si spegne.
 * Un attributo che non è in tavola e che il sistema non conosce si spegne.
 */
export const BARRE = Object.freeze({ health: "salute" });
export const BARRE_NOSTRE = Object.freeze(["salute"]);

/**
 * I testi: che cosa si riscrive dentro ogni parola salvata (descrizioni,
 * diari, macro, carte in chat, percorsi delle immagini). In ordine: la prima
 * regola che prende un pezzo lo toglie alle altre.
 */
export const TESTI = Object.freeze([
  // Le macro: la porta del modulo è diventata `game.m6`.
  Object.freeze({ cerca: /game\.modules\.get\((["'`])wod5e-mage\1\)\s*\??\s*\.api/g, metti: "game.m6" }),
  // I file: quello che stava nel modulo sta nel sistema, allo stesso posto.
  Object.freeze({ cerca: /modules\/wod5e-mage\//g, metti: "systems/m6/" }),
  // Le parole del file di lingua.
  Object.freeze({ cerca: /WOD5E_MAGE\./g, metti: "M6." }),
  // Tutto il resto: classi di stile, compendi, bandiere, impostazioni.
  Object.freeze({ cerca: /wod5e-mage/g, metti: "m6" })
]);

/**
 * Le immagini del vecchio sistema non ci sono più: al loro posto quella di
 * Foundry per il genere di documento.
 */
export const IMMAGINI_VECCHIE = /^\/?systems\/wod5e\//;
export const IMMAGINE_ATTORE = "icons/svg/mystery-man.svg";
export const IMMAGINE_OGGETTO = "icons/svg/item-bag.svg";

/** Le classi dei tiri salvati in chat: quella di prima e la nostra. */
export const CLASSI_TIRO = Object.freeze({ WOD5eRoll: "TiroM6" });
/**
 * I dadi che fanno di un tiro salvato un tiro del modulo. Un tiro di wod5e
 * senza nessuno di questi (un'iniziativa, il tiro di un'altra creatura) non è
 * una riserva nostra: diventa un tiro semplice di Foundry, col suo totale.
 */
export const DADI_DEL_MODULO = Object.freeze(["MortalDie", "ParadoxDie"]);
export const TIRO_SEMPLICE = "Roll";
export const CLASSI_DADO = Object.freeze({
  MortalDie: "DadoRiserva",
  VampireDie: "Die",
  HungerDie: "Die",
  WerewolfDie: "Die",
  RageDie: "Die",
  HunterDie: "Die",
  DesperationDie: "Die"
});

/**
 * Le impostazioni del mondo. Quelle del modulo passano al sistema con lo
 * stesso nome, anche i due «timbri» che dicono fin dove il modulo aveva
 * riallineato Condizioni e poteri: il timbro descrive i dati, e i dati
 * vengono dal modulo; al primo avvio il sistema riallinea quello che manca.
 * Quelle del vecchio sistema restano dove sono: non le legge più nessuno.
 */
export const IMPOSTAZIONE_COMPENDI = "core.compendiumConfiguration";

/**
 * Quello che dei dati `system` non ha un posto nella scheda nuova ma è roba
 * scritta a mano: finisce nel registro. Dei tracciati di Salute e Volontà di
 * prima restano solo i danni segnati.
 */
export const RESTO = Object.freeze({
  testi: Object.freeze(["biography", "appearance", "notes", "privatenotes", "equipment", "description"]),
  conti: Object.freeze(["exp", "experiences", "bio", "generaldifficulty", "manifestation", "power"]),
  danni: Object.freeze(["health", "willpower"]),
  perTipo: Object.freeze({
    vampire: Object.freeze(["hunger", "humanity", "blood", "disciplines"]),
    ghoul: Object.freeze(["humanity", "blood", "disciplines"]),
    werewolf: Object.freeze(["rage", "renown", "crinosHealth", "balance", "forms", "gifts"]),
    hunter: Object.freeze(["despair", "desperation", "danger", "edges"])
  })
});

/**
 * Le raccolte di documenti dentro un documento, come le tiene Foundry 14:
 * servono a mandare gli aggiornamenti voce per voce. `uno` è un documento
 * solo (il delta di un segnalino), le altre sono liste.
 */
export const GERARCHIA = Object.freeze({
  Actor: Object.freeze({ items: "Item", effects: "ActiveEffect" }),
  Item: Object.freeze({ effects: "ActiveEffect" }),
  ActorDelta: Object.freeze({ items: "Item", effects: "ActiveEffect" }),
  Token: Object.freeze({ delta: Object.freeze({ uno: "ActorDelta" }) }),
  Scene: Object.freeze({ drawings: "Drawing", tokens: "Token", levels: "Level", lights: "AmbientLight", notes: "Note", sounds: "AmbientSound", regions: "Region", tiles: "Tile", walls: "Wall" }),
  JournalEntry: Object.freeze({ pages: "JournalEntryPage", categories: "JournalEntryCategory" }),
  RollTable: Object.freeze({ results: "TableResult" }),
  Playlist: Object.freeze({ sounds: "PlaylistSound" }),
  Cards: Object.freeze({ cards: "Card" }),
  Combat: Object.freeze({ combatants: "Combatant", groups: "CombatantGroup" })
});

/**
 * Le raccolte del mondo che il passaggio guarda, col nome del documento. I
 * muri, le luci e la nebbia non portano niente del modulo e non si toccano.
 */
export const RACCOLTE = Object.freeze({
  actors: "Actor",
  items: "Item",
  scenes: "Scene",
  messages: "ChatMessage",
  journal: "JournalEntry",
  macros: "Macro",
  tables: "RollTable",
  playlists: "Playlist",
  cards: "Cards",
  combats: "Combat",
  folders: "Folder",
  users: "User"
});

/** Le chiavi che Foundry scrive da sé e che non si confrontano. */
export const CHIAVI_DI_FOUNDRY = Object.freeze(["_stats"]);
