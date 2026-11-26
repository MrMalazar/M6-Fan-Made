import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAMPI_OGGETTO, RARITA, TIRI, campiDi, haDadiScritti, modificatoreNuovo, modificatoriDalModulo, modificatoriPerLaScheda, valoriDeiCampi } from "../../scripts/base/campi-oggetto.js";

const it = JSON.parse(readFileSync(new URL("../../lang/it.json", import.meta.url), "utf8"));
const en = JSON.parse(readFileSync(new URL("../../lang/en.json", import.meta.url), "utf8"));
const manifesto = JSON.parse(readFileSync(new URL("../../system.json", import.meta.url), "utf8"));
const voce = (lingua, chiave) => chiave.split(".").reduce((dove, k) => (dove && typeof dove === "object" ? dove[k] : undefined), lingua);
const dice = (chiave) => voce(it, chiave) ?? chiave;

// La tavola copre tutti i tipi di oggetto del manifesto, e ogni chiave che nomina esiste nelle due lingue.
assert.deepEqual(Object.keys(CAMPI_OGGETTO).sort(), Object.keys(manifesto.documentTypes.Item).sort());
const FORME = ["scelta", "numero", "testo", "spunta", "pallini", "usi"];
for (const [tipo, campi] of Object.entries(CAMPI_OGGETTO)) {
  for (const campo of campi) {
    assert.ok(FORME.includes(campo.tipo), `${tipo}: forma sconosciuta ${campo.tipo}`);
    assert.match(campo.nome, /^(system|flags\.m6)\./, `${tipo}: ${campo.nome} scrive fuori dal documento`);
    const chiavi = [campo.etichetta, campo.nota, ...(campo.scelte ?? []).map(([, etichetta]) => etichetta)].filter((k) => k && k.startsWith("M6."));
    for (const chiave of chiavi) {
      assert.equal(typeof voce(it, chiave), "string", `manca in italiano: ${chiave}`);
      assert.equal(typeof voce(en, chiave), "string", `manca in inglese: ${chiave}`);
    }
  }
}
assert.deepEqual(campiDi("tipo che non esiste"), []);

// Un'arma del catalogo: i suoi campi coi valori, nell'ordine della tavola.
const pistola = {
  type: "weapon",
  system: { weaponType: "ranged", weaponvalue: 3, quantity: 1, uses: { enabled: true, current: 2, max: 3 } },
  flags: { m6: { aggravato: false, dettagli: "Un tiro di pistola", rarita: "Riservata", grado: 2 } }
};
const campi = valoriDeiCampi(pistola, dice);
assert.deepEqual(campi.map((c) => c.nome), ["system.weaponType", "system.weaponvalue", "flags.m6.aggravato", "flags.m6.dettagli", "flags.m6.rarita", "flags.m6.grado", "system.quantity", "system.uses"]);
const per = (nome) => campi.find((c) => c.nome === nome);
assert.equal(per("system.weaponType").scelte.find((s) => s.selected).label, "Distanza");
assert.equal(per("system.weaponvalue").valore, 3);
assert.equal(per("system.weaponvalue").etichetta, "Danno");
assert.equal(per("flags.m6.aggravato").valore, false);
assert.equal(per("flags.m6.dettagli").valore, "Un tiro di pistola");
assert.deepEqual(per("flags.m6.rarita").scelte.map((s) => s.label), ["nessuna", ...RARITA.slice(1)]);
assert.equal(per("flags.m6.rarita").scelte.find((s) => s.selected).id, "Riservata");
assert.deepEqual([per("flags.m6.grado").valore, per("flags.m6.grado").passi.length], [2, 5]);
assert.deepEqual([per("system.uses").acceso, per("system.uses").rimasti, per("system.uses").pieni], [true, 2, 3]);

// Un valore scritto a mano che la tavola non conosce resta in tendina; i numeri stanno nei loro limiti.
const strana = valoriDeiCampi({ type: "armor", system: { armorvalue: 12 }, flags: { m6: { rarita: "Unica", armatura: "mentale", armaturaPiena: -3 } } }, dice);
assert.equal(strana.find((c) => c.nome === "flags.m6.rarita").scelte.at(-1).id, "Unica");
assert.equal(strana.find((c) => c.nome === "flags.m6.rarita").scelte.at(-1).selected, true);
assert.equal(strana.find((c) => c.nome === "system.armorvalue").valore, 7);
assert.equal(strana.find((c) => c.nome === "flags.m6.armaturaPiena").valore, 0);
assert.equal(strana.find((c) => c.nome === "flags.m6.armatura").scelte.find((s) => s.selected).label, "Mentale");
assert.deepEqual(valoriDeiCampi({ type: "condition", system: {} }, dice), [], "la Condizione non ha campi suoi");
assert.deepEqual(valoriDeiCampi(null, dice), []);

// I dadi scritti: li porta solo una Condizione fuori lista. Quelle della lista prendono il peso dalla lista.
assert.equal(haDadiScritti({ type: "condition", flags: {} }), true, "scritta a mano");
assert.equal(haDadiScritti({ type: "condition", flags: { m6: { condizione: "abbagliato" } } }), false, "della lista");
assert.equal(haDadiScritti({ type: "condition", name: "Abbagliato", flags: {} }, (o) => o.name === "Abbagliato"), false, "le regole la riconoscono dal nome");
assert.equal(haDadiScritti({ type: "weapon", flags: {} }), false);
assert.equal(haDadiScritti(null), false);
const abbagliato = [{ source: "Abbagliato", value: "-2", paths: ["physical", "mental"], displayWhenInactive: false, activeWhen: { check: "always", path: "", value: "" } }];
const righe = modificatoriPerLaScheda(abbagliato, dice);
assert.deepEqual(righe, [{ indice: 0, valore: -2, tiri: [{ id: "physical", label: "Fisico", acceso: true }, { id: "social", label: "Sociale", acceso: false }, { id: "mental", label: "Mentale", acceso: true }] }]);
assert.deepEqual(modificatoriPerLaScheda(undefined, dice), []);
assert.equal(modificatoriPerLaScheda([{ value: "-1", paths: ["all"] }], dice)[0].tiri.every((t) => t.acceso), true, "«all» vale per tutti i tiri");

// Il modulo rimanda le righe: il valore e i tiri cambiano, il resto del modificatore resta com'era.
const salvati = modificatoriDalModulo({ 0: { value: "-3", tiri: { physical: true, social: true, mental: false } } }, abbagliato, "Abbagliato");
assert.deepEqual(salvati, [{ ...abbagliato[0], value: "-3", paths: ["physical", "social"] }]);
// Una riga in più del modulo nasce come modificatore nuovo, col nome dell'oggetto.
const due = modificatoriDalModulo({ 0: { value: -2, tiri: { physical: true, mental: true } }, 1: { value: 1, tiri: { social: "on" } } }, abbagliato, "Abbagliato");
assert.equal(due.length, 2);
assert.deepEqual(due[1], { ...modificatoreNuovo("Abbagliato"), value: "1", paths: ["social"] });
assert.deepEqual(modificatoriDalModulo({}, abbagliato), [], "nessuna riga, nessun modificatore");
assert.deepEqual(modificatoriDalModulo({ 0: { value: "abc", tiri: {} } }, []), [{ ...modificatoreNuovo(""), value: "0", paths: [] }]);
assert.deepEqual(TIRI, ["physical", "social", "mental"]);

console.log("campi-oggetto test passed.");

// Le icone del genere: la tavola del sistema e quella del generatore del catalogo dicono la stessa cosa.
const { ICONA_GENERICA, ICONE_DEL_TIPO, iconaDelTipo, senzaIcona } = await import("../../scripts/base/icone-tipo.js");
assert.equal(iconaDelTipo("weapon", { system: { weaponType: "melee" } }), ICONE_DEL_TIPO.mischia);
assert.equal(iconaDelTipo("weapon", { system: { weaponType: "ranged" } }), ICONE_DEL_TIPO.distanza);
assert.equal(iconaDelTipo("armor", { flags: { m6: { armatura: "mentale" } } }), ICONE_DEL_TIPO.mentale);
assert.equal(iconaDelTipo("armor", {}), ICONE_DEL_TIPO.fisica);
assert.equal(iconaDelTipo("gear", {}), ICONA_GENERICA);
assert.equal(iconaDelTipo("feature", {}), ICONA_GENERICA, "i Vantaggi tengono la sacca: nella pagina Tratti vale la lettera");
assert.deepEqual([senzaIcona(""), senzaIcona(undefined), senzaIcona("/icons/svg/item-bag.svg"), senzaIcona("icons/svg/sword.svg")], [true, true, true, false]);
const generatore = readFileSync(new URL("../../tools/build-equipaggiamento.py", import.meta.url), "utf8");
for (const icona of [ICONA_GENERICA, ...Object.values(ICONE_DEL_TIPO)]) assert.ok(generatore.includes(`"${icona}"`), `il generatore non conosce ${icona}`);
const catalogo = readFileSync(new URL("../../packs/mage-equipaggiamento.db", import.meta.url), "utf8").split("\n").filter(Boolean).map((riga) => JSON.parse(riga));
for (const oggetto of catalogo) assert.equal(oggetto.img, iconaDelTipo(oggetto.type, oggetto), `${oggetto.name}: icona diversa da quella del suo genere`);

console.log("icone del tipo: ok.");
