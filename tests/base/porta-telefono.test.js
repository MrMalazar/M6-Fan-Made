/**
 * La porta del telefono: la lettura di un tiro qualunque, la riga dell'elenco
 * coi rossi, e l'interfaccia di un pacchetto a parte che prende il posto
 * della pagina di serie.
 */
import assert from "node:assert/strict";
import { rigaTiro, rossiHtml } from "../../scripts/base/carta-semplice.js";
import { FintaRoll, monta } from "./finta/foundry.mjs";

const { agganci, messaggi, figli } = monta({ larghezza: 390, schermo: [390, 844], tocco: true });
await import("../../scripts/base/avvio.js");
const { facciaRossa, tiroDelMessaggio } = await import("../../scripts/base/tiro-semplice.js");

// Le facce dei rossi: l'occhio sull'1, l'occhio pieno sul 10, la scintilla dal 6.
assert.deepEqual([1, 2, 5, 6, 9, 10].map(facciaRossa), ["occhio", "vuota", "vuota", "scintilla", "scintilla", "occhio-pieno"]);

// Un tiro della scheda letto dal messaggio: dadi della riserva, rossi, successi e soglia scritti nel tiro.
const termine = (denomination, risultati) => ({ denomination, results: risultati.map((r) => (typeof r === "number" ? { result: r, active: true } : r)) });
const lancio = {
  alias: "Guendalina",
  rolls: [{ total: 3, options: { difficulty: 2, title: "Destrezza + Atletica" }, terms: [termine("m", [2, 7, 10, { result: 4, active: false, discarded: true }, 9]), { operator: "+" }, termine("p", [1, 6, 10])] }]
};
const letto = tiroDelMessaggio(lancio);
assert.deepEqual(letto.risultati, [2, 7, 10, 9], "il dado ritirato con la Volontà non conta più");
assert.deepEqual(letto.facce, ["vuota", "scintilla", "stellina", "scintilla"]);
assert.deepEqual(letto.rossi, [{ numero: 1, faccia: "occhio" }, { numero: 6, faccia: "scintilla" }, { numero: 10, faccia: "occhio-pieno" }]);
assert.deepEqual([letto.chi, letto.coppia, letto.successi, letto.soglia, letto.riuscito], ["Guendalina", "Destrezza + Atletica", 3, 2, true]);
assert.equal(tiroDelMessaggio({ alias: "x", rolls: [{ total: 1, options: { difficulty: 3 }, terms: [termine("m", [8])] }] }).riuscito, false);
assert.equal(tiroDelMessaggio({ alias: "x", rolls: [{ total: 2, options: {}, terms: [termine("m", [8, 9])] }] }).riuscito, null, "senza soglia non c'è esito");
// Un'iniziativa, un dado tirato a mano, una chiacchiera: non sono tiri di riserva.
assert.equal(tiroDelMessaggio({ alias: "x", rolls: [{ total: 7, options: {}, terms: [termine("d", [7])] }] }), null);
assert.equal(tiroDelMessaggio({ alias: "x", rolls: [] }), null);
assert.equal(tiroDelMessaggio(null), null);
// In Foundry la sigla sta sulla classe del dado; l'oggetto dice solo «d10», uguale per tutti.
class DadoFinto { static DENOMINATION = "d"; constructor(numeri) { this.results = numeri.map((result) => ({ result, active: true })); } get denomination() { return "d10"; } }
class RiservaFinta extends DadoFinto { static DENOMINATION = "m"; }
class RossoFinto extends DadoFinto { static DENOMINATION = "p"; }
const vero = tiroDelMessaggio({ alias: "Marco", rolls: [{ total: 2, options: { difficulty: 1, title: "Forza + Atletica" }, terms: [new RiservaFinta([3, 9, 8]), { operator: "+" }, new RossoFinto([1])] }] });
assert.deepEqual([vero.risultati, vero.rossi.map((r) => r.faccia), vero.riuscito], [[3, 9, 8], ["occhio"], true], "il tiro della scheda, come lo salva Foundry");
assert.equal(tiroDelMessaggio({ alias: "x", rolls: [{ total: 7, options: {}, terms: [new DadoFinto([7])] }] }), null, "l'iniziativa, come la salva Foundry");
// Il tiro semplice della 0.1.0 si legge ancora, e non ha rossi.
const semplice = tiroDelMessaggio({ type: "tiro", alias: "Leo", system: { attributo: "dexterity", abilita: "athletics", soglia: 2, risultati: [6, 2] } });
assert.deepEqual([semplice.chi, semplice.successi, semplice.riuscito, semplice.rossi], ["Leo", 1, false, []]);

// La riga dell'elenco: i rossi dopo i dadi della riserva, e senza soglia solo il conto.
const parole = { successo: "SUCCESSO", fallimento: "FALLIMENTO", successi: "Successi", su: "su" };
const riga = rigaTiro(letto, parole);
assert.match(riga, /m6t-riga--successo/);
assert.match(riga, /m6-dado--stellina[^>]*><\/span><span class="m6-dado m6-dado--scintilla" title="9"><\/span><span class="m6-dado m6-dado--rosso m6-dado--rosso-occhio" title="1">/);
assert.match(riga, /<b>SUCCESSO<\/b><span>3 su 2<\/span>/);
const conto = rigaTiro({ ...letto, soglia: 0, riuscito: null }, parole);
assert.match(conto, /m6t-riga--conto/);
assert.match(conto, /<b>Successi<\/b><span>3<\/span>/);
assert.equal(rossiHtml(undefined), "");
assert.match(rossiHtml([{ numero: 3, faccia: "inventata" }]), /m6-dado--rosso-vuota/, "una faccia sconosciuta resta vuota");

// ---------------------------------------------------------------- la porta
agganci.once.init();
const porta = game.m6.telefono;
assert.equal(porta.attivo, true);
assert.throws(() => porta.registra({}), /monta/);

// Un pacchetto a parte registra la sua interfaccia prima di `ready`: la pagina di serie non si disegna.
const visti = { monta: 0, smonta: 0, cambi: [] };
porta.registra({
  id: "prova",
  monta(radice, ricevuta) {
    visti.monta += 1;
    visti.radice = radice;
    visti.porta = ricevuta;
    radice.innerHTML = "<p>interfaccia di prova</p>";
    return () => { visti.smonta += 1; };
  }
});
agganci.once.setup();
const marco = { id: "a1", name: "Marco", type: "mago", isOwner: true, system: { attributes: { dexterity: { value: 4 } }, skills: { athletics: { value: 3 } } } };
const altrui = { id: "a3", name: "Altrui", type: "mago", isOwner: false, system: {} };
game.actors = Object.assign([altrui, marco], { get: (id) => [altrui, marco].find((actor) => actor.id === id), filter: Array.prototype.filter.bind([altrui, marco]) });
agganci.once.ready();
const pagina = figli[0];
assert.equal(visti.monta, 1);
assert.equal(visti.radice, pagina, "riceve la pagina intera");
assert.equal(visti.porta, porta);
assert.equal(pagina.innerHTML, "<p>interfaccia di prova</p>");
assert.equal(pagina.classList.contains("m6t-ospite"), true);
assert.equal(pagina.ascolti.click, undefined, "la pagina di serie non ha attaccato i suoi gesti");

// La porta dà le schede di chi è entrato, il tiro e l'elenco dei tiri, e avvisa a ogni cambiamento.
assert.deepEqual(porta.schede().map((actor) => actor.name), ["Marco"]);
const ferma = porta.ascolta((cosa) => visti.cambi.push(cosa));
FintaRoll.prossimi = [6, 7, 1, 2, 3, 4, 5];
const esito = await porta.tira(marco, { attributo: "dexterity", abilita: "athletics", soglia: 2 });
assert.ok(esito.messaggio);
assert.equal(messaggi.length, 1);
assert.deepEqual(visti.cambi, ["tiri"]);
const elenco = porta.tiri();
assert.equal(elenco.length, 1);
assert.deepEqual([elenco[0].chi, elenco[0].successi, elenco[0].soglia, elenco[0].riuscito, elenco[0].id], ["Marco", 2, 2, true, "m0"]);
ferma();
for (const funzione of agganci.on.createChatMessage) funzione();
assert.deepEqual(visti.cambi, ["tiri"], "chi ha smesso di ascoltare non sente più");

// Le regole danno alla porta il loro tiro: la porta lo usa, e gli passa le opzioni.
const chiamate = [];
porta.usa(async (actor, scelta, opzioni) => { chiamate.push([actor.name, scelta.soglia, typeof opzioni.avvisa]); return { avviso: "non parte" }; });
assert.deepEqual(await porta.tira(marco, { soglia: 3 }, { avvisa() {} }), { avviso: "non parte" });
assert.deepEqual(chiamate, [["Marco", 3, "function"]]);

// Una seconda interfaccia prende il posto della prima, che si smonta. Se sbaglia, torna la pagina di serie.
game.ready = true;
porta.registra({ id: "seconda", monta(radice) { radice.innerHTML = "<p>seconda</p>"; } });
assert.equal(visti.smonta, 1);
assert.equal(pagina.innerHTML, "<p>seconda</p>");
const errori = [];
const veroErrore = console.error;
console.error = (...parti) => errori.push(parti.join(" "));
porta.registra({ id: "rotta", monta() { throw new Error("rotta"); } });
console.error = veroErrore;
assert.equal(errori.length, 1);
assert.match(errori[0], /rotta/);
assert.equal(pagina.classList.contains("m6t-ospite"), false);
assert.match(pagina.innerHTML, /data-m6t-zona="tiro"/, "resta la pagina di serie");
assert.equal(typeof pagina.ascolti.click, "function");

console.log("porta del telefono: ok.");
