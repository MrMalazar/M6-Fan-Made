/**
 * Una Foundry finta, quanto basta per caricare il sistema fuori da Foundry.
 * `monta()` mette al loro posto i nomi che il sistema si aspetta e torna le
 * maniglie per guardare cosa è successo. La prova vera resta dentro Foundry.
 */
import assert from "node:assert/strict";

class Campo {
  constructor(opzioni = {}) { this.options = opzioni; }
}
class SchemaField extends Campo {
  constructor(fields = {}, opzioni = {}) { super(opzioni); this.fields = fields; }
}
class ArrayField extends Campo {
  constructor(element, opzioni = {}) { super(opzioni); this.element = element; }
}
class NumberField extends Campo {}
class StringField extends Campo {}
class BooleanField extends Campo {}
class HTMLField extends Campo {}
class ObjectField extends Campo {}

/** Un dado truccato: escono i numeri messi in `prossimi`, poi degli 1. */
export class FintaRoll {
  static prossimi = [];
  constructor(formula) { this.formula = formula; }
  async evaluate() {
    const quanti = Number(/^(\d+)d10$/.exec(this.formula)?.[1]);
    assert.ok(Number.isInteger(quanti) && quanti > 0, `formula inattesa: ${this.formula}`);
    const usciti = FintaRoll.prossimi.splice(0, quanti);
    while (usciti.length < quanti) usciti.push(1);
    this.dice = [{ results: usciti.map((result) => ({ result, active: true })) }];
    return this;
  }
}

/** La scheda di Foundry ridotta all'osso: un documento, il permesso di scrivere, il conto dei ridisegni. */
class FintaScheda {
  static DEFAULT_OPTIONS = {};
  constructor(options = {}) { this.options = options; this.ridisegni = 0; }
  get document() { return this.options.document; }
  get isEditable() { return this.options.editable ?? true; }
  async _prepareContext() { return { document: this.document, editable: this.isEditable }; }
  _processFormData(_event, _form, formData) { return structuredClone(formData.object); }
  render() { this.ridisegni += 1; }
}

/** Un pezzo di pagina finto: tiene l'HTML che gli scrivono e gli ascolti che gli attaccano. */
function nodo(tag = "div") {
  const zone = new Map();
  const ascolti = {};
  return {
    tag, id: "", innerHTML: "", textContent: "", type: "", zone, ascolti,
    addEventListener: (tipo, funzione) => { ascolti[tipo] = funzione; },
    querySelector(selettore) {
      const nome = /^\[data-m6t-zona="(\w+)"\]$/.exec(selettore)?.[1];
      if (!nome || !this.innerHTML.includes(`data-m6t-zona="${nome}"`)) return null;
      if (!zone.has(nome)) zone.set(nome, { innerHTML: "" });
      return zone.get(nome);
    }
  };
}

export function monta({ larghezza = 1920, schermo = [1920, 1080], tocco = false, valori: iniziali = {} } = {}) {
  const agganci = { once: {}, on: {} };
  const schede = [];
  const impostazioni = new Map([["core.noCanvas", { default: false }], ["core.messageMode", { default: "public" }]]);
  const valori = new Map(Object.entries(iniziali));
  const messaggi = [];
  const classiBody = new Set();
  const figli = [];
  const ricariche = [];
  const avvisi = [];
  const sessione = new Map();
  const modelli = [];
  const aiuti = {};

  globalThis.foundry = {
    data: { fields: { ArrayField, BooleanField, HTMLField, NumberField, ObjectField, SchemaField, StringField } },
    abstract: { TypeDataModel: class { static migrateData(source) { return source; } } },
    applications: {
      api: { HandlebarsApplicationMixin: (Base) => class extends Base { static PARTS = {}; } },
      sheets: { ActorSheetV2: FintaScheda, ItemSheetV2: FintaScheda },
      handlebars: { loadTemplates: (elenco) => { modelli.push(...elenco); return Promise.resolve(); } },
      apps: { DocumentSheetConfig: { registerSheet: (documentClass, scope, sheetClass, options) => schede.push({ documentClass, scope, sheetClass, options }) } }
    },
    dice: { Roll: FintaRoll, terms: { Die: class { constructor(dati = {}) { Object.assign(this, dati); } } } },
    utils: { getProperty: (oggetto, percorso) => percorso.split(".").reduce((dove, chiave) => dove?.[chiave], oggetto) }
  };
  globalThis.Hooks = {
    once: (nome, funzione) => { agganci.once[nome] = funzione; },
    on: (nome, funzione) => { (agganci.on[nome] ??= []).push(funzione); }
  };
  globalThis.CONFIG = { Actor: { dataModels: {} }, Item: { dataModels: {} }, ChatMessage: { dataModels: {} }, Dice: { terms: {}, rolls: [] } };
  globalThis.Actor = class {};
  globalThis.Item = class {};
  globalThis.Handlebars = { registerHelper: (nome, funzione) => { aiuti[nome] = funzione; } };
  globalThis.ChatMessage = {
    getSpeaker: ({ actor }) => ({ actor: actor.id, alias: actor.name }),
    create: async (dati, opzioni) => {
      const messaggio = { ...dati, opzioni, id: `m${messaggi.length}`, alias: dati.speaker?.alias ?? "", visible: true, isContentVisible: true };
      messaggi.push(messaggio);
      for (const funzione of agganci.on.createChatMessage ?? []) funzione(messaggio);
      return messaggio;
    }
  };
  globalThis.ui = { notifications: { warn: (testo) => avvisi.push(testo) } };
  globalThis.game = {
    i18n: { lang: "it", localize: (chiave) => chiave },
    settings: {
      register: (spazio, chiave, config) => impostazioni.set(`${spazio}.${chiave}`, config),
      get: (spazio, chiave) => (valori.has(`${spazio}.${chiave}`) ? valori.get(`${spazio}.${chiave}`) : impostazioni.get(`${spazio}.${chiave}`)?.default),
      set: (spazio, chiave, valore) => { valori.set(`${spazio}.${chiave}`, valore); return Promise.resolve(valore); }
    },
    user: { character: null },
    actors: [],
    messages: { get contents() { return messaggi; } },
    socket: { on() {}, io: { on() {} } },
    logOut: () => ricariche.push("esci")
  };
  globalThis.window = {
    innerWidth: larghezza,
    screen: { width: schermo[0], height: schermo[1] },
    matchMedia: () => ({ matches: tocco }),
    sessionStorage: { getItem: (chiave) => sessione.get(chiave) ?? null, setItem: (chiave, valore) => sessione.set(chiave, valore), removeItem: (chiave) => sessione.delete(chiave) },
    location: { reload: () => ricariche.push("ricarica") }
  };
  globalThis.document = {
    body: { classList: { add: (nome) => classiBody.add(nome) }, append: (figlio) => figli.push(figlio) },
    createElement: (tag) => nodo(tag)
  };

  return { agganci, schede, impostazioni, valori, messaggi, classiBody, figli, ricariche, avvisi, sessione, modelli, aiuti };
}
