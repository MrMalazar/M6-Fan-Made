/**
 * I pezzi della base che non hanno bisogno di Foundry per essere provati: i
 * modificatori che gli oggetti portano al tiro, i pallini, gli oggetti per
 * gruppi, gli aiuti dei modelli.
 */
import assert from "node:assert/strict";
import Handlebars from "handlebars";
import { registraAiuti } from "../../scripts/base/aiuti.js";
import { getSituationalModifiers } from "../../scripts/base/modificatori.js";
import { perGruppi } from "../../scripts/base/oggetti.js";
import { _onDotCounterChange, _onDotCounterEmpty, accendiPallini } from "../../scripts/base/pallini.js";

/* ---------- i modificatori ---------- */
{
  const condizione = (name, bonuses, altro = {}) => ({ name, system: { bonuses, ...altro } });
  const actor = { items: [
    condizione("Atterrato", [{ source: "Atterrato", value: "-2", paths: ["physical"], activeWhen: { check: "always" } }]),
    condizione("Scosso", [{ value: "-2", paths: ["social", "mental"], activeWhen: { check: "always" } }]),
    condizione("Spenta", [{ source: "Spenta", value: "-2", paths: ["physical"], activeWhen: { check: "always" } }], { suppressed: true }),
    condizione("Ovunque", [{ source: "Ovunque", value: "1", paths: ["all"] }]),
    condizione("A patto", [{ source: "A patto", value: "2", paths: ["physical"], activeWhen: { check: "isEqual" }, displayWhenInactive: true },
                           { source: "Nascosto", value: "2", paths: ["physical"], activeWhen: { check: "isEqual" } }]),
    { name: "Senza bonus", system: {} }
  ] };
  const fisico = await getSituationalModifiers({ actor, selectors: ["physical", "attributes.strength"] });
  assert.deepEqual(fisico.map((voce) => [voce.source, voce.value, voce.isActive]), [["Atterrato", "-2", true], ["Ovunque", "1", true], ["A patto", "2", false]]);
  const mentale = await getSituationalModifiers({ actor, selectors: ["mental"] });
  assert.deepEqual(mentale.map((voce) => voce.source), ["Scosso", "Ovunque"], "senza nome proprio il bonus prende quello dell'oggetto");
  assert.deepEqual(await getSituationalModifiers({ actor, selectors: [] }).then((voci) => voci.map((voce) => voce.source)), ["Ovunque"]);
  assert.deepEqual(await getSituationalModifiers(), []);
}

/* ---------- i pallini ---------- */
{
  const avvisi = [];
  globalThis.ui = { notifications: { warn: (testo) => avvisi.push(testo) } };
  globalThis.game = { i18n: { lang: "it", localize: (chiave) => chiave, format: (chiave, dati) => `${chiave}:${dati.string}` } };
  const scritti = [];
  const oggetto = { update: async (dati) => { scritti.push(["oggetto", dati]); } };
  const actor = { name: "Marco", isOwner: true, system: { locked: false }, items: { get: (id) => (id === "i1" ? oggetto : null) }, update: async (dati) => { scritti.push(["scheda", dati]); } };
  const scheda = { actor };
  const passo = (nome, indice) => ({ dataset: { index: String(indice) }, closest: () => ({ dataset: { name: nome } }) });
  const evento = { preventDefault() {} };

  await _onDotCounterChange.call(scheda, evento, passo("system.skills.athletics.value", 2));
  await _onDotCounterEmpty.call(scheda, evento, passo("system.skills.athletics.value", 0));
  await _onDotCounterChange.call(scheda, evento, passo("items.i1", 4));
  assert.deepEqual(scritti, [["scheda", { "system.skills.athletics.value": 3 }], ["scheda", { "system.skills.athletics.value": 0 }], ["oggetto", { "system.points": 5 }]]);

  // Col lucchetto chiuso, o su una scheda non propria, non si scrive: si avvisa.
  actor.system.locked = true;
  await _onDotCounterChange.call(scheda, evento, passo("system.skills.athletics.value", 1));
  actor.system.locked = false;
  actor.isOwner = false;
  await _onDotCounterEmpty.call(scheda, evento, passo("system.skills.athletics.value", 0));
  assert.equal(scritti.length, 3);
  assert.deepEqual(avvisi, ["M6.Comuni.Notifications.CannotModifyResourceString:Marco", "M6.Comuni.Notifications.NoSufficientPermission"]);

  // A ogni disegno i pallini fino al valore si accendono.
  const passi = Array.from({ length: 5 }, () => ({ accesi: false, classList: { toggle(_nome, acceso) { this.owner.accesi = acceso; }, owner: null } }));
  passi.forEach((p) => { p.classList.owner = p; });
  accendiPallini({ querySelectorAll: () => [{ dataset: { value: "3" }, querySelectorAll: () => passi }] });
  assert.deepEqual(passi.map((p) => p.accesi), [true, true, true, false, false]);
  accendiPallini(null);
}

/* ---------- gli oggetti per gruppi ---------- */
{
  const voce = (name, tipo, sort = 0) => ({ name, sort, system: { featuretype: tipo } });
  const gruppi = perGruppi([voce("Risorse", "background", 2), voce("Alleati", "background", 2), voce("Nemico", "flaw"), voce("Favore", "boon"), voce("Rifugio", "background", 1)],
    ["background", "merit", "flaw"], (oggetto) => oggetto.system.featuretype);
  assert.deepEqual(Object.keys(gruppi), ["background", "merit", "flaw"], "l'ordine è quello chiesto, e i gruppi vuoti ci sono");
  assert.deepEqual(gruppi.background.map((oggetto) => oggetto.name), ["Rifugio", "Alleati", "Risorse"], "prima l'ordine scritto, poi il nome");
  assert.deepEqual(gruppi.merit, []);
  assert.equal(gruppi.flaw.length, 1);
}

/* ---------- gli aiuti dei modelli ---------- */
{
  const hb = Handlebars.create();
  registraAiuti(hb);
  assert.equal(hb.compile("{{#numLoop 5}}[{{this}}]{{/numLoop}}")({}), "[0][1][2][3][4]");
  assert.equal(hb.compile("{{#numLoop n}}x{{/numLoop}}")({ n: "bah" }), "");
  assert.equal(hb.compile("{{#ifnoteq a 'boon'}}sì{{else}}no{{/ifnoteq}}")({ a: "merit" }), "sì");
  assert.equal(hb.compile("{{#ifnoteq a 'boon'}}sì{{else}}no{{/ifnoteq}}")({ a: "boon" }), "no");
  assert.equal(hb.compile("{{#if (isNotEmpty d)}}pieno{{else}}vuoto{{/if}}")({ d: { a: 1 } }), "pieno");
  assert.equal(hb.compile("{{#if (isNotEmpty d)}}pieno{{else}}vuoto{{/if}}")({ d: {} }), "vuoto");
  assert.equal(hb.compile("{{#if (isNotEmpty d)}}pieno{{else}}vuoto{{/if}}")({}), "vuoto");
}

console.log("Pezzi della base: test passati.");
