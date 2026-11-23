import assert from "node:assert/strict";
import { leggiTiro, riservaAbilita, riservaPng, sogliaValida } from "../../scripts/base/riserva.js";
import { ABILITA, ATTRIBUTI, CAMPI, DALLA_PRIMA, nomeAbilita, nomeAttributo, nomeCampo, TUTTE_ABILITA, TUTTI_ATTRIBUTI, vociDeiTratti } from "../../scripts/base/tratti.js";

// La tavola dei tratti: nove Attributi e quattordici Abilità, nei tre campi.
assert.deepEqual(CAMPI, ["physical", "social", "mental"]);
assert.deepEqual(Object.keys(ATTRIBUTI), CAMPI);
assert.deepEqual(Object.keys(ABILITA), CAMPI);
assert.equal(TUTTI_ATTRIBUTI.length, 9);
assert.equal(TUTTE_ABILITA.length, 14);
assert.equal(new Set([...TUTTI_ATTRIBUTI, ...TUTTE_ABILITA]).size, 23, "nessun nome doppio");
assert.deepEqual(ABILITA.physical, ["athletics", "brawl", "craft", "firearms", "larceny", "survival"]);
assert.deepEqual(ABILITA.social, ["performance", "persuasion", "subterfuge"]);
assert.deepEqual(ABILITA.mental, ["academics", "awareness", "investigation", "medicine", "occult"]);

// Le chiavi della 0.1.0 portano tutte a un tratto di oggi, una per una.
assert.deepEqual(Object.values(DALLA_PRIMA.attributi).sort(), [...TUTTI_ATTRIBUTI].sort());
assert.deepEqual(Object.values(DALLA_PRIMA.abilita).sort(), [...TUTTE_ABILITA].sort());
assert.deepEqual(Object.values(DALLA_PRIMA.campi), CAMPI);

// I nomi stanno nel file di lingua, sotto una chiave per tratto.
assert.deepEqual([nomeAttributo("wits"), nomeAbilita("occult"), nomeCampo("social")], ["M6.Comuni.Attributi.wits", "M6.Comuni.Abilita.occult", "M6.Comuni.Campi.social"]);

// Le voci come le vuole la scheda: per campo, col valore intero e il nome letto.
{
  const voci = vociDeiTratti(ATTRIBUTI, { strength: { value: 3 }, wits: { value: "2" } }, nomeAttributo, (chiave) => `[${chiave}]`);
  assert.deepEqual(Object.keys(voci), CAMPI);
  assert.deepEqual(voci.physical[0], { value: 3, id: "strength", displayName: "[M6.Comuni.Attributi.strength]" });
  assert.equal(voci.mental[1].value, 2);
  assert.equal(voci.social[0].value, 0, "un tratto che manca vale zero");
  const abilita = vociDeiTratti(ABILITA, { athletics: { value: 2, bonuses: [{ source: "Corsa" }] } }, nomeAbilita);
  assert.deepEqual(abilita.physical[0].bonuses, [{ source: "Corsa" }], "le Specializzazioni viaggiano con l'Abilità");
}

// La riserva: Attributo più Abilità. Il cancello di Marco: Destrezza 4, Atletica 3.
const marco = {
  attributes: { dexterity: { value: 4 }, strength: { value: 2 } },
  skills: { athletics: { value: 3 }, occult: { value: 0 } }
};
assert.deepEqual(riservaAbilita(marco, "dexterity", "athletics"), { pronto: true, attributo: 4, abilita: 3, dadi: 7 });
assert.equal(riservaAbilita(marco, "strength", "occult").dadi, 2, "un'Abilità a zero lascia il solo Attributo");
assert.equal(riservaAbilita(marco, "dexterity", "").pronto, false, "senza l'Abilità non c'è riserva");
assert.equal(riservaAbilita(marco, "", "athletics").pronto, false, "senza l'Attributo non c'è riserva");
assert.equal(riservaAbilita(marco, "athletics", "dexterity").pronto, false, "i due posti non si scambiano");
assert.equal(riservaAbilita(undefined, "strength", "firearms").dadi, 0, "una scheda che manca non rompe niente");

// La riserva di un PNG: i dadi scritti nel campo.
const soldato = { standarddicepools: { physical: { value: 5 }, social: { value: 2 }, mental: { value: 0 } } };
assert.deepEqual(riservaPng(soldato, "physical"), { pronto: true, dadi: 5 });
assert.deepEqual(riservaPng(soldato, "mental"), { pronto: true, dadi: 0 });
assert.equal(riservaPng(soldato, "").pronto, false);
assert.equal(riservaPng(soldato, "strength").pronto, false);

// La soglia di un tiro di Abilità: intera, da 1 a 7. Senza soglia il tiro non parte.
assert.deepEqual([1, 4, 7, "3"].map(sogliaValida), [true, true, true, true]);
assert.deepEqual([null, undefined, "", 0, 8, 2.5, "x", NaN].map(sogliaValida), [false, false, false, false, false, false, false, false]);

// Gli esempi del Sistema. Otto dadi a soglia 2: due scintille, riuscito, margine zero.
{
  const tiro = leggiTiro([1, 2, 3, 4, 5, 5, 7, 9], 2);
  assert.equal(tiro.successi, 2);
  assert.equal(tiro.riuscito, true);
  assert.equal(tiro.margine, 0);
  assert.equal(tiro.mancano, 0);
  assert.deepEqual(tiro.facce, ["vuota", "vuota", "vuota", "vuota", "vuota", "vuota", "scintilla", "scintilla"]);
}
// Una scintilla sola a soglia 2: fallito, ne manca uno.
{
  const tiro = leggiTiro([1, 2, 3, 3, 4, 5, 5, 8], 2);
  assert.equal(tiro.successi, 1);
  assert.equal(tiro.riuscito, false);
  assert.equal(tiro.mancano, 1);
  assert.equal(tiro.margine, 0);
}
// Le stelline a coppie: tre fanno 5 successi, quattro ne fanno 8.
assert.equal(leggiTiro([10, 10, 10], 5).successi, 5);
assert.equal(leggiTiro([10, 10, 10], 5).riuscito, true);
assert.equal(leggiTiro([10, 10, 10, 10], 3).margine, 5);
assert.deepEqual(leggiTiro([6, 10], 1).facce, ["scintilla", "stellina"]);

// I dati rotti non fanno saltare la carta: i numeri fuori dal dado si scartano.
assert.deepEqual(leggiTiro([0, 11, "x", 7], 1).risultati, [7]);
assert.equal(leggiTiro(undefined, 3).successi, 0);
assert.equal(leggiTiro(undefined, 3).mancano, 3);
// Una soglia oltre 7 si legge com'è scritta: serve alle carte di Magick, che arrivano dopo.
assert.equal(leggiTiro([6, 7, 8], 9).soglia, 9);

console.log("Riserva: test passati.");
