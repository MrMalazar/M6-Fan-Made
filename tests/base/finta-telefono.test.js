/**
 * La base caricata dentro la Foundry finta, da un telefono: la pagina
 * copre Foundry da subito, la mappa si spegne a `setup`, e a `ready` la
 * pagina fa scegliere, tira e tiene l'elenco dei tiri.
 */
import assert from "node:assert/strict";
import { FintaRoll, monta } from "./finta/foundry.mjs";

const { agganci, valori, messaggi, classiBody, figli, ricariche, sessione } = monta({ larghezza: 390, schermo: [390, 844], tocco: true });
await import("../../scripts/base/avvio.js");

// A init: la pagina copre tutto, con un segno d'attesa e senza parole (le traduzioni arrivano dopo).
agganci.once.init();
assert.equal(classiBody.has("m6-telefono"), true);
assert.equal(figli.length, 1);
const pagina = figli[0];
assert.equal(pagina.id, "m6-telefono");
assert.match(pagina.innerHTML, /m6t-carico/);
assert.doesNotMatch(pagina.innerHTML, /M6\./);

// A setup: la mappa si spegne, e si segna che l'abbiamo spenta noi.
agganci.once.setup();
assert.equal(valori.get("core.noCanvas"), true);
assert.equal(valori.get("m6.mappaSpenta"), true);

// A ready: due schede di chi è entrato (una non sua resta fuori), il suo personaggio per primo.
const marco = { id: "a1", name: "Marco", type: "mago", isOwner: true, system: { attributes: { dexterity: { value: 4 }, strength: { value: 2 } }, skills: { athletics: { value: 3 } } } };
const soldato = { id: "a2", name: "Soldato", type: "png", isOwner: true, system: { standarddicepools: { physical: { value: 3 }, social: { value: 0 }, mental: { value: 1 } } } };
const altrui = { id: "a3", name: "Altrui", type: "mago", isOwner: false, system: {} };
game.actors = Object.assign([soldato, altrui, marco], { get: (id) => [soldato, altrui, marco].find((actor) => actor.id === id) });
game.user.character = marco;
agganci.once.ready();

const tiro = () => pagina.zone.get("tiro").innerHTML;
const tiri = () => pagina.zone.get("tiri").innerHTML;
assert.match(tiro(), /<select class="m6t-chi" data-m6t="attore"[^>]*><option value="a1" selected>Marco<\/option><option value="a2">Soldato<\/option><\/select>/);
assert.doesNotMatch(tiro(), /Altrui/);
assert.match(tiro(), /data-tipo="attributo"/);
assert.match(tiro(), /data-tipo="abilita"/);
assert.match(tiro(), /<button type="button" class="m6t-tira" data-m6t="tira" disabled>M6\.Base\.Tiro\.MancaCoppia<\/button>/, "spento, il tasto dice cosa manca");
assert.match(tiri(), /M6\.Base\.Telefono\.NessunTiro/);

// I gesti: due tendine e la soglia.
const cambia = (dataset, value) => pagina.ascolti.change({ target: { closest: () => ({ dataset, value }) } });
const tocca = (dataset) => pagina.ascolti.click({ target: { closest: () => ({ dataset, disabled: false }) } });
cambia({ m6t: "sceglie", tipo: "attributo" }, "dexterity");
cambia({ m6t: "sceglie", tipo: "abilita" }, "athletics");
assert.match(tiro(), /<b class="m6t-dadi">7 M6\.Base\.Tiro\.Dadi<\/b>/);
assert.match(tiro(), /disabled>M6\.Base\.Tiro\.MancaSoglia<\/button>/, "senza soglia il tiro non parte");
await tocca({ m6t: "soglia", valore: "2" });
assert.match(tiro(), /class="m6t-soglia scelta" data-m6t="soglia" data-valore="2" aria-pressed="true"/);
assert.match(tiro(), /data-m6t="tira">M6\.Base\.Tiro\.Tira<\/button>/);

// Il tiro: parte, entra nell'elenco, e la soglia si svuota.
FintaRoll.prossimi = [1, 2, 3, 4, 5, 7, 9];
await tocca({ m6t: "tira" });
assert.equal(messaggi.length, 1);
assert.deepEqual(messaggi[0].system, { attributo: "dexterity", abilita: "athletics", campo: "", soglia: 2, risultati: [1, 2, 3, 4, 5, 7, 9] });
assert.match(tiri(), /<b>Marco<\/b><span>M6\.Comuni\.Attributi\.dexterity \+ M6\.Comuni\.Abilita\.athletics<\/span>/);
assert.match(tiri(), /<b>M6\.Base\.Tiro\.Successo<\/b><span>2 M6\.Base\.Tiro\.Su 2<\/span>/);
assert.match(tiro(), /disabled>M6\.Base\.Tiro\.MancaSoglia<\/button>/, "il prossimo tiro chiede la sua soglia");

// Un tiro fatto da un altro (dal PC) entra nell'elenco, in cima.
await ChatMessage.create({ type: "tiro", speaker: { alias: "Leo" }, system: { attributo: "forza", abilita: "mischia", campo: "", soglia: 3, risultati: [2, 6] } });
assert.ok(tiri().indexOf("<b>Leo</b>") < tiri().indexOf("<b>Marco</b>"), "il più recente sta in cima");
assert.match(tiri(), /m6t-riga--fallimento/);
// Un tiro che chi guarda non può vedere resta fuori; un messaggio che non è un tiro pure.
messaggi.push({ type: "tiro", alias: "Segreto", visible: true, isContentVisible: false, system: { soglia: 1, risultati: [10] } });
messaggi.push({ type: "base", alias: "Chiacchiera", visible: true, isContentVisible: true, system: {} });
for (const funzione of agganci.on.createChatMessage) funzione();
assert.doesNotMatch(tiri(), /Segreto|Chiacchiera/);

// Cambiando scheda la scelta si svuota; il PNG tira una riserva.
cambia({ m6t: "attore" }, "a2");
assert.match(tiro(), /<option value="a2" selected>Soldato<\/option>/);
assert.match(tiro(), /data-tipo="campo"/);
assert.doesNotMatch(tiro(), /data-tipo="attributo"/);
cambia({ m6t: "sceglie", tipo: "campo" }, "social");
assert.match(tiro(), /disabled>M6\.Base\.Tiro\.ZeroDadi<\/button>/);

// I due tasti in fondo: il Foundry intero vale per la visita e ricarica; Esci esce.
await tocca({ m6t: "intero" });
assert.equal(sessione.get("m6.intero"), "1");
await tocca({ m6t: "esci" });
assert.deepEqual(ricariche, ["ricarica", "esci"]);

console.log("Finta Foundry, telefono: test passati.");
