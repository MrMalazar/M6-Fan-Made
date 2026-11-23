import assert from "node:assert/strict";
import { ABILITA, ATTRIBUTI, CAMPI, RISERVE_PNG, TUTTE_ABILITA, TUTTI_ATTRIBUTI } from "../scripts/costanti.js";
import { leggiTiro, riservaAbilita, riservaPng, sogliaValida } from "../scripts/riserva.js";

// Le liste del Sistema: nove Attributi e quattordici Abilità, nei tre campi.
assert.deepEqual(CAMPI, ["fisico", "sociale", "mentale"]);
assert.deepEqual(Object.keys(ATTRIBUTI), CAMPI);
assert.deepEqual(Object.keys(ABILITA), CAMPI);
assert.equal(TUTTI_ATTRIBUTI.length, 9);
assert.equal(TUTTE_ABILITA.length, 14);
assert.equal(new Set([...TUTTI_ATTRIBUTI, ...TUTTE_ABILITA]).size, 23, "nessun nome doppio");
assert.deepEqual(ABILITA.fisico, ["atletica", "criminalita", "manualita", "mira", "mischia", "sopravvivenza"]);
assert.deepEqual(ABILITA.sociale, ["arte", "convincere", "sotterfugio"]);
assert.deepEqual(ABILITA.mentale, ["allerta", "conoscenze", "investigare", "medicina", "velo"]);
assert.deepEqual(RISERVE_PNG, CAMPI);

// La riserva: Attributo più Abilità. Il cancello di Marco: Destrezza 4, Atletica 3.
const marco = {
  attributi: { destrezza: { valore: 4 }, forza: { valore: 2 } },
  abilita: { atletica: { valore: 3 }, velo: { valore: 0 } }
};
assert.deepEqual(riservaAbilita(marco, "destrezza", "atletica"), { pronto: true, attributo: 4, abilita: 3, dadi: 7 });
assert.equal(riservaAbilita(marco, "forza", "velo").dadi, 2, "un'Abilità a zero lascia il solo Attributo");
assert.equal(riservaAbilita(marco, "destrezza", "").pronto, false, "senza l'Abilità non c'è riserva");
assert.equal(riservaAbilita(marco, "", "atletica").pronto, false, "senza l'Attributo non c'è riserva");
assert.equal(riservaAbilita(marco, "atletica", "destrezza").pronto, false, "i due posti non si scambiano");
assert.equal(riservaAbilita(undefined, "forza", "mira").dadi, 0, "una scheda che manca non rompe niente");

// La riserva di un PNG: i dadi scritti nel campo.
const soldato = { riserve: { fisico: { dadi: 5 }, sociale: { dadi: 2 }, mentale: { dadi: 0 } } };
assert.deepEqual(riservaPng(soldato, "fisico"), { pronto: true, dadi: 5 });
assert.deepEqual(riservaPng(soldato, "mentale"), { pronto: true, dadi: 0 });
assert.equal(riservaPng(soldato, "").pronto, false);
assert.equal(riservaPng(soldato, "forza").pronto, false);

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
