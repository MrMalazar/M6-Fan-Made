import assert from "node:assert/strict";
import { caselleMago, casellePng, conti, dipingi, ritocca, SALUTE_BASE, SEGNI, stato, stringi } from "../scripts/salute.js";

// Le caselle del Mago: 2 + Costituzione + Fermezza, più quelle segnate a mano.
assert.equal(SALUTE_BASE, 2);
assert.equal(caselleMago({ costituzione: 1, fermezza: 1 }), 4, "il Mago appena creato");
assert.equal(caselleMago({ costituzione: 3, fermezza: 2 }), 7);
assert.equal(caselleMago({ costituzione: 3, fermezza: 2, extra: 2 }), 9);
assert.equal(caselleMago({ costituzione: 1, fermezza: 1, extra: -10 }), 1, "mai meno di una");
assert.equal(caselleMago(), 2);

// Le caselle del PNG: il numero scritto, mai meno di una.
assert.deepEqual([5, 0, -3, "4", undefined].map(casellePng), [5, 1, 1, 4, 1]);

assert.deepEqual(SEGNI, ["ps", "pa", "ms", "ma"]);
assert.deepEqual(conti({ ps: 2, pa: -1, ms: "3", ma: undefined }), { pa: 0, ps: 2, ma: 0, ms: 3 });

// I danni fisici da sinistra (aggravati, poi superficiali), i mentali da destra (aggravati all'estremo).
assert.deepEqual(dipingi({ pa: 1, ps: 2, ma: 1, ms: 1 }, 7), ["pa", "ps", "ps", "", "", "ms", "ma"]);
assert.deepEqual(dipingi({}, 3), ["", "", ""]);
assert.deepEqual(dipingi({ ps: 5 }, 3), ["ps", "ps", "ps"], "quello che non ci sta non si dipinge");
assert.deepEqual(dipingi({ ps: 2, ms: 2 }, 3), ["ps", "ps", "ms"], "i fisici tengono il posto, ai mentali resta il resto");

// Stringere, quando il tracciato si accorcia: prima i fisici, poi i mentali, e in ognuno prima gli aggravati.
assert.deepEqual(stringi({ pa: 2, ps: 2, ma: 2, ms: 2 }, 5), { pa: 2, ps: 2, ma: 1, ms: 0 });
assert.deepEqual(stringi({ ps: 1 }, 4), { pa: 0, ps: 1, ma: 0, ms: 0 });

// Lo stato: menomato a tracciato coperto, KO a tutte aggravate.
assert.equal(stato({ ps: 1 }, 4), "");
assert.equal(stato({ ps: 2, ms: 2 }, 4), "menomato");
assert.equal(stato({ pa: 3, ma: 1 }, 4), "ko-fisico");
assert.equal(stato({ pa: 1, ma: 3 }, 4), "ko-mentale");
assert.equal(stato({ pa: 2, ma: 2 }, 4), "ko-fisico", "a pari prevalgono i fisici");

// Un segno in più o in meno.
assert.deepEqual(ritocca({ ps: 1 }, 4, "ps", 1), { pa: 0, ps: 2, ma: 0, ms: 0 });
assert.deepEqual(ritocca({ ps: 1 }, 4, "ma", 1), { pa: 0, ps: 1, ma: 1, ms: 0 });
assert.deepEqual(ritocca({ ps: 1 }, 4, "ps", -1), { pa: 0, ps: 0, ma: 0, ms: 0 });
assert.deepEqual(ritocca({ ps: 0 }, 4, "ps", -1), { pa: 0, ps: 0, ma: 0, ms: 0 }, "sotto zero non si scende");
assert.deepEqual(ritocca({ ps: 2, ms: 2 }, 4, "pa", 1), { pa: 0, ps: 2, ma: 0, ms: 2 }, "a tracciato coperto non entra altro");
assert.deepEqual(ritocca({ ps: 1 }, 4, "xx", 1), { pa: 0, ps: 1, ma: 0, ms: 0 }, "un segno che non esiste non fa niente");

console.log("Salute: test passati.");
