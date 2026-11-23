import assert from "node:assert/strict";
import { modoTelefono, mossaMappa, SCELTE, STRETTO_MAX } from "../scripts/modo.js";

assert.deepEqual(SCELTE, ["auto", "sempre", "mai"]);
assert.equal(STRETTO_MAX, 700);

const pc = { finestra: 1920, schermo: [1920, 1080], tocco: false };
const telefono = { finestra: 390, schermo: [390, 844], tocco: true };

// In automatico: il telefono sì, il PC no.
assert.equal(modoTelefono(pc), false);
assert.equal(modoTelefono(telefono), true);
// Il telefono di traverso resta un telefono, anche dove lo schermo dichiara i lati girati.
assert.equal(modoTelefono({ finestra: 844, schermo: [844, 390], tocco: true }), true);
assert.equal(modoTelefono({ finestra: 932, schermo: [430, 932], tocco: true }), true);
// Il tablet e il portatile col tocco no: il lato corto è largo.
assert.equal(modoTelefono({ finestra: 1180, schermo: [820, 1180], tocco: true }), false);
assert.equal(modoTelefono({ finestra: 1366, schermo: [1366, 768], tocco: true }), false);
// Il PC con lo schermo ingrandito (lato corto sotto misura, ma col mouse) resta un PC.
assert.equal(modoTelefono({ finestra: 1097, schermo: [1097, 617], tocco: false }), false);
// Una finestra stretta è telefono anche sul PC: serve a provarlo.
assert.equal(modoTelefono({ ...pc, finestra: 600 }), true);
assert.equal(modoTelefono({ ...pc, finestra: STRETTO_MAX }), true);
assert.equal(modoTelefono({ ...pc, finestra: STRETTO_MAX + 1 }), false);

// L'impostazione vince sulla misura; il Foundry intero chiesto per la visita vince su tutto.
assert.equal(modoTelefono({ ...pc, scelta: "sempre" }), true);
assert.equal(modoTelefono({ ...telefono, scelta: "mai" }), false);
assert.equal(modoTelefono({ ...telefono, intero: true }), false);
assert.equal(modoTelefono({ ...pc, scelta: "sempre", intero: true }), false);

// Misure che mancano non fanno un telefono.
assert.equal(modoTelefono(), false);
assert.equal(modoTelefono({ finestra: undefined, schermo: [undefined, NaN], tocco: true }), false);
assert.equal(modoTelefono({ finestra: 0, schermo: [0, 0], tocco: true }), false);

// La mappa: sul telefono si spegne e si segna che l'abbiamo spenta noi.
assert.deepEqual(mossaMappa({ telefono: true, spenta: false, nostra: false }), { spenta: true, nostra: true });
// Già spenta: non si tocca niente, nemmeno il segno (chi l'aveva spenta di suo la ritrova spenta).
assert.deepEqual(mossaMappa({ telefono: true, spenta: true, nostra: false }), {});
assert.deepEqual(mossaMappa({ telefono: true, spenta: true, nostra: true }), {});
// Non è più un telefono: si riaccende solo quella che avevamo spento noi.
assert.deepEqual(mossaMappa({ telefono: false, spenta: true, nostra: true }), { spenta: false, nostra: false });
assert.deepEqual(mossaMappa({ telefono: false, spenta: true, nostra: false }), {});
assert.deepEqual(mossaMappa({ telefono: false, spenta: false, nostra: true }), { nostra: false }, "riaccesa a mano: resta solo da togliere il segno");
assert.deepEqual(mossaMappa({ telefono: false, spenta: false, nostra: false }), {});
assert.deepEqual(mossaMappa(), {});

console.log("Modo: test passati.");
