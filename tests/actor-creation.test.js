import assert from "node:assert/strict";
import { MODULE_ID } from "../scripts/constants.js";
import { NATURE } from "../scripts/nemico.js";
import { CAMPI_CREAZIONE, datiDiCreazione, registerActorCreationChoice } from "../scripts/actor-creation.js";

// La finestra «Crea attore». Due prove: i dati, in funzioni pure; e la
// finestra montata su un finto DOM e letta come la legge Foundry.

/* ------------------------------------------------------------------ i dati */

const NATURA = `flags.${MODULE_ID}.nemico.natura`;
assert.deepEqual(CAMPI_CREAZIONE, { natura: NATURA });

// Un PNG di M6 nasce con la sua Natura, nella bandiera del sistema: nei dati della scheda non va niente.
assert.deepEqual(datiDiCreazione({ natura: "vampire" }), { [NATURA]: "vampire" });
assert.deepEqual(datiDiCreazione({ natura: "risvegliato" }), { [NATURA]: "risvegliato" });
assert.ok(!Object.keys(datiDiCreazione({ natura: "werewolf" })).some((nome) => nome.startsWith("system.")), "niente va nei dati della scheda");
// Senza Natura non parte niente: il Mago, e il PNG scelto dalla voce di Foundry.
assert.deepEqual(datiDiCreazione({ natura: "" }), {});
assert.deepEqual(datiDiCreazione(), {});

/* --------------------------------------------------------------- il finto DOM */

// Quel tanto di DOM che la finestra usa: elementi, classi, dataset, i selettori
// del modulo, il valore delle tendine, i listener.
class Nodo {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.attrs = {};
    this.classi = new Set();
    this.classList = { add: (...c) => c.forEach((x) => this.classi.add(x)), contains: (c) => this.classi.has(c) };
    this.hidden = false;
    this.disabled = false;
    this.selected = false;
    this.textContent = "";
    this.name = "";
    this.label = "";
    this.type = "";
    this.valore = "";
    this.listeners = {};
  }
  append(...nodi) { for (const nodo of nodi) { nodo.parent = this; this.children.push(nodo); } }
  insertAdjacentElement(dove, nodo) {
    assert.equal(dove, "afterend");
    const fratelli = this.parent.children;
    fratelli.splice(fratelli.indexOf(this) + 1, 0, nodo);
    nodo.parent = this.parent;
  }
  setAttribute(chiave, valore) { this.attrs[chiave] = String(valore); }
  addEventListener(tipo, fn) { (this.listeners[tipo] ??= []).push(fn); }
  dispatch(tipo) { for (const fn of this.listeners[tipo] ?? []) fn({ type: tipo, target: this }); }
  *discendenti() { for (const figlio of this.children) { yield figlio; yield* figlio.discendenti(); } }
  matches(selettore) {
    const m = /^([a-z]*)(?:\.([\w-]+))?(?:\[([\w-]+)="([^"]*)"\])?$/.exec(selettore);
    assert.ok(m, `selettore non previsto dal finto DOM: ${selettore}`);
    const [, tag, classe, attributo, valore] = m;
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    if (classe && !this.classi.has(classe)) return false;
    if (attributo) {
      const letto = attributo.startsWith("data-")
        ? this.dataset[attributo.slice(5).replace(/-(\w)/g, (_, c) => c.toUpperCase())]
        : (attributo === "value" ? this.value : this[attributo]);
      if (String(letto ?? "") !== valore || letto === undefined) return false;
    }
    return true;
  }
  querySelector(selettore) { for (const nodo of this.discendenti()) if (nodo.matches(selettore)) return nodo; return null; }
  closest(selettore) { for (let nodo = this; nodo; nodo = nodo.parent) if (nodo.matches(selettore)) return nodo; return null; }
  get options() { return [...this.discendenti()].filter((nodo) => nodo.tagName === "OPTION"); }
  get selectedOptions() { const scelta = this.options.find((o) => o.selected) ?? this.options[0]; return scelta ? [scelta] : []; }
  get value() { return this.tagName === "SELECT" ? (this.selectedOptions[0]?.value ?? "") : this.valore; }
  set value(v) {
    if (this.tagName !== "SELECT") { this.valore = String(v); return; }
    const scelta = this.options.find((o) => o.value === String(v));
    for (const o of this.options) o.selected = o === scelta;
  }
  /** Quel che fa chi usa la tendina: sceglie una voce, e parte il «change». */
  scegli(option) { for (const o of this.options) o.selected = o === option; this.dispatch("change"); }
}

const nodo = (tag, props = {}, figli = []) => { const n = new Nodo(tag); Object.assign(n, props); n.append(...figli); return n; };
const voce = (value, testo, selected = false) => { const o = nodo("option", { textContent: testo, selected }); o.value = value; return o; };

/** La finestra di Foundry 14 (templates/sidebar/document-create.html): nome, tipo con la sua nota, cartella. */
function finestra(tipi, { conNota = true } = {}) {
  const tipo = nodo("select", { name: "type" }, tipi.map(([value, testo]) => voce(value, testo, value === "mago")));
  const gruppoTipo = nodo("div", {}, [nodo("label", { textContent: "Tipo" }), nodo("div", {}, [tipo])]);
  gruppoTipo.classi.add("form-group");
  if (conNota) { const nota = nodo("p"); nota.classi.add("hint"); gruppoTipo.append(nota); }
  const nome = nodo("div", {}, [nodo("input", { name: "name", type: "text" })]);
  nome.classi.add("form-group");
  const cartella = nodo("div", {}, [nodo("select", { name: "folder" }, [voce("", "")])]);
  cartella.classi.add("form-group");
  const form = nodo("form", {}, [nome, gruppoTipo, cartella]);
  return { radice: nodo("dialog", {}, [form]), form, tipo, gruppoTipo };
}

/**
 * Come Foundry 14 legge la finestra (FormDataExtended): i campi col nome, in
 * ordine; quello spento si salta; ma se più campi hanno lo stesso nome il
 * valore diventa la lista di tutti, spenti compresi. È la regola che nella
 * 1.33.0 faceva arrivare la scheda come lista.
 */
function lettaDaFoundry(form) {
  const campi = [...form.discendenti()].filter((n) => ["INPUT", "SELECT", "TEXTAREA"].includes(n.tagName));
  const dati = {};
  for (const campo of campi) {
    if (!campo.name || campo.name in dati || campo.disabled) continue;
    const omonimi = campi.filter((altro) => altro.name === campo.name);
    dati[campo.name] = omonimi.length > 1 ? omonimi.map((altro) => altro.value) : campo.value;
  }
  return dati;
}

/* ------------------------------------------------------- la finestra montata */

const parole = { "M6.Creation.Nemico.Voce": "PNG · {natura}" };
const ganci = {};
globalThis.Hooks = { on: (nome, fn) => { ganci[nome] = fn; } };
globalThis.document = { createElement: (tag) => new Nodo(tag) };
globalThis.game = { i18n: {
  localize: (chiave) => parole[chiave] ?? chiave,
  format: (chiave, dati = {}) => Object.entries(dati).reduce((testo, [k, v]) => testo.replaceAll(`{${k}}`, String(v)), parole[chiave] ?? chiave)
} };
registerActorCreationChoice();
assert.equal(typeof ganci.renderDialogV2, "function");

const TIPI = [["mago", "Mago"], ["png", "PNG"]];
const f = finestra(TIPI);
ganci.renderDialogV2({}, f.radice);
const campiDopoUnGiro = [...f.form.discendenti()].length;
ganci.renderDialogV2({}, f.radice);
assert.equal([...f.form.discendenti()].length, campiDopoUnGiro, "un secondo render non raddoppia niente");

// Un solo campo per nome, sempre: è questo che tiene la Natura fuori dalle liste.
const nomi = [...f.form.discendenti()].map((n) => n.name).filter(Boolean);
assert.equal(new Set(nomi).size, nomi.length, `campi con lo stesso nome: ${nomi}`);
assert.deepEqual(nomi.filter((n) => n === NATURA), [NATURA]);

// La nota del PNG di M6, sotto quella di Foundry.
const note = f.gruppoTipo.children.filter((n) => n.classi.has("hint"));
assert.equal(note.length, 2, "sotto il tipo: la nota di Foundry e, dopo, quella del PNG di M6");
assert.equal(note[1].dataset.module, MODULE_ID);
assert.equal(f.gruppoTipo.querySelector(".hint"), note[0], "la prima nota resta quella di Foundry, che la riscrive a ogni cambio");

// Il gruppo «PNG di M6»: una voce per Natura, tutte `png`.
const gruppoM6 = f.tipo.children.find((n) => n.tagName === "OPTGROUP");
assert.equal(gruppoM6.label, "M6.Creation.Nemico.Gruppo");
assert.deepEqual(gruppoM6.children.map((o) => [o.value, o.dataset.m6Natura]), NATURE.map((n) => ["png", n.id]));

// Alla prima apertura: il Mago, niente in più nei dati.
assert.deepEqual(lettaDaFoundry(f.form), { name: "", type: "mago", folder: "" });
assert.equal(note[1].hidden, true);

// Ogni PNG di M6: tipo png e Natura. Nient'altro.
for (const natura of NATURE) {
  f.tipo.scegli(gruppoM6.children.find((o) => o.dataset.m6Natura === natura.id));
  assert.deepEqual(lettaDaFoundry(f.form), { name: "", type: "png", [NATURA]: natura.id, folder: "" }, `PNG M6, ${natura.id}`);
  assert.equal(note[1].hidden, false, "la nota del PNG di M6 compare");
}

// Il PNG dalla voce di Foundry, e il Mago: niente Natura.
for (const [value] of TIPI) {
  f.tipo.scegli(f.tipo.children.find((o) => o.value === value));
  assert.deepEqual(lettaDaFoundry(f.form), { name: "", type: value, folder: "" }, value);
  assert.equal(note[1].hidden, true);
}

// Una finestra senza la nota di Foundry: il sistema gliela lascia pronta, e la sua resta la seconda.
const senza = finestra(TIPI, { conNota: false });
ganci.renderDialogV2({}, senza.radice);
const noteSenza = senza.gruppoTipo.children.filter((n) => n.classi.has("hint"));
assert.equal(noteSenza.length, 2);
assert.equal(noteSenza[0].dataset.module, undefined);
assert.equal(noteSenza[1].dataset.module, MODULE_ID);

// Una finestra che non è «Crea attore» (i tipi degli oggetti): il sistema non tocca niente.
const oggetti = finestra([["weapon", "Arma"], ["gear", "Oggetto"]]);
const prima = [...oggetti.form.discendenti()].length;
ganci.renderDialogV2({}, oggetti.radice);
assert.equal([...oggetti.form.discendenti()].length, prima);

// Solo PNG (una finestra coi tipi ristretti): le voci di M6 ci sono.
const soloPng = finestra([["png", "PNG"]]);
ganci.renderDialogV2({}, soloPng.radice);
const m6 = soloPng.tipo.children.find((n) => n.tagName === "OPTGROUP");
soloPng.tipo.scegli(m6.children.find((o) => o.dataset.m6Natura === "werewolf"));
assert.deepEqual(lettaDaFoundry(soloPng.form), { name: "", type: "png", [NATURA]: "werewolf", folder: "" });

console.log("crea attore: ok");
