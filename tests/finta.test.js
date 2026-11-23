/**
 * Il sistema caricato dentro la Foundry finta, dal PC: prova che ogni file
 * trova quello che importa, che `init` registra dati, schede e impostazioni,
 * e che il tiro scrive il messaggio giusto.
 */
import assert from "node:assert/strict";

import { FintaRoll, monta } from "./finta/foundry.mjs";

// Dal PC, in un browser dove la mappa l'avevamo spenta noi in una visita dal telefono.
const { agganci, schede, impostazioni, valori, messaggi, classiBody } = monta({ valori: { "core.noCanvas": true, "m6.mappaSpenta": true } });

/* ---------- il sistema si carica e si registra ---------- */
await import("../scripts/main.js");
assert.equal(typeof agganci.once.init, "function");
assert.equal(typeof agganci.once.setup, "function");
assert.equal(typeof agganci.once.ready, "function");
assert.equal(agganci.on.renderChatMessageHTML?.length, 1);

agganci.once.init();
assert.deepEqual(Object.keys(CONFIG.Actor.dataModels), ["mago", "png"]);
assert.deepEqual(Object.keys(CONFIG.ChatMessage.dataModels), ["tiro"]);
assert.equal(CONFIG.Actor.defaultType, "mago");
assert.deepEqual(schede.map((scheda) => [scheda.scope, scheda.options.types, scheda.options.makeDefault]), [["m6", ["mago"], true], ["m6", ["png"], true]]);
assert.ok(schede.every((scheda) => scheda.documentClass === Actor));
assert.equal(impostazioni.get("m6.telefono").scope, "client");
assert.equal(impostazioni.get("m6.telefono").default, "auto");
assert.deepEqual(Object.keys(impostazioni.get("m6.telefono").choices), ["auto", "sempre", "mai"]);
assert.equal(typeof game.m6.tira, "function");

// Le schede portano i loro modelli e i loro tasti.
{
  const [mago, png] = schede.map((scheda) => scheda.sheetClass);
  assert.equal(mago.PARTS.foglio.template, "systems/m6/templates/mago.hbs");
  assert.equal(png.PARTS.foglio.template, "systems/m6/templates/png.hbs");
  assert.equal(mago.PARTS.foglio.templates.length, 3);
  const base = Object.getPrototypeOf(mago);
  assert.deepEqual(Object.keys(base.DEFAULT_OPTIONS.actions), ["pallino", "sceglie", "soglia", "tira", "segno", "caselle"]);
  assert.ok(Object.values(base.DEFAULT_OPTIONS.actions).every((azione) => typeof azione === "function"));
  assert.equal(base.DEFAULT_OPTIONS.form.submitOnChange, true);
}

// Sul PC la pagina del telefono resta spenta, e la mappa che avevamo spento noi si riaccende.
assert.equal(classiBody.has("m6-telefono"), false);
agganci.once.setup();
assert.equal(valori.get("core.noCanvas"), false);
assert.equal(valori.get("m6.mappaSpenta"), false);
agganci.once.ready();

/* ---------- i dati ---------- */
{
  const { MagoData, PngData, TiroData } = await import("../scripts/dati.js");
  const mago = MagoData.defineSchema();
  assert.equal(Object.keys(mago.attributi.fields).length, 9);
  assert.equal(Object.keys(mago.abilita.fields).length, 14);
  assert.deepEqual(mago.attributi.fields.forza.fields.valore.options, { required: true, nullable: false, integer: true, initial: 1, min: 1, max: 5 });
  assert.deepEqual(mago.abilita.fields.velo.fields.valore.options, { required: true, nullable: false, integer: true, initial: 0, min: 0, max: 5 });
  assert.deepEqual(Object.keys(mago.salute.fields), ["ps", "pa", "ms", "ma", "extra"]);

  const png = PngData.defineSchema();
  assert.deepEqual(Object.keys(png.riserve.fields), ["fisico", "sociale", "mentale"]);
  assert.deepEqual(Object.keys(png.salute.fields), ["ps", "pa", "ms", "ma", "caselle"]);
  assert.equal(png.salute.fields.caselle.options.initial, 1);

  assert.deepEqual(Object.keys(TiroData.defineSchema()), ["attributo", "abilita", "campo", "soglia", "risultati"]);

  // I conti che Foundry fa a ogni lettura: caselle e stato accanto ai danni.
  const scheda = Object.assign(new MagoData(), {
    attributi: { costituzione: { valore: 3 }, fermezza: { valore: 2 } },
    salute: { ps: 2, pa: 0, ms: 9, ma: 0, extra: 0 }
  });
  scheda.prepareDerivedData();
  assert.equal(scheda.salute.caselle, 7);
  assert.equal(scheda.salute.ms, 5, "i danni oltre il tracciato non si contano");
  assert.equal(scheda.salute.stato, "menomato");

  const nemico = Object.assign(new PngData(), { salute: { ps: 0, pa: 0, ms: 0, ma: 0, caselle: 4 } });
  nemico.prepareDerivedData();
  assert.equal(nemico.salute.caselle, 4);
  assert.equal(nemico.salute.stato, "");
}

/* ---------- il tiro ---------- */
{
  const { cosaManca, coppiaDelTiro, datiCarta, tira, vestiCarta } = await import("../scripts/tiro.js");
  const marco = {
    id: "a1", name: "Marco", type: "mago", isOwner: true,
    system: { attributi: { destrezza: { valore: 4 } }, abilita: { atletica: { valore: 3 } } }
  };

  // Cosa manca, nell'ordine: la coppia, poi la soglia.
  assert.equal(cosaManca(marco, {}).manca, "M6.Tiro.MancaCoppia");
  assert.equal(cosaManca(marco, { attributo: "destrezza" }).manca, "M6.Tiro.MancaCoppia");
  assert.equal(cosaManca(marco, { attributo: "destrezza", abilita: "atletica" }).manca, "M6.Tiro.MancaSoglia");
  assert.equal(cosaManca(marco, { attributo: "destrezza", abilita: "atletica", soglia: 9 }).manca, "M6.Tiro.MancaSoglia");
  assert.equal(cosaManca(marco, { attributo: "destrezza", abilita: "atletica", soglia: 2 }).manca, "");

  // Senza soglia il tiro non parte, e non scrive niente.
  assert.deepEqual(await tira(marco, { attributo: "destrezza", abilita: "atletica" }), { manca: "M6.Tiro.MancaSoglia" });
  assert.deepEqual(await tira({ ...marco, isOwner: false }, { attributo: "destrezza", abilita: "atletica", soglia: 2 }), { manca: "M6.Tiro.NonTuo" });
  assert.equal(messaggi.length, 0);

  // Il cancello di Marco: sette dadi a soglia 2.
  FintaRoll.prossimi = [1, 2, 3, 4, 5, 7, 9];
  const { messaggio } = await tira(marco, { attributo: "destrezza", abilita: "atletica", soglia: 2, campo: "fisico" });
  assert.equal(messaggi.length, 1);
  assert.equal(messaggio.type, "tiro");
  assert.deepEqual(messaggio.speaker, { actor: "a1", alias: "Marco" });
  assert.equal(messaggio.rolls.length, 1);
  assert.equal(messaggio.rolls[0].formula, "7d10");
  assert.deepEqual(messaggio.system, { attributo: "destrezza", abilita: "atletica", campo: "", soglia: 2, risultati: [1, 2, 3, 4, 5, 7, 9] });
  assert.deepEqual(messaggio.opzioni, { messageMode: "public" });

  // Il PNG tira una riserva; a zero dadi non si tira.
  const soldato = { id: "a2", name: "Soldato", type: "png", isOwner: true, system: { riserve: { fisico: { dadi: 3 }, sociale: { dadi: 0 }, mentale: { dadi: 1 } } } };
  assert.equal(cosaManca(soldato, { soglia: 2 }).manca, "M6.Tiro.MancaRiserva");
  assert.equal(cosaManca(soldato, { campo: "sociale", soglia: 2 }).manca, "M6.Tiro.ZeroDadi");
  FintaRoll.prossimi = [10, 10, 6];
  const tiroPng = (await tira(soldato, { campo: "fisico", soglia: 3, attributo: "forza" })).messaggio;
  assert.deepEqual(tiroPng.system, { attributo: "", abilita: "", campo: "fisico", soglia: 3, risultati: [10, 10, 6] });

  // Le parole della carta: la coppia, o il campo del PNG.
  assert.equal(coppiaDelTiro(messaggio.system), "M6.Attributi.destrezza + M6.Abilita.atletica");
  assert.equal(coppiaDelTiro(tiroPng.system), "M6.Campi.fisico");
  const letta = datiCarta({ system: tiroPng.system, alias: "Soldato" });
  assert.equal(letta.successi, 5);
  assert.equal(letta.margine, 2);
  assert.equal(letta.chi, "Soldato");

  // La carta si veste solo sui tiri, e solo se chi guarda può vederli.
  const corpo = { innerHTML: "prima" };
  const html = { querySelector: (selettore) => (selettore === ".message-content" ? corpo : null) };
  vestiCarta({ type: "base", isContentVisible: true, system: {} }, html);
  assert.equal(corpo.innerHTML, "prima");
  vestiCarta({ type: "tiro", isContentVisible: false, system: tiroPng.system }, html);
  assert.equal(corpo.innerHTML, "prima", "un tiro nascosto resta com'è");
  vestiCarta({ type: "tiro", isContentVisible: true, system: messaggio.system, alias: "Marco" }, html);
  assert.match(corpo.innerHTML, /^<div class="m6-carta m6-carta--successo">/);
  assert.match(corpo.innerHTML, /M6\.Tiro\.Successo/);
}

console.log("Finta Foundry: test passati.");
