import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BARRA_SALUTE, DATI_DEI_TOKEN, saluteDellaBarra } from "../scripts/attore.js";

// La barra dei token legge la Salute al contrario dei danni: quante caselle restano libere.
assert.deepEqual(saluteDellaBarra({ max: 7, total: 3 }), { value: 4, max: 7 });
assert.deepEqual(saluteDellaBarra({ max: 7, total: 0 }), { value: 7, max: 7 }, "sano");
assert.deepEqual(saluteDellaBarra({ max: 5, total: 9 }), { value: 0, max: 5 }, "mai sotto zero");
assert.deepEqual(saluteDellaBarra(null), { value: 0, max: 0 }, "senza dati non rompe");

// I due tipi di attore offrono la Salute alle barre, e il manifesto la mette come prima barra.
assert.deepEqual(Object.keys(DATI_DEI_TOKEN), ["mago", "png"]);
for (const tipo of Object.values(DATI_DEI_TOKEN)) assert.deepEqual(tipo.bar, [BARRA_SALUTE]);
const manifesto = JSON.parse(readFileSync(new URL("../system.json", import.meta.url), "utf8"));
assert.equal(manifesto.primaryTokenAttribute, BARRA_SALUTE);
assert.deepEqual(Object.keys(manifesto.documentTypes.Actor).sort(), Object.keys(DATI_DEI_TOKEN).sort(), "un tipo nuovo va aggiunto anche qui");

console.log("attore test passed.");
