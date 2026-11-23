/**
 * I dati che Foundry tiene per ogni scheda, per ogni oggetto e per ogni tiro.
 *
 *   Mago     system.attributes.<id>.value        gli Attributi
 *            system.skills.<id>.{value,bonuses}  le Abilità, con le Specializzazioni
 *            system.sortedAttributes, sortedSkills   gli stessi per campo, col nome (calcolati)
 *            system.headers.{concept,…}          concetto, cronaca, Ambizione, Desiderio
 *            system.locked                       il lucchetto della scheda
 *   PNG      system.standarddicepools.<campo>.value   le tre riserve
 *            system.exceptionaldicepools.<id>         i casi a dadi, uno per Abilità
 *            system.health.max                        le caselle di Salute
 *   Oggetti  feature (Background, Pregi, Difetti), condition, weapon, armor, gear
 *   Tiro     il messaggio della 0.1.0, che le chat già scritte portano ancora
 *
 * I tratti vengono dalla tavola (tratti.js): chi cambia la tavola cambia i campi.
 * Il resto della scheda del Mago (Salute, Magick, Bussola, poteri…) sta nelle
 * bandiere `flags.m6.*`, senza schema, finché le sue regole si muovono.
 * I limiti qui sono larghi apposta: i numeri giusti li tengono le regole.
 */
import { CASELLE_PNG_MAX, RISERVA_PNG_MAX } from "./costanti.js";
import { ABILITA, ATTRIBUTI, CAMPI, DALLA_PRIMA, nomeAbilita, nomeAttributo, TUTTE_ABILITA, TUTTI_ATTRIBUTI, vociDeiTratti } from "./tratti.js";

const { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, SchemaField, StringField } = foundry.data.fields;
const { TypeDataModel } = foundry.abstract;

/** Un numero intero che c'è sempre. */
function intero(opzioni = {}) {
  return new NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0, ...opzioni });
}

/** Una parola che può mancare. */
function parola(opzioni = {}) {
  return new StringField({ required: true, blank: true, initial: "", ...opzioni });
}

/** Il Mago. */
export class MagoData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      attributes: new SchemaField(Object.fromEntries(TUTTI_ATTRIBUTI.map((id) => [id, new SchemaField({ value: intero({ initial: 1 }) })]))),
      skills: new SchemaField(Object.fromEntries(TUTTE_ABILITA.map((id) => [id, new SchemaField({ value: intero(), bonuses: new ArrayField(new ObjectField()) })]))),
      headers: new SchemaField({ concept: parola(), chronicle: parola(), ambition: parola(), desire: parola() }),
      locked: new BooleanField({ initial: false }),
      gamesystem: parola({ blank: false, initial: "mortal" }),
      settings: new SchemaField({ skillAttributeInputs: new BooleanField({ initial: false }) })
    };
  }

  /**
   * @override I tratti per campo, col nome letto: `sortedAttributes` e
   * `sortedSkills`, quello che la scheda disegna e che il tiro compone.
   */
  prepareDerivedData() {
    const localize = (chiave) => globalThis.game?.i18n?.localize(chiave) ?? chiave;
    this.sortedAttributes = vociDeiTratti(ATTRIBUTI, this.attributes, nomeAttributo, localize);
    this.sortedSkills = vociDeiTratti(ABILITA, this.skills, nomeAbilita, localize);
  }

  /** @override Le schede nate con la 0.1.0 avevano i tratti coi nomi italiani. */
  static migrateData(source) {
    for (const [vecchio, nuovo, tavola] of [["attributi", "attributes", DALLA_PRIMA.attributi], ["abilita", "skills", DALLA_PRIMA.abilita]]) {
      if (!source?.[vecchio] || source[nuovo]) continue;
      source[nuovo] = {};
      for (const [da, a] of Object.entries(tavola)) {
        if (source[vecchio][da]) source[nuovo][a] = { value: source[vecchio][da].valore };
      }
    }
    return super.migrateData(source);
  }
}

/** Il PNG: le tre riserve, i casi a dadi, le caselle di Salute, concetto e biografia. */
export class PngData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      standarddicepools: new SchemaField(Object.fromEntries(CAMPI.map((campo) => [campo, new SchemaField({ value: intero({ max: RISERVA_PNG_MAX }) })]))),
      exceptionaldicepools: new SchemaField(Object.fromEntries(TUTTE_ABILITA.map((id) => [id, new SchemaField({ value: intero({ max: RISERVA_PNG_MAX }), active: new BooleanField({ initial: false }) })]))),
      health: new SchemaField({ max: intero({ initial: 1, min: 1, max: CASELLE_PNG_MAX }) }),
      headers: new SchemaField({ concept: parola() }),
      biography: new HTMLField({ required: true, blank: true, initial: "" }),
      spcType: parola({ blank: false, initial: "mortal" }),
      locked: new BooleanField({ initial: false }),
      gamesystem: parola({ blank: false, initial: "mortal" })
    };
  }

  /** @override I PNG nati con la 0.1.0 avevano le riserve e le caselle coi nomi italiani. */
  static migrateData(source) {
    if (source?.riserve && !source.standarddicepools) {
      source.standarddicepools = {};
      for (const [da, a] of Object.entries(DALLA_PRIMA.campi)) {
        if (source.riserve[da]) source.standarddicepools[a] = { value: source.riserve[da].dadi };
      }
    }
    if (source?.salute?.caselle && !source.health) source.health = { max: source.salute.caselle };
    return super.migrateData(source);
  }
}

/** Quello che ogni oggetto porta. */
function campiOggetto() {
  return {
    description: new HTMLField({ required: true, blank: true, initial: "" }),
    bonuses: new ArrayField(new ObjectField()),
    source: new ObjectField(),
    dataItemId: parola(),
    macroid: parola()
  };
}

/** Gli usi di un oggetto. */
function usi() {
  return new SchemaField({ enabled: new BooleanField({ initial: false }), current: intero(), max: intero() });
}

export class VantaggioData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return { ...campiOggetto(), points: intero(), featuretype: parola({ initial: "background" }) };
  }
}

export class CondizioneData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return { ...campiOggetto(), effects: new ObjectField(), suppressed: new BooleanField({ initial: false }) };
  }
}

export class ArmaData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return { ...campiOggetto(), weaponType: parola({ initial: "melee" }), weaponvalue: intero(), uses: usi(), dicepool: new ObjectField(), quantity: intero({ initial: 1 }) };
  }
}

export class ArmaturaData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return { ...campiOggetto(), armorvalue: intero(), quantity: intero({ initial: 1 }) };
  }
}

export class EquipaggiamentoData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return { ...campiOggetto(), uses: usi(), dicepool: new ObjectField(), quantity: intero({ initial: 1 }) };
  }
}

/** I tipi di oggetto del sistema, col loro modello. */
export const OGGETTI = Object.freeze({
  feature: VantaggioData,
  condition: CondizioneData,
  weapon: ArmaData,
  armor: ArmaturaData,
  gear: EquipaggiamentoData
});

/** Il tiro della 0.1.0: con cosa si è tirato, la soglia, i dadi usciti. */
export class TiroData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      attributo: parola(),
      abilita: parola(),
      campo: parola(),
      soglia: intero({ initial: 1 }),
      risultati: new ArrayField(new NumberField({ required: true, nullable: false, integer: true, min: 1, max: 10 }))
    };
  }
}
