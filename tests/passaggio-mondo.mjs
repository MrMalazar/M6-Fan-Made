/**
 * Un mondo del modulo in miniatura, per le prove del passaggio: i dati sono
 * inventati, la forma è quella vera (wod5e 5.3.28 col modulo 1.46.0, letta
 * da un mondo di prova). Ogni funzione torna una copia nuova.
 */
const STAT = { coreVersion: "14.368", systemId: "wod5e", systemVersion: "5.3.28" };

/** Un Mago del modulo: scheda `mortal`, tutto il resto nelle bandiere. */
export function mago() {
  return {
    _id: "mago000000000001",
    name: "Ada",
    type: "mortal",
    img: "worlds/prova/ada.webp",
    folder: "cart000000000001",
    ownership: { default: 0, utente0000000001: 3 },
    system: {
      locked: true,
      group: "",
      hasSkillAttributeData: true,
      headers: { concept: "Tecnica del suono", chronicle: "", ambition: "Aprire uno studio", desire: "Un caffè", touchstones: "La sorella", tenets: "" },
      attributes: { strength: { active: false, value: 2 }, dexterity: { value: 3 }, wits: { value: 4 } },
      skills: {
        athletics: { value: "2", bonuses: [] },
        craft: { value: 3, bonuses: [{ source: "Elettronica", value: 1, paths: ["skills.craft"] }] },
        melee: { value: 2, bonuses: [] },
        stealth: { value: "1" },
        drive: { value: 0 }
      },
      settings: { headerbg: "", skillAttributeInputs: true, limited: { biography: true } },
      health: { aggravated: 0, superficial: 0, max: 5, value: 5 },
      willpower: { aggravated: 0, superficial: 0, max: 5, value: 5 },
      biography: "<p>Scritta sulla scheda di wod5e.</p>",
      notes: "",
      exp: { value: 0, max: 0 },
      humanity: { value: 7 }
    },
    prototypeToken: { name: "Ada", actorLink: true, bar1: { attribute: "health" }, bar2: { attribute: "willpower" }, texture: { src: "worlds/prova/ada.webp" }, flags: {} },
    items: [
      { _id: "ogg0000000000001", name: "Fortunato", type: "feature", img: "modules/wod5e-mage/assets/icons/archivi/pregio-soprannaturali.svg", system: { description: "<p class=\"wod5e-mage-nota\">Costo</p>", points: 3, featuretype: "merit", bonuses: [] }, flags: { "wod5e-mage": { archivio: { kind: "pregio", name: "Fortunato" } } }, effects: [] },
      { _id: "ogg0000000000002", name: "Scosso", type: "condition", img: "modules/wod5e-mage/assets/icons/condizioni/mente.svg", system: { description: "", bonuses: [{ source: "Scosso", value: "-1", paths: ["social", "mental"] }], suppressed: false }, flags: { "wod5e-mage": { condizione: "scosso" } }, effects: [] },
      { _id: "ogg0000000000003", name: "Mano fasciata", type: "condition", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { description: "<p>Un taglio.</p>", bonuses: [{ source: "Mano fasciata", value: "-2", paths: ["physical"] }], suppressed: false }, flags: {}, effects: [] },
      { _id: "ogg0000000000004", name: "Di cattivo umore", type: "condition", img: "icons/svg/item-bag.svg", system: { description: "<p>Solo scritta.</p>", bonuses: [] }, flags: {}, effects: [] },
      { _id: "ogg0000000000005", name: "Pistola", type: "weapon", img: "systems/wod5e/assets/icons/items/weapon.svg", system: { weaponType: "ranged", weaponvalue: 2, description: "" }, flags: { "wod5e-mage": { tipo: "Pistola", rarita: "Comune" } }, effects: [] },
      { _id: "ogg0000000000006", name: "Tiro su misura", type: "customRoll", img: "systems/wod5e/assets/icons/items/custom-roll.png", system: { dicepool: {} }, flags: {}, effects: [] }
    ],
    effects: [],
    flags: {
      core: { sheetClass: "wod5e-mage.MageActorSheet" },
      wod5e: { manualDefaultOwnership: true },
      "wod5e-mage": { arete: { value: 2 }, spheres: { forces: 2 }, focus: { credo: "scienza", sphereNotes: { forces: "<p class=\"wod5e-mage-guidata-lead\">Le Forze.</p>" } }, salute: { pa: 1 } },
      altro: { tenuta: "modules/wod5e-mage/assets/x.png" }
    },
    _stats: { ...STAT }
  };
}

/** Un nemico con la scheda del modulo. */
export function nemico() {
  return {
    _id: "nemico0000000001",
    name: "Sgherro",
    type: "spc",
    img: "icons/svg/mystery-man.svg",
    system: {
      spcType: "mortal",
      locked: false,
      headers: { concept: "Uomo di fatica" },
      standarddicepools: { physical: { value: 6 }, social: { value: 4 }, mental: { value: 3 } },
      exceptionaldicepools: { brawl: { value: 8, active: true }, occult: { value: 0, active: false } },
      health: { max: 6, superficial: 0, aggravated: 0, value: 6 },
      willpower: { max: 5, value: 5 },
      biography: "<p>Lavora al porto.</p>"
    },
    prototypeToken: { name: "Sgherro", actorLink: false, bar1: { attribute: "health" }, bar2: { attribute: "willpower" }, texture: { src: "icons/svg/mystery-man.svg" }, flags: {} },
    items: [{ _id: "ogg0000000000011", name: "Coltello", type: "weapon", img: "icons/svg/sword.svg", system: { weaponType: "melee", weaponvalue: 2 }, flags: { "wod5e-mage": { tipo: "Lama" } }, effects: [] }],
    effects: [],
    flags: { core: { sheetClass: "wod5e-mage.NemicoSheet" }, wod5e: { manualDefaultOwnership: true }, "wod5e-mage": { nemico: { natura: "mortal", casi: { caso0001: { nome: "Scaricare casse", campo: "physical", dadi: 7, sort: 1 } } } } },
    _stats: { ...STAT }
  };
}

/** Un PNG mago com'era prima della scheda del nemico: scheda di wod5e, Sfere come tratti a dadi. */
export function pngDiPrima() {
  return {
    _id: "png0000000000001",
    name: "Via - Nome",
    type: "spc",
    img: "systems/wod5e/assets/icons/actor-types/mortal.png",
    system: {
      spcType: "mortal",
      headers: { concept: "Tradizione, Via · concetto" },
      standarddicepools: { physical: { value: 4 }, social: { value: 3 }, mental: { value: 60 } },
      exceptionaldicepools: { intimidation: { value: 7, active: true }, occult: { value: 8, active: true }, stealth: { value: 5, active: false } },
      health: { max: 6, superficial: 1, aggravated: 0, value: 5 },
      willpower: { max: 5, superficial: 2 },
      generaldifficulty: { normal: 3, strongest: 4 },
      biography: "<p>Biografia.</p>",
      notes: "<p>Note di wod5e.</p>"
    },
    prototypeToken: { name: "Via - Nome", actorLink: false, bar1: { attribute: "health" }, bar2: { attribute: null }, texture: { src: "systems/wod5e/assets/icons/actor-types/mortal.png" }, flags: {} },
    items: [
      { _id: "ogg0000000000021", name: "Forze", type: "trait", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { dice: 3, description: "" }, flags: {}, effects: [] },
      { _id: "ogg0000000000022", name: "mente", type: "trait", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { dice: 2 }, flags: {}, effects: [] },
      { _id: "ogg0000000000023", name: "Guardia del corpo", type: "trait", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { dice: 6, description: "<p>Due uomini.</p>" }, flags: {}, effects: [] },
      { _id: "ogg0000000000024", name: "Bastone", type: "weapon", img: "icons/svg/sword.svg", system: { weaponType: "melee", weaponvalue: 1 }, flags: {}, effects: [] }
    ],
    effects: [],
    flags: { wod5e: { manualDefaultOwnership: true } },
    _stats: { ...STAT }
  };
}

/** Una scheda intera di un'altra creatura, e un gruppo. */
export function vampiro() {
  return {
    _id: "vamp000000000001",
    name: "Anziano",
    type: "vampire",
    img: "icons/svg/mystery-man.svg",
    system: { headers: { concept: "Anziano" }, attributes: { strength: { value: 4 } }, skills: { brawl: { value: 3 }, intimidation: { value: 4 } }, hunger: { value: 2 }, humanity: { value: 5 }, blood: { potency: 3 }, biography: "<p>Un vampiro.</p>" },
    prototypeToken: { name: "Anziano", actorLink: true, bar1: { attribute: "health" }, bar2: { attribute: "hunger" }, texture: { src: "icons/svg/mystery-man.svg" }, flags: {} },
    items: [{ _id: "ogg0000000000031", name: "Dominazione", type: "power", img: "systems/wod5e/assets/icons/items/discipline.png", system: { level: 2, discipline: "dominate" }, flags: {}, effects: [] }],
    effects: [],
    flags: { wod5e: { manualDefaultOwnership: true } },
    _stats: { ...STAT }
  };
}

export function gruppo() {
  return { _id: "gruppo0000000001", name: "Il gruppo", type: "group", img: "icons/svg/mystery-man.svg", system: { groupType: "coterie", members: [] }, prototypeToken: { name: "Il gruppo", bar1: { attribute: "health" }, bar2: { attribute: "willpower" }, texture: { src: "icons/svg/mystery-man.svg" }, flags: {} }, items: [], effects: [], flags: { wod5e: { manualDefaultOwnership: true } }, _stats: { ...STAT } };
}

/** Una scena con un segnalino legato e uno no, che porta di suo danni, una bandiera, tre oggetti e una lapide. */
export function scena() {
  return {
    _id: "scena00000000001",
    name: "Il porto",
    flags: { "m6-luci": { fasi: { notte: 0.8 } } },
    tokens: [
      { _id: "segn000000000001", name: "Ada", actorId: "mago000000000001", actorLink: true, bar1: { attribute: "health" }, bar2: { attribute: "willpower" }, texture: { src: "worlds/prova/ada.webp" }, flags: {}, delta: { _id: "segn000000000001", system: {}, items: [], effects: [], flags: {} } },
      {
        _id: "segn000000000002",
        name: "Via - Nome",
        actorId: "png0000000000001",
        actorLink: false,
        bar1: { attribute: "health" },
        bar2: { attribute: "willpower" },
        texture: { src: "systems/wod5e/assets/icons/actor-types/mortal.png" },
        flags: { "wod5e-mage": { nota: "sul segnalino" } },
        delta: {
          _id: "segn000000000002",
          name: null,
          type: null,
          img: null,
          system: { health: { superficial: 3, value: 4.5 }, standarddicepools: { physical: { value: 5 } } },
          items: [
            { _id: "ogg0000000000041", name: "Ferito", type: "condition", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { description: "", bonuses: [] }, flags: { "wod5e-mage": { grado: 1 } }, effects: [] },
            { _id: "ogg0000000000042", name: "Scorta", type: "trait", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { dice: 4 }, flags: {}, effects: [] },
            { _id: "ogg0000000000024", _tombstone: true }
          ],
          effects: [],
          ownership: null,
          flags: { "wod5e-mage": { nemico: { fazione: "Scritta sul segnalino" } } }
        }
      }
    ],
    walls: [{ _id: "muro000000000001", c: [0, 0, 100, 0], flags: {} }],
    lights: [],
    notes: [],
    drawings: [],
    tiles: [],
    sounds: [],
    regions: [],
    levels: [],
    _stats: { ...STAT }
  };
}

/** Un tiro del modulo com'è salvato nel messaggio. */
export function tiroSalvato() {
  return JSON.stringify({
    class: "WOD5eRoll",
    options: { system: "mortal", title: "Forza + Atletica", flavor: "<details class=\"wod5e-mage-roll-card-details\"><summary>Dettagli</summary></details>", difficulty: 2, mageArete: true, mageSuccessFrom: 6, paradoxRating: 0 },
    dice: [],
    formula: "4dmcs>5 + 0dpcs>5",
    terms: [
      { class: "MortalDie", options: { flavor: null }, evaluated: true, number: 4, faces: 10, modifiers: ["cs>5"], results: [{ result: 4, active: true, success: false, count: 0 }, { result: 7, active: true, success: true, count: 1 }] },
      { class: "OperatorTerm", options: {}, evaluated: true, operator: "+" },
      { class: "ParadoxDie", options: { flavor: null }, evaluated: true, number: 0, faces: 10, modifiers: ["cs>5"], results: [] }
    ],
    total: 1,
    evaluated: true
  });
}

export function messaggi() {
  return [
    { _id: "mess000000000001", type: "base", content: "1", rolls: [tiroSalvato()], speaker: { actor: "mago000000000001", alias: "Ada" }, flags: { "wod5e-mage": { rollCard: { title: "Forza + Atletica", pool: 4, threshold: 2 }, volonta: { kind: "reroll", dice: 1 } } }, _stats: { ...STAT } },
    { _id: "mess000000000002", type: "base", content: "", rolls: [], speaker: { alias: "" }, flags: { wod5e: { name: "Rallentato", img: "modules/wod5e-mage/assets/icons/condizioni/corpo.svg", description: "<p><em>Arrivi sempre dopo</em></p>" } }, _stats: { ...STAT } },
    { _id: "mess000000000003", type: "base", content: "<div class=\"wod5e-mage-vathra-carta\">ʼafarilsa</div>", rolls: [], speaker: { alias: "Narratore" }, flags: { "wod5e-mage": { vathra: { italiano: "La porta" } } }, _stats: { ...STAT } },
    { _id: "mess000000000004", type: "base", content: "Una frase qualunque.", rolls: [], speaker: { alias: "Ada" }, flags: {}, _stats: { ...STAT } },
    { _id: "mess000000000005", type: "base", content: "2", rolls: [JSON.stringify({ class: "Roll", options: {}, dice: [], formula: "1d10", terms: [{ class: "Die", options: {}, evaluated: true, number: 1, faces: 10, modifiers: [], results: [{ result: 2, active: true }] }], total: 2, evaluated: true })], speaker: { alias: "Sgherro" }, flags: { core: { initiativeRoll: true } }, _stats: { ...STAT } }
  ];
}

export function diario() {
  return {
    _id: "diario0000000001",
    name: "Appunti",
    pages: [
      { _id: "pagina0000000001", name: "Uno", type: "text", text: { content: "<p>@UUID[Compendium.wod5e-mage.mage-pregi.Item.06e291a938e8b30a]{Fortunato} e @UUID[Actor.mago000000000001]{Ada}.</p><p><img src=\"modules/wod5e-mage/assets/icons/sheet/forces.png\"></p>" }, flags: {} },
      { _id: "pagina0000000002", name: "Due", type: "text", text: { content: "<p>Niente del modulo.</p>" }, flags: {} }
    ],
    categories: [],
    flags: {},
    _stats: { ...STAT }
  };
}

export function macro() {
  return [
    { _id: "macro00000000001", name: "Condizioni (Master)", type: "script", command: "// Seleziona i personaggi.\nawait game.modules.get(\"wod5e-mage\").api.condizioni.assign();", flags: {}, _stats: { ...STAT } },
    { _id: "macro00000000002", name: "Con la domanda", type: "script", command: "game.modules.get('wod5e-mage')?.api?.vathra?.apri();", flags: {}, _stats: { ...STAT } },
    { _id: "macro00000000003", name: "Di Blue", type: "script", command: "ui.notifications.info(\"ciao\");", flags: {}, _stats: { ...STAT } }
  ];
}

export function oggettiDelMondo() {
  return [
    { _id: "mondo00000000001", name: "Fama", type: "feature", img: "modules/wod5e-mage/assets/icons/archivi/background.svg", system: { points: 2, featuretype: "background", description: "" }, flags: { "wod5e-mage": { archivio: { kind: "background" } } }, effects: [], _stats: { ...STAT } },
    { _id: "mondo00000000002", name: "Potere del mondo", type: "power", img: "systems/wod5e/assets/icons/items/discipline.png", system: { level: 1 }, flags: {}, effects: [], _stats: { ...STAT } }
  ];
}

export function impostazioni() {
  return [
    { id: "imp0000000000001", key: "wod5e-mage.paradossoNarratore", value: { points: 16, visible: false, log: [{ kind: "given", amount: 6 }] } },
    { id: "imp0000000000002", key: "wod5e-mage.guidaTesti", value: { controllo: { perche: "<p class=\"wod5e-mage-guidata-lead\">Il memo.</p>" } } },
    { id: "imp0000000000003", key: "wod5e-mage.condizioniVersione", value: "2026-09-29" },
    { id: "imp0000000000004", key: "wod5e-mage.nonPiuUsata", value: 1 },
    { id: "imp0000000000005", key: "wod5e.worldVersion", value: "5.3.28" },
    { id: "imp0000000000006", key: "core.compendiumConfiguration", value: { "wod5e.macros": { folder: "a" }, "wod5e-mage.mage-pregi": { folder: "b" }, "world.grimorio-comune": { folder: null } } },
    { id: "imp0000000000007", key: "core.time", value: 0 },
    { id: "imp0000000000008", key: "orologio.orologi", value: {} }
  ];
}

/** La fotografia del mondo intero, com'è appena aperto col sistema: le schede sono tutte chiuse (invalide). */
export function mondoDelModulo() {
  return {
    raccolte: {
      actors: [mago(), nemico(), pngDiPrima(), vampiro(), gruppo()].map((fonte) => ({ fonte, invalido: true })),
      items: oggettiDelMondo().map((fonte) => ({ fonte, invalido: fonte.type === "power" })),
      scenes: [{ fonte: scena(), invalido: false }],
      messages: messaggi().map((fonte) => ({ fonte, invalido: false })),
      journal: [{ fonte: diario(), invalido: false }],
      macros: macro().map((fonte) => ({ fonte, invalido: false })),
      tables: [],
      playlists: [],
      cards: [],
      combats: [],
      folders: [{ fonte: { _id: "cart000000000001", name: "00 - PG in gioco", type: "Actor", flags: {} }, invalido: false }],
      users: [{ fonte: { _id: "utente0000000001", name: "Giocatore", role: 1, flags: { "wod5e-mage": { tema: "chiaro" } } }, invalido: false }]
    },
    pacchi: [{ id: "world.grimorio-comune", documento: "Item", voci: [{ fonte: { _id: "pacco00000000001", name: "Formula", type: "feature", img: "modules/wod5e-mage/assets/icons/sheet/forces.png", system: { featuretype: "background", description: "<p class=\"wod5e-mage-formula\">Testo.</p>" }, flags: { "wod5e-mage": { formula: { sfera: "forces" } } }, effects: [] }, invalido: false }] }],
    impostazioni: impostazioni(),
    registrate: ["m6.paradossoNarratore", "m6.guidaTesti", "m6.condizioniVersione", "m6.poteriAllineati", "m6.quadroMaghi"]
  };
}

/**
 * Quello che Foundry fa di un aggiornamento, in piccolo: le voci semplici
 * prendono il valore, le voci a oggetto si fondono, `==voce` sostituisce
 * l'oggetto intero, i documenti dentro si aggiornano per `_id`. Serve a
 * provare che un aggiornamento porta davvero dal prima al dopo.
 */
export function applicaAggiornamento(gerarchia, nome, prima, cambia) {
  const dentro = gerarchia[nome] ?? {};
  const esito = structuredClone(prima);
  const fondi = (sotto, sopra) => {
    if (!sopra || typeof sopra !== "object" || Array.isArray(sopra)) return sopra;
    const base = sotto && typeof sotto === "object" && !Array.isArray(sotto) ? { ...sotto } : {};
    for (const [chiave, valore] of Object.entries(sopra)) {
      if (chiave.startsWith("==")) base[chiave.slice(2)] = structuredClone(valore);
      else base[chiave] = fondi(base[chiave], valore);
    }
    return base;
  };
  for (const [chiave, valore] of Object.entries(cambia ?? {})) {
    if (chiave.startsWith("==")) esito[chiave.slice(2)] = structuredClone(valore);
    else if (dentro[chiave]?.uno) esito[chiave] = applicaAggiornamento(gerarchia, dentro[chiave].uno, esito[chiave], valore);
    else if (dentro[chiave] && Array.isArray(valore)) {
      esito[chiave] = (esito[chiave] ?? []).map((voce) => {
        const suo = valore.find((cambio) => cambio._id === voce._id);
        if (!suo) return voce;
        const { _id, ...resto } = suo;
        return applicaAggiornamento(gerarchia, dentro[chiave], voce, resto);
      });
    } else esito[chiave] = fondi(esito[chiave], valore);
  }
  return esito;
}

/** Toglie i documenti dentro segnati da `togli` (le strade di `aggiornamento`). */
export function applicaTogli(documento, togli) {
  const esito = structuredClone(documento);
  for (const { strada, raccolta, ids } of togli ?? []) {
    let dove = esito;
    for (const passo of strada) dove = passo.uno ? dove[passo.uno] : dove[passo.raccolta].find((voce) => voce._id === passo.id);
    dove[raccolta] = dove[raccolta].filter((voce) => !ids.includes(voce._id));
  }
  return esito;
}
