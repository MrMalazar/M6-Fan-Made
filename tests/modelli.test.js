/**
 * Le due schede disegnate fuori da Foundry: il contesto che la scheda
 * prepara passa dai modelli veri, e i tasti fanno quello che dicono.
 */
import assert from "node:assert/strict";
import { FintaRoll, monta } from "./finta/foundry.mjs";

const { agganci, schede, messaggi, avvisi } = monta();
const { disegna, parola, personaggi, radici } = await import("./finta/pagine.mjs");
await import("../scripts/main.js");
agganci.once.init();
game.i18n.localize = parola;

const [SchedaMago, SchedaPng] = schede.map((scheda) => scheda.sheetClass);
const { mago, png, aggiornamenti } = await personaggi();
const conta = (html, pezzo) => html.split(pezzo).length - 1;
const azioni = Object.getPrototypeOf(SchedaMago).DEFAULT_OPTIONS.actions;
const tasto = (dataset) => ({ dataset, disabled: false });

/* ---------- il Mago ---------- */
{
  const scheda = new SchedaMago({ document: mago });
  const foglio = async () => disegna(SchedaMago.PARTS.foglio.template, await scheda._prepareContext({}));
  let html = await foglio();

  assert.equal(radici(html), 1, "il foglio è un elemento solo");
  assert.match(html, /<input class="m6-nome" type="text" name="name" value="Marco"/);
  assert.match(html, /<img class="m6-ritratto" src="icons\/svg\/mystery-man.svg" alt="" data-edit="img" data-action="editImage">/);

  // Ventitré tratti, cinque pallini ciascuno; i pieni sono la somma dei valori.
  assert.equal(conta(html, 'data-action="sceglie"'), 23);
  assert.equal(conta(html, 'data-action="pallino"'), 115);
  assert.equal(conta(html, 'class="m6-pallino pieno"'), (6 * 2 + 4 + 3 + 2) + (3 + 1 + 5));
  for (const nome of ["Forza", "Autocontrollo", "Fermezza", "Criminalità", "Manualità", "Velo"]) assert.match(html, new RegExp(`>${nome}</button>`));
  assert.equal(conta(html, '<span class="m6-occhiello">Fisico</span>'), 2, "il campo sopra gli Attributi e sopra le Abilità");
  assert.match(html, /data-percorso="system.attributi.forza.valore" data-valore="1" data-minimo="1"/);
  assert.match(html, /data-percorso="system.abilita.velo.valore" data-valore="5" data-minimo="0"/);
  assert.match(html, /title="Mette l&#x27;Attributo nella riserva: uno solo."/);

  // Il Tiro da vuoto: i due posti, e il tasto spento che dice cosa manca.
  assert.match(html, /<div class="m6-tiro__voce vuota"><span>Attributo<\/span><b><\/b><\/div>/);
  assert.match(html, /<div class="m6-tiro__voce vuota"><span>Abilità<\/span><b><\/b><\/div>/);
  assert.equal(conta(html, 'data-action="soglia"'), 7);
  assert.match(html, /<button type="button" class="m6-tira" data-action="tira" disabled>manca l&#x27;Attributo o l&#x27;Abilità<\/button>/);

  // La Salute: 2 + Costituzione 3 + Fermezza 2 = 7 caselle, i fisici da sinistra e i mentali da destra.
  assert.match(html, /<b title="Caselle del tracciato">7<\/b>/);
  const tracciato = /<div class="m6-tracciato"[^>]*>([\s\S]*?)<\/div>/.exec(html)[1];
  assert.deepEqual([...tracciato.matchAll(/data-stato="(\w*)"/g)].map(([, stato]) => stato), ["pa", "ps", "", "", "", "ms", "ms"]);
  assert.equal(conta(html, 'data-action="segno"'), 8);
  assert.doesNotMatch(html, /m6-stato/);

  // I nomi mettono nel tiro, uno per tipo; il secondo clic toglie.
  azioni.sceglie.call(scheda, {}, tasto({ tipo: "attributo", id: "forza" }));
  azioni.sceglie.call(scheda, {}, tasto({ tipo: "attributo", id: "destrezza" }));
  azioni.sceglie.call(scheda, {}, tasto({ tipo: "abilita", id: "atletica" }));
  assert.deepEqual(scheda.scelta, { attributo: "destrezza", abilita: "atletica", campo: "", soglia: null });
  assert.equal(scheda.ridisegni, 3);
  html = await foglio();
  assert.equal(conta(html, '<div class="m6-riga scelta">'), 2);
  assert.match(html, /<div class="m6-tiro__voce"><span>Destrezza<\/span><b>4<\/b><\/div>/);
  assert.match(html, /<div class="m6-tiro__totale">7 dadi<\/div>/);
  assert.match(html, /data-action="tira" disabled>manca la soglia<\/button>/, "senza soglia il tiro non parte");
  azioni.sceglie.call(scheda, {}, tasto({ tipo: "soglia", id: "9" }));
  assert.equal(scheda.scelta.soglia, null, "la soglia non entra dal tasto dei nomi");

  // La soglia: un clic la mette, il tasto si accende.
  azioni.soglia.call(scheda, {}, tasto({ valore: "2" }));
  html = await foglio();
  assert.match(html, /<button type="button" class="m6-soglia scelta" data-action="soglia" data-valore="2" aria-pressed="true">2<\/button>/);
  assert.match(html, /<button type="button" class="m6-tira" data-action="tira">Tira<\/button>/);

  // Tira: il messaggio parte, la soglia si svuota, la coppia resta.
  FintaRoll.prossimi = [6, 6, 10, 1, 1, 1, 1];
  await azioni.tira.call(scheda, {}, tasto({}));
  assert.equal(messaggi.length, 1);
  assert.deepEqual(messaggi[0].system, { attributo: "destrezza", abilita: "atletica", campo: "", soglia: 2, risultati: [6, 6, 10, 1, 1, 1, 1] });
  assert.deepEqual(scheda.scelta, { attributo: "destrezza", abilita: "atletica", campo: "", soglia: null });
  assert.deepEqual(avvisi, []);

  // I pallini: si arriva lì; il clic sul valore di adesso ne toglie uno; l'Attributo non scende sotto 1.
  aggiornamenti.length = 0;
  await azioni.pallino.call(scheda, {}, tasto({ percorso: "system.attributi.forza.valore", valore: "4", minimo: "1" }));
  await azioni.pallino.call(scheda, {}, tasto({ percorso: "system.attributi.destrezza.valore", valore: "4", minimo: "1" }));
  await azioni.pallino.call(scheda, {}, tasto({ percorso: "system.abilita.velo.valore", valore: "1", minimo: "0" }));
  mago.system.attributi.forza.valore = 1;
  await azioni.pallino.call(scheda, {}, tasto({ percorso: "system.attributi.forza.valore", valore: "1", minimo: "1" }));
  assert.deepEqual(aggiornamenti.map(({ cambi }) => cambi), [
    { "system.attributi.forza.valore": 4 },
    { "system.attributi.destrezza.valore": 3 },
    { "system.abilita.velo.valore": 0 }
  ]);

  // La Salute: un segno in più, e le caselle in più segnate a mano.
  aggiornamenti.length = 0;
  await azioni.segno.call(scheda, {}, tasto({ segno: "ma", passo: "1" }));
  await azioni.segno.call(scheda, {}, tasto({ segno: "ps", passo: "-1" }));
  await azioni.caselle.call(scheda, {}, tasto({ passo: "1" }));
  assert.deepEqual(aggiornamenti.map(({ cambi }) => cambi), [
    { "system.salute": { pa: 1, ps: 1, ma: 1, ms: 2 } },
    { "system.salute": { pa: 1, ps: 0, ma: 0, ms: 2 } },
    { "system.salute.extra": 1 }
  ]);

  // Chi guarda senza poter scrivere non cambia niente.
  aggiornamenti.length = 0;
  const sola = new SchedaMago({ document: mago, editable: false });
  await azioni.pallino.call(sola, {}, tasto({ percorso: "system.attributi.forza.valore", valore: "5", minimo: "1" }));
  await azioni.segno.call(sola, {}, tasto({ segno: "ps", passo: "1" }));
  await azioni.caselle.call(sola, {}, tasto({ passo: "1" }));
  assert.deepEqual(aggiornamenti, []);
}

/* ---------- il PNG ---------- */
{
  const scheda = new SchedaPng({ document: png });
  const foglio = async () => disegna(SchedaPng.PARTS.foglio.template, await scheda._prepareContext({}));
  let html = await foglio();

  assert.equal(radici(html), 1);
  assert.equal(conta(html, 'data-action="sceglie" data-tipo="campo"'), 3);
  assert.match(html, /<input class="m6-numero" type="number" name="system.riserve.fisico.dadi" value="5" min="0" step="1"/);
  assert.match(html, /<div class="m6-tiro__voce vuota"><span>Riserva<\/span><b><\/b><\/div>/);
  assert.match(html, /data-action="tira" disabled>manca la riserva<\/button>/);
  assert.match(html, /<b title="Caselle del tracciato">5<\/b>/);
  const tracciato = /<div class="m6-tracciato"[^>]*>([\s\S]*?)<\/div>/.exec(html)[1];
  assert.deepEqual([...tracciato.matchAll(/data-stato="(\w*)"/g)].map(([, stato]) => stato), ["pa", "pa", "", "", "ma"]);

  // Una riserva a zero dadi non si tira; quella piena sì.
  azioni.sceglie.call(scheda, {}, tasto({ tipo: "campo", id: "mentale" }));
  azioni.soglia.call(scheda, {}, tasto({ valore: "3" }));
  assert.match(await foglio(), /data-action="tira" disabled>Zero dadi: il tiro fallisce senza tirare.<\/button>/);
  azioni.sceglie.call(scheda, {}, tasto({ tipo: "campo", id: "fisico" }));
  html = await foglio();
  assert.match(html, /<div class="m6-tiro__voce"><span>Fisico<\/span><b>5 dadi<\/b><\/div>/);
  assert.doesNotMatch(html, /m6-tiro__totale/, "una voce sola: il totale direbbe due volte lo stesso numero");
  FintaRoll.prossimi = [10, 10, 2, 3, 4];
  await azioni.tira.call(scheda, {}, tasto({}));
  assert.deepEqual(messaggi.at(-1).system, { attributo: "", abilita: "", campo: "fisico", soglia: 3, risultati: [10, 10, 2, 3, 4] });

  // Le caselle del PNG sono il numero scritto: il più e il meno lo cambiano, mai sotto una.
  aggiornamenti.length = 0;
  await azioni.caselle.call(scheda, {}, tasto({ passo: "1" }));
  png._source.system.salute.caselle = 1;
  await azioni.caselle.call(scheda, {}, tasto({ passo: "-1" }));
  assert.deepEqual(aggiornamenti.map(({ cambi }) => cambi), [{ "system.salute.caselle": 6 }, { "system.salute.caselle": 1 }]);

  // I dadi scritti a mano: il vuoto vale zero, il troppo si ferma all'argine, il resto non si tocca.
  const letti = scheda._processFormData({}, {}, { object: { name: "Soldato", system: { riserve: { fisico: { dadi: null }, sociale: { dadi: 99 }, mentale: { dadi: 2.7 } } } } });
  assert.deepEqual(letti, { name: "Soldato", system: { riserve: { fisico: { dadi: 0 }, sociale: { dadi: 30 }, mentale: { dadi: 2 } } } });
  assert.deepEqual(scheda._processFormData({}, {}, { object: { name: "Soldato" } }), { name: "Soldato" });
}

console.log("Modelli: test passati.");
