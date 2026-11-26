import assert from "node:assert/strict";
import { tiraDalTelefono, tiroDallaScelta } from "../scripts/telefono-tiro.js";
import { hasSoglia, isMagick } from "../scripts/tiro.js";

// La scelta corta della pagina del telefono diventa il tiro della scheda: un Attributo, un'Abilità, la soglia.
const tiro = tiroDallaScelta({ attributo: "dexterity", abilita: "athletics", soglia: 3 });
assert.deepEqual([tiro.attribute, tiro.skill, tiro.soglia], ["dexterity", "skill:athletics", 3]);
assert.equal(isMagick(tiro), false, "dal telefono parte un tiro di Abilità");
assert.equal(hasSoglia(tiro), true);
// Senza soglia il tiro resta senza: sarà il tiro della scheda a dire che manca.
assert.equal(hasSoglia(tiroDallaScelta({ attributo: "dexterity", abilita: "athletics" })), false);
assert.deepEqual([tiroDallaScelta({}).attribute, tiroDallaScelta({}).skill], [null, null]);
// La soglia sta nei limiti del tiro di Abilità.
assert.equal(tiroDallaScelta({ attributo: "wits", abilita: "awareness", soglia: 12 }).soglia, 7);

// Il PNG tira la sua riserva secca, col tiro semplice: senza scheda sua non parte, e dice perché.
globalThis.game = { i18n: { localize: (k) => k } };
assert.deepEqual(await tiraDalTelefono({ type: "png", isOwner: false }, { campo: "physical", soglia: 1 }), { manca: "M6.Base.Tiro.NonTuo" });

console.log("telefono-tiro test passed.");
