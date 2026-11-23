/**
 * La base caricata dentro la Foundry finta, dal PC: prova che ogni file
 * trova quello che importa, che `init` registra dati, dadi, oggetti e
 * impostazioni, che le schede vecchie si leggono, e che il tiro semplice
 * scrive il messaggio giusto.
 */
import assert from "node:assert/strict";

import { FintaRoll, monta } from "./finta/foundry.mjs";

// Dal PC, in un browser dove la mappa l'avevamo spenta noi in una visita dal telefono.
const { agganci, schede, impostazioni, valori, messaggi, classiBody, modelli, aiuti } = monta({ valori: { "core.noCanvas": true, "m6.mappaSpenta": true } });

/* ---------- la base si carica e si registra ---------- */
await import("../../scripts/base/avvio.js");
assert.equal(typeof agganci.once.init, "function");
assert.equal(typeof agganci.once.setup, "function");
assert.equal(typeof agganci.once.ready, "function");
assert.equal(agganci.on.renderChatMessageHTML?.length, 1);

agganci.once.init();
assert.deepEqual(Object.keys(CONFIG.Actor.dataModels), ["mago", "png"]);
assert.deepEqual(Object.keys(CONFIG.Item.dataModels), ["feature", "condition", "weapon", "armor", "gear"]);
assert.deepEqual(Object.keys(CONFIG.ChatMessage.dataModels), ["tiro"]);
assert.equal(CONFIG.Actor.defaultType, "mago");
// Il dado della riserva ha la sua lettera, il tiro si rilegge dai messaggi salvati.
assert.equal(CONFIG.Dice.terms.m.DENOMINATION, "m");
assert.equal(CONFIG.Dice.rolls.length, 1);
assert.equal(CONFIG.Dice.rolls[0].name, "TiroM6");
// La scheda degli oggetti è una, per tutti i tipi; quelle del Mago e del PNG le registra main.js.
assert.deepEqual(schede.map((scheda) => [scheda.documentClass, scheda.scope, scheda.options.makeDefault]), [[Item, "m6", true]]);
assert.deepEqual(Object.keys(aiuti), ["numLoop", "ifnoteq", "isNotEmpty"]);
assert.deepEqual(modelli, ["systems/m6/templates/base/lucchetto.hbs", "systems/m6/templates/base/modificatori.hbs"]);
assert.equal(impostazioni.get("m6.telefono").scope, "client");
assert.equal(impostazioni.get("m6.telefono").default, "auto");
assert.deepEqual(Object.keys(impostazioni.get("m6.telefono").choices), ["auto", "sempre", "mai"]);
assert.equal(typeof game.m6.tira, "function");

// Sul PC la pagina del telefono resta spenta, e la mappa che avevamo spento noi si riaccende.
assert.equal(classiBody.has("m6-telefono"), false);
agganci.once.setup();
assert.equal(valori.get("core.noCanvas"), false);
assert.equal(valori.get("m6.mappaSpenta"), false);
agganci.once.ready();

/* ---------- i dati ---------- */
{
  const { MagoData, OGGETTI, PngData, TiroData } = await import("../../scripts/base/dati.js");
  const { TUTTE_ABILITA, TUTTI_ATTRIBUTI } = await import("../../scripts/base/tratti.js");

  // Il Mago: i tratti della tavola, coi campi che la scheda legge.
  const mago = MagoData.defineSchema();
  assert.deepEqual(Object.keys(mago), ["attributes", "skills", "headers", "locked", "gamesystem", "settings"]);
  assert.deepEqual(Object.keys(mago.attributes.fields), TUTTI_ATTRIBUTI);
  assert.deepEqual(Object.keys(mago.skills.fields), TUTTE_ABILITA);
  assert.equal(mago.attributes.fields.strength.fields.value.options.initial, 1, "un Attributo parte da 1");
  assert.equal(mago.skills.fields.occult.fields.value.options.initial, 0, "un'Abilità parte da 0");
  assert.deepEqual(Object.keys(mago.skills.fields.occult.fields), ["value", "bonuses"]);
  assert.deepEqual(Object.keys(mago.headers.fields), ["concept", "chronicle", "ambition", "desire"]);
  assert.equal(mago.gamesystem.options.initial, "mortal");

  // Una scheda della 0.1.0: i tratti coi nomi di allora passano a quelli di oggi.
  const vecchia = MagoData.migrateData({ attributi: { forza: { valore: 4 }, fermezza: { valore: 2 } }, abilita: { velo: { valore: 3 }, mischia: { valore: 1 } } });
  assert.deepEqual(vecchia.attributes, { strength: { value: 4 }, resolve: { value: 2 } });
  assert.deepEqual(vecchia.skills, { occult: { value: 3 }, brawl: { value: 1 } });
  // Una scheda di oggi non si tocca.
  const oggi = { attributes: { strength: { value: 5 } }, skills: { occult: { value: 1 } } };
  assert.deepEqual(MagoData.migrateData(structuredClone(oggi)), oggi);
  assert.deepEqual(MagoData.migrateData({}), {});

  // Il PNG: tre riserve, un caso a dadi per Abilità, le caselle, il concetto.
  const png = PngData.defineSchema();
  assert.deepEqual(Object.keys(png.standarddicepools.fields), ["physical", "social", "mental"]);
  assert.deepEqual(Object.keys(png.exceptionaldicepools.fields), TUTTE_ABILITA);
  assert.deepEqual(Object.keys(png.exceptionaldicepools.fields.occult.fields), ["value", "active"]);
  assert.equal(png.health.fields.max.options.initial, 1);
  assert.equal(png.spcType.options.initial, "mortal");
  const soldato = PngData.migrateData({ riserve: { fisico: { dadi: 5 }, mentale: { dadi: 1 } }, salute: { caselle: 6, pa: 1 } });
  assert.deepEqual(soldato.standarddicepools, { physical: { value: 5 }, mental: { value: 1 } });
  assert.deepEqual(soldato.health, { max: 6 });

  // Gli oggetti: cinque tipi, ognuno con la descrizione e i bonus che porta ai tiri.
  for (const [tipo, modello] of Object.entries(OGGETTI)) {
    const campi = modello.defineSchema();
    for (const nome of ["description", "bonuses", "source", "dataItemId"]) assert.ok(nome in campi, `${tipo} senza ${nome}`);
  }
  assert.deepEqual(Object.keys(OGGETTI.feature.defineSchema()).slice(-2), ["points", "featuretype"]);
  assert.ok("suppressed" in OGGETTI.condition.defineSchema());
  assert.deepEqual(Object.keys(OGGETTI.weapon.defineSchema().uses.fields), ["enabled", "current", "max"]);
  assert.ok("armorvalue" in OGGETTI.armor.defineSchema());

  // Il tiro della 0.1.0 resta leggibile.
  assert.deepEqual(Object.keys(TiroData.defineSchema()), ["attributo", "abilita", "campo", "soglia", "risultati"]);
}

/* ---------- il tiro semplice ---------- */
{
  const { cosaManca, coppiaDelTiro, datiCarta, tira, vestiCarta } = await import("../../scripts/base/tiro-semplice.js");
  const marco = {
    id: "a1", name: "Marco", type: "mago", isOwner: true,
    system: { attributes: { dexterity: { value: 4 } }, skills: { athletics: { value: 3 } } }
  };

  // Cosa manca, nell'ordine: la coppia, poi la soglia.
  assert.equal(cosaManca(marco, {}).manca, "M6.Base.Tiro.MancaCoppia");
  assert.equal(cosaManca(marco, { attributo: "dexterity" }).manca, "M6.Base.Tiro.MancaCoppia");
  assert.equal(cosaManca(marco, { attributo: "dexterity", abilita: "athletics" }).manca, "M6.Base.Tiro.MancaSoglia");
  assert.equal(cosaManca(marco, { attributo: "dexterity", abilita: "athletics", soglia: 9 }).manca, "M6.Base.Tiro.MancaSoglia");
  assert.equal(cosaManca(marco, { attributo: "dexterity", abilita: "athletics", soglia: 2 }).manca, "");

  // Senza soglia il tiro non parte, e non scrive niente.
  assert.deepEqual(await tira(marco, { attributo: "dexterity", abilita: "athletics" }), { manca: "M6.Base.Tiro.MancaSoglia" });
  assert.deepEqual(await tira({ ...marco, isOwner: false }, { attributo: "dexterity", abilita: "athletics", soglia: 2 }), { manca: "M6.Base.Tiro.NonTuo" });
  assert.equal(messaggi.length, 0);

  // Il cancello di Marco: sette dadi a soglia 2.
  FintaRoll.prossimi = [1, 2, 3, 4, 5, 7, 9];
  const { messaggio } = await tira(marco, { attributo: "dexterity", abilita: "athletics", soglia: 2, campo: "physical" });
  assert.equal(messaggi.length, 1);
  assert.equal(messaggio.type, "tiro");
  assert.deepEqual(messaggio.speaker, { actor: "a1", alias: "Marco" });
  assert.equal(messaggio.rolls.length, 1);
  assert.equal(messaggio.rolls[0].formula, "7d10");
  assert.deepEqual(messaggio.system, { attributo: "dexterity", abilita: "athletics", campo: "", soglia: 2, risultati: [1, 2, 3, 4, 5, 7, 9] });
  assert.deepEqual(messaggio.opzioni, { messageMode: "public" });

  // Il PNG tira una riserva; a zero dadi non si tira.
  const soldato = { id: "a2", name: "Soldato", type: "png", isOwner: true, system: { standarddicepools: { physical: { value: 3 }, social: { value: 0 }, mental: { value: 1 } } } };
  assert.equal(cosaManca(soldato, { soglia: 2 }).manca, "M6.Base.Tiro.MancaRiserva");
  assert.equal(cosaManca(soldato, { campo: "social", soglia: 2 }).manca, "M6.Base.Tiro.ZeroDadi");
  FintaRoll.prossimi = [10, 10, 6];
  const tiroPng = (await tira(soldato, { campo: "physical", soglia: 3, attributo: "strength" })).messaggio;
  assert.deepEqual(tiroPng.system, { attributo: "", abilita: "", campo: "physical", soglia: 3, risultati: [10, 10, 6] });

  // Le parole della carta: la coppia, o il campo del PNG. I tiri della 0.1.0 si leggono coi nomi di oggi.
  assert.equal(coppiaDelTiro(messaggio.system), "M6.Comuni.Attributi.dexterity + M6.Comuni.Abilita.athletics");
  assert.equal(coppiaDelTiro(tiroPng.system), "M6.Comuni.Campi.physical");
  assert.equal(coppiaDelTiro({ attributo: "destrezza", abilita: "atletica" }), "M6.Comuni.Attributi.dexterity + M6.Comuni.Abilita.athletics");
  assert.equal(coppiaDelTiro({ campo: "fisico" }), "M6.Comuni.Campi.physical");
  const letta = datiCarta({ system: tiroPng.system, alias: "Soldato" });
  assert.equal(letta.successi, 5);
  assert.equal(letta.margine, 2);
  assert.equal(letta.chi, "Soldato");

  // La carta si veste solo sui tiri semplici, e solo se chi guarda può vederli.
  const corpo = { innerHTML: "prima" };
  const html = { querySelector: (selettore) => (selettore === ".message-content" ? corpo : null) };
  vestiCarta({ type: "base", isContentVisible: true, system: {} }, html);
  assert.equal(corpo.innerHTML, "prima");
  vestiCarta({ type: "tiro", isContentVisible: false, system: tiroPng.system }, html);
  assert.equal(corpo.innerHTML, "prima", "un tiro nascosto resta com'è");
  vestiCarta({ type: "tiro", isContentVisible: true, system: messaggio.system, alias: "Marco" }, html);
  assert.match(corpo.innerHTML, /^<div class="m6-carta m6-carta--successo">/);
  assert.match(corpo.innerHTML, /M6\.Base\.Tiro\.Successo/);
}

console.log("Finta Foundry: test passati.");
