import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  abilitaAssorbite,
  aggiornamento,
  cartaOggetto,
  convertiAttore,
  convertiBandiere,
  convertiGenerico,
  convertiMessaggio,
  convertiOggetto,
  convertiParole,
  convertiScena,
  convertiSegnalino,
  convertiTesto,
  convertiTiro,
  dadiInMeno,
  pota,
  restoDelSistema,
  sferaDalNome,
  sistemaMago,
  sistemaPng,
  uguali,
  unisci
} from "../scripts/passaggio/converti.js";
import { ABILITA_ASSORBITE, GERARCHIA, NOMI_SFERE, TIPI_ATTORE, TIPI_OGGETTO } from "../scripts/passaggio/regole.js";
import { CHIAVI_ASSORBITE } from "../scripts/abilita-essenziali.js";
import { GRUPPI_ABILITA } from "../scripts/condizioni.js";
import { SPHERES } from "../scripts/spheres.js";
import { applicaAggiornamento, applicaTogli, diario, gruppo, macro, mago, messaggi, nemico, pngDiPrima, scena, tiroSalvato, vampiro } from "./passaggio-mondo.mjs";

const leggi = (percorso) => JSON.parse(readFileSync(new URL(percorso, import.meta.url), "utf8"));
const sistema = leggi("../system.json");
const it = leggi("../lang/it.json");
const en = leggi("../lang/en.json");

// ------------------------------------------------------------------ le tavole
// I tipi d'arrivo sono tipi del sistema; gli oggetti che passano sono proprio i suoi.
for (const tipo of Object.values(TIPI_ATTORE)) assert.ok(sistema.documentTypes.Actor[tipo], `il tipo ${tipo} c'è nel sistema`);
assert.deepEqual([...TIPI_OGGETTO].sort(), Object.keys(sistema.documentTypes.Item).sort());
// Le Abilità assorbite sono le tredici del canone, ognuna nel suo campo.
assert.deepEqual(Object.keys(ABILITA_ASSORBITE).sort(), [...CHIAVI_ASSORBITE].sort());
for (const [id, voce] of Object.entries(ABILITA_ASSORBITE)) assert.equal(voce.campo, GRUPPI_ABILITA[id], id);
// I nomi delle Sfere sono quelli dei file di lingua.
assert.deepEqual(Object.keys(NOMI_SFERE), [...SPHERES]);
for (const id of SPHERES) assert.deepEqual(NOMI_SFERE[id], [it.M6.Spheres[id], en.M6.Spheres[id]], id);

// ------------------------------------------------------------------- i testi
assert.equal(convertiTesto("modules/wod5e-mage/assets/icons/sheet/forces.png"), "systems/m6/assets/icons/sheet/forces.png");
assert.equal(convertiTesto("@UUID[Compendium.wod5e-mage.mage-pregi.Item.abc]{Fortunato}"), "@UUID[Compendium.m6.mage-pregi.Item.abc]{Fortunato}");
assert.equal(convertiTesto("<p class=\"wod5e-mage-roll-note wod5e-mage\">x</p>"), "<p class=\"m6-roll-note m6\">x</p>");
assert.equal(convertiTesto("await game.modules.get(\"wod5e-mage\").api.condizioni.assign();"), "await game.m6.condizioni.assign();");
assert.equal(convertiTesto("game.modules.get('wod5e-mage')?.api?.vathra?.apri();"), "game.m6?.vathra?.apri();");
assert.equal(convertiTesto("WOD5E_MAGE.Arete.Prize"), "M6.Arete.Prize");
assert.equal(convertiTesto("flags.wod5e-mage.salute.pa"), "flags.m6.salute.pa");
// Quello che non è del modulo resta com'è, anche se parla del vecchio sistema.
for (const testo of ["", "Una frase.", "systems/wod5e/assets/x.png", "worlds/milano/mappa.webp", "class=\"wod5e sheet\""]) assert.equal(convertiTesto(testo), testo);
assert.equal(convertiTesto(convertiTesto("modules/wod5e-mage/x wod5e-mage-y")), convertiTesto("modules/wod5e-mage/x wod5e-mage-y"), "ripetere non cambia");
assert.deepEqual(convertiParole({ a: ["wod5e-mage-x", 3, null], "wod5e-mage": "chiave ferma", b: { c: true } }), { a: ["m6-x", 3, null], "wod5e-mage": "chiave ferma", b: { c: true } });

// Gli attrezzi.
assert.equal(pota({ a: "", b: 0, c: false, d: [], e: { f: "<p></p>" } }), undefined);
assert.deepEqual(pota({ a: "x", b: 0, c: [0, 2], d: { e: null, f: true } }), { a: "x", c: [2], d: { f: true } });
assert.ok(uguali({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 }));
assert.ok(!uguali({ a: 1 }, { a: 1, b: undefined }));
assert.deepEqual(unisci({ a: { b: 1, c: 2 }, d: 1 }, { a: { c: 3 }, e: 4 }), { a: { b: 1, c: 3 }, d: 1, e: 4 });

// ---------------------------------------------------------------- le bandiere
{
  const nuove = convertiBandiere(mago().flags);
  assert.deepEqual(Object.keys(nuove).sort(), ["altro", "core", "m6"], "quelle del vecchio sistema cadono, quelle del modulo cambiano nome");
  assert.deepEqual(nuove.core, {}, "la scheda scelta a mano era del modulo: cade");
  assert.equal(nuove.m6.arete.value, 2);
  assert.equal(nuove.m6.focus.sphereNotes.forces, "<p class=\"m6-guidata-lead\">Le Forze.</p>");
  assert.equal(nuove.altro.tenuta, "systems/m6/assets/x.png");
  assert.deepEqual(convertiBandiere(nuove), nuove, "ripetere non cambia");
  // Se il sistema ha già scritto una bandiera sua, la sua vince su quella del modulo.
  assert.deepEqual(convertiBandiere({ "wod5e-mage": { a: 1, b: 1 }, m6: { b: 2 } }).m6, { a: 1, b: 2 });
  // Una scheda scelta a mano che non era di prima resta.
  assert.deepEqual(convertiBandiere({ core: { sheetClass: "altro.Scheda" } }), { core: { sheetClass: "altro.Scheda" } });
  assert.deepEqual(convertiBandiere(undefined), {});
}

// ----------------------------------------------------------------- gli oggetti
{
  const [pregio, scosso, fasciata, umore, pistola, suMisura] = mago().items;
  const p = convertiOggetto(pregio).dati;
  assert.equal(p.img, "systems/m6/assets/icons/archivi/pregio-soprannaturali.svg");
  assert.equal(p.system.description, "<p class=\"m6-nota\">Costo</p>");
  assert.deepEqual(p.flags, { m6: { archivio: { kind: "pregio", name: "Fortunato" } } });
  assert.equal(convertiOggetto(pistola).dati.img, "icons/svg/target.svg", "l'icona di wod5e non c'è più: quella del genere");
  assert.equal(convertiOggetto(fasciata).dati.img, "icons/svg/item-bag.svg");
  assert.equal(convertiOggetto(umore).dati.img, "icons/svg/item-bag.svg");
  assert.equal(convertiOggetto(scosso).dati.flags.m6.condizione, "scosso");
  const scarto = convertiOggetto(suMisura);
  assert.equal(scarto.dati, null);
  assert.deepEqual(scarto.scarto, { _id: "ogg0000000000006", name: "Tiro su misura", type: "customRoll", img: "systems/wod5e/assets/icons/items/custom-roll.png" });
  assert.deepEqual(dadiInMeno(fasciata), [{ dadi: -2, tiri: ["physical"] }]);
  assert.deepEqual(dadiInMeno(umore), []);
  assert.deepEqual(convertiOggetto(p).dati, p, "ripetere non cambia");
}

// ------------------------------------------------------------------ il Mago
{
  const prima = mago();
  const esito = convertiAttore(prima, { quando: "2026-11-26" });
  const d = esito.dati;
  assert.equal(d.type, "mago");
  assert.equal(esito.lasciato, false);
  // I tratti: solo quelli scritti, coi numeri in cifre; le Specializzazioni restano.
  assert.deepEqual(d.system.attributes, { strength: { value: 2 }, dexterity: { value: 3 }, wits: { value: 4 } });
  assert.deepEqual(d.system.skills, { athletics: { value: 2, bonuses: [] }, craft: { value: 3, bonuses: [{ source: "Elettronica", value: 1, paths: ["skills.craft"] }] } });
  assert.deepEqual(d.system.headers, { concept: "Tecnica del suono", chronicle: "", ambition: "Aprire uno studio", desire: "Un caffè" });
  assert.equal(d.system.locked, true);
  assert.deepEqual(d.system.settings, { skillAttributeInputs: true });
  assert.deepEqual(Object.keys(d.system).sort(), ["attributes", "headers", "locked", "settings", "skills"]);
  // Le bandiere del modulo sotto il nome del sistema, col registro del passaggio.
  assert.equal(d.flags.m6.arete.value, 2);
  assert.equal(d.flags["wod5e-mage"], undefined);
  assert.equal(d.flags.wod5e, undefined);
  const registro = d.flags.m6.passaggio;
  assert.equal(registro.da, "mortal");
  assert.equal(registro.sistema, "wod5e");
  assert.equal(registro.quando, "2026-11-26");
  assert.deepEqual(registro.resto, { biography: "<p>Scritta sulla scheda di wod5e.</p>", headers: { touchstones: "La sorella" }, skills: { melee: { value: 2 }, stealth: { value: "1" } } });
  assert.deepEqual(esito.note.assorbite, [{ id: "melee", nome: "Mischia (armi)", pallini: 2 }, { id: "stealth", nome: "Furtività", pallini: 1 }]);
  // Gli oggetti: il tipo che non c'è e la Condizione vecchia scritta a mano coi dadi vanno tolti e restano nel registro.
  assert.deepEqual(esito.togli, ["ogg0000000000003", "ogg0000000000006"]);
  assert.deepEqual(registro.daTogliere, esito.togli);
  assert.deepEqual(registro.oggetti.map((voce) => voce.name), ["Tiro su misura"]);
  assert.deepEqual(registro.condizioni, [{ _id: "ogg0000000000003", name: "Mano fasciata", dadi: [{ dadi: -2, tiri: ["physical"] }], description: "<p>Un taglio.</p>" }]);
  assert.equal(d.items.length, 6, "finché la scheda non si apre gli oggetti restano dentro");
  assert.equal(d.items[0].flags.m6.archivio.kind, "pregio");
  assert.equal(d.items[3].name, "Di cattivo umore", "una Condizione scritta a mano senza dadi resta");
  // Il segnalino: la Salute sulla prima barra, la seconda spenta.
  assert.deepEqual([d.prototypeToken.bar1.attribute, d.prototypeToken.bar2.attribute], ["salute", null]);

  // L'aggiornamento porta davvero dal prima al dopo, senza toccare quello che non cambia.
  const { cambia, togli } = aggiornamento("Actor", prima, d);
  assert.deepEqual(togli, []);
  assert.deepEqual(Object.keys(cambia).sort(), ["==flags", "==prototypeToken", "==system", "items", "type"]);
  assert.deepEqual(cambia.items.map((voce) => voce._id), ["ogg0000000000001", "ogg0000000000002", "ogg0000000000005"], "gli oggetti da togliere non si ritoccano");
  const applicato = applicaAggiornamento(GERARCHIA, "Actor", prima, cambia);
  assert.ok(uguali(applicato, d), "applicato l'aggiornamento, la scheda è quella calcolata");

  // Il secondo giro, a scheda aperta: toglie gli oggetti segnati e pulisce il registro; niente altro.
  const secondo = convertiAttore(applicato, { quando: "2026-11-27", togliSubito: true });
  assert.deepEqual(secondo.togli, ["ogg0000000000003", "ogg0000000000006"]);
  const giro2 = aggiornamento("Actor", applicato, secondo.dati);
  assert.deepEqual(giro2.togli, [{ strada: [], raccolta: "items", ids: ["ogg0000000000003", "ogg0000000000006"] }]);
  assert.deepEqual(Object.keys(giro2.cambia), ["==flags"]);
  assert.equal(giro2.cambia["==flags"].m6.passaggio.daTogliere, undefined);
  assert.equal(giro2.cambia["==flags"].m6.passaggio.quando, "2026-11-26", "la data è quella del primo giro");
  assert.equal(giro2.cambia["==flags"].m6.passaggio.oggetti.length, 1, "il registro non si raddoppia");
  const finito = applicaTogli(applicaAggiornamento(GERARCHIA, "Actor", applicato, giro2.cambia), giro2.togli);
  assert.equal(finito.items.length, 4);
  // Il terzo giro non trova niente: nemmeno una Condizione scritta a mano dopo il passaggio.
  finito.items.push({ _id: "ogg0000000000099", name: "Nuova a mano", type: "condition", img: "icons/svg/item-bag.svg", system: { bonuses: [{ value: -2, paths: ["all"] }] }, flags: {}, effects: [] });
  const terzo = convertiAttore(finito, { togliSubito: true });
  assert.deepEqual(terzo.togli, []);
  assert.deepEqual(aggiornamento("Actor", finito, terzo.dati), { cambia: null, togli: [] });
  // Fuori dal passaggio le Condizioni scritte a mano non si toccano nemmeno su una scheda di prima.
  assert.deepEqual(convertiAttore(mago(), { inCorso: false }).togli, ["ogg0000000000006"]);
}

// I dati che passano, da soli.
assert.deepEqual(sistemaMago({}), { attributes: {}, skills: {}, headers: {}, locked: false });
assert.deepEqual(sistemaMago({ attributes: { strength: { value: 3 } } }, { parziale: true }), { attributes: { strength: { value: 3 } } });
assert.deepEqual(sistemaPng({ standarddicepools: { physical: { value: 5 } }, health: { superficial: 3 } }, { parziale: true }), { standarddicepools: { physical: { value: 5 } } });
assert.deepEqual(abilitaAssorbite({ skills: { melee: { value: "3" }, drive: { value: 0 }, brawl: { value: 5 } } }), [{ id: "melee", nome: "Mischia (armi)", pallini: 3 }]);
assert.equal(restoDelSistema({ biography: "<p></p>", exp: { value: 0, max: 0 }, health: { superficial: 0, max: 5 } }, "mortal", "mago"), undefined);
assert.equal(sferaDalNome(" FORZE "), "forces");
assert.equal(sferaDalNome("Prime"), "prime");
assert.equal(sferaDalNome("Forza"), "");

// ------------------------------------------------------------------ i nemici
{
  // Il nemico con la scheda del modulo: le riserve restano, la bandiera cambia nome.
  const prima = nemico();
  const esito = convertiAttore(prima, { quando: "2026-11-26" });
  const d = esito.dati;
  assert.equal(d.type, "png");
  assert.deepEqual(d.system, {
    standarddicepools: { physical: { value: 6 }, social: { value: 4 }, mental: { value: 3 } },
    exceptionaldicepools: { brawl: { value: 8, active: true }, occult: { value: 0, active: false } },
    health: { max: 6 },
    headers: { concept: "Uomo di fatica" },
    biography: "<p>Lavora al porto.</p>",
    spcType: "mortal",
    locked: false
  });
  assert.deepEqual(d.flags.m6.nemico, { natura: "mortal", casi: { caso0001: { nome: "Scaricare casse", campo: "physical", dadi: 7, sort: 1 } } });
  assert.deepEqual(d.flags.m6.passaggio, { da: "spc", sistema: "wod5e", quando: "2026-11-26" });
  assert.deepEqual(esito.togli, []);
  assert.equal(d.items[0].flags.m6.tipo, "Lama");
  assert.ok(uguali(applicaAggiornamento(GERARCHIA, "Actor", prima, aggiornamento("Actor", prima, d).cambia), d));
  assert.deepEqual(aggiornamento("Actor", d, convertiAttore(d, { togliSubito: true }).dati), { cambia: null, togli: [] }, "ripetere non cambia");
}
{
  // Il PNG di prima: le Sfere scritte come tratti accendono i Domini, gli altri tratti e le riserve
  // assorbite diventano casi a dadi; le riserve oltre l'argine si fermano all'argine.
  const prima = pngDiPrima();
  const esito = convertiAttore(prima, { quando: "2026-11-26" });
  const d = esito.dati;
  assert.equal(d.type, "png");
  assert.equal(d.img, "icons/svg/mystery-man.svg");
  assert.equal(d.prototypeToken.texture.src, "icons/svg/mystery-man.svg");
  assert.deepEqual([d.prototypeToken.bar1.attribute, d.prototypeToken.bar2.attribute], ["salute", null]);
  assert.equal(d.system.standarddicepools.mental.value, 30);
  assert.deepEqual(d.system.exceptionaldicepools, { occult: { value: 8, active: true } });
  assert.deepEqual(d.flags.m6.nemico, {
    casi: {
      assorbita_intimidation: { nome: "Intimidire", campo: "social", dadi: 7, skill: "", sort: 1 },
      tratto_ogg0000000000023: { nome: "Guardia del corpo", campo: "", dadi: 6, skill: "", sort: 2 }
    },
    magick: { on: true, domini: { forces: true, mind: true } },
    natura: "risvegliato"
  });
  assert.deepEqual(esito.note.casi, ["Intimidire", "Guardia del corpo"]);
  assert.deepEqual(esito.note.domini, ["forces", "mind"]);
  assert.deepEqual(esito.togli, ["ogg0000000000021", "ogg0000000000022", "ogg0000000000023"]);
  const registro = d.flags.m6.passaggio;
  assert.deepEqual(registro.oggetti.map((voce) => [voce.name, voce.system?.dice]), [["Forze", 3], ["mente", 2], ["Guardia del corpo", 6]]);
  assert.deepEqual(registro.resto, {
    notes: "<p>Note di wod5e.</p>",
    generaldifficulty: { normal: 3, strongest: 4 },
    health: { superficial: 1 },
    willpower: { superficial: 2 },
    exceptionaldicepools: { intimidation: { value: 7, active: true }, stealth: { value: 5 } }
  });
  // I due giri, come per il Mago.
  const applicato = applicaAggiornamento(GERARCHIA, "Actor", prima, aggiornamento("Actor", prima, d).cambia);
  assert.ok(uguali(applicato, d));
  const secondo = convertiAttore(applicato, { togliSubito: true });
  const giro2 = aggiornamento("Actor", applicato, secondo.dati);
  assert.deepEqual(giro2.togli, [{ strada: [], raccolta: "items", ids: esito.togli }]);
  const finito = applicaTogli(applicaAggiornamento(GERARCHIA, "Actor", applicato, giro2.cambia), giro2.togli);
  assert.deepEqual(Object.keys(finito.flags.m6.nemico.casi), ["assorbita_intimidation", "tratto_ogg0000000000023"], "i casi non si raddoppiano");
  assert.deepEqual(aggiornamento("Actor", finito, convertiAttore(finito, { togliSubito: true }).dati), { cambia: null, togli: [] });
  // Chi può, fa tutto in un giro solo (una scheda già aperta, o portata da fuori).
  const subito = convertiAttore(pngDiPrima(), { togliSubito: true });
  assert.equal(subito.dati.items.length, 1);
  assert.equal(subito.dati.flags.m6.passaggio.daTogliere, undefined);
}
{
  // Una scheda intera di un'altra creatura prende la scheda del Mago; i suoi tracciati restano nel registro.
  const esito = convertiAttore(vampiro());
  assert.equal(esito.dati.type, "mago");
  assert.deepEqual(esito.dati.system.skills, { brawl: { value: 3, bonuses: [] } });
  assert.deepEqual(esito.dati.flags.m6.passaggio.resto, { biography: "<p>Un vampiro.</p>", hunger: { value: 2 }, humanity: { value: 5 }, blood: { potency: 3 }, skills: { intimidation: { value: 4 } } });
  assert.deepEqual(esito.dati.prototypeToken.bar2, { attribute: null });
  assert.deepEqual(esito.togli, ["ogg0000000000031"]);
  // Il gruppo non ha un posto: resta com'è.
  const g = gruppo();
  const lasciato = convertiAttore(g);
  assert.equal(lasciato.lasciato, true);
  assert.equal(lasciato.dati, g);
  assert.deepEqual(lasciato.note, { da: "group" });
}

// ------------------------------------------------------------------ le scene
{
  const prima = scena();
  const tipi = (id) => ({ mago000000000001: { prima: "mortal", dopo: "mago" }, png0000000000001: { prima: "spc", dopo: "png" } })[id] ?? null;
  const { dati, note } = convertiScena(prima, tipi, { inCorso: true });
  assert.deepEqual(dati.flags, prima.flags, "le bandiere degli altri moduli non si toccano");
  assert.deepEqual(dati.walls, prima.walls);
  const [legato, slegato] = dati.tokens;
  assert.deepEqual([legato.bar1.attribute, legato.bar2.attribute, legato.texture.src], ["salute", null, "worlds/prova/ada.webp"]);
  assert.deepEqual(legato.delta, prima.tokens[0].delta, "un delta vuoto resta com'è");
  assert.equal(slegato.texture.src, "icons/svg/mystery-man.svg");
  assert.deepEqual(slegato.flags, { m6: { nota: "sul segnalino" } });
  // Quello che il segnalino porta di suo: le riserve scritte restano, i danni di wod5e vanno nel registro,
  // la Condizione resta, il tratto diventa un caso e sparisce, la lapide resta.
  assert.deepEqual(slegato.delta.system, { standarddicepools: { physical: { value: 5 } } });
  assert.deepEqual(slegato.delta.items.map((voce) => voce._id), ["ogg0000000000041", "ogg0000000000024"]);
  assert.deepEqual(slegato.delta.items[0].flags, { m6: { grado: 1 } });
  assert.equal(slegato.delta.items[0].img, "icons/svg/item-bag.svg");
  assert.deepEqual(slegato.delta.flags.m6.nemico, { fazione: "Scritta sul segnalino", casi: { tratto_ogg0000000000042: { nome: "Scorta", campo: "", dadi: 4, skill: "", sort: 1 } } });
  assert.deepEqual(slegato.delta.flags.m6.passaggio, { resto: { health: { superficial: 3 } }, oggetti: [{ _id: "ogg0000000000042", name: "Scorta", type: "trait", img: "systems/wod5e/assets/icons/items/item-default.svg", system: { dice: 4 } }] });
  assert.deepEqual(note, [{ segnalino: "Via - Nome", scarti: slegato.delta.flags.m6.passaggio.oggetti, condizioni: [], casi: ["Scorta"], domini: [] }]);
  // L'aggiornamento scende fino al delta e dice da dove togliere.
  const { cambia, togli } = aggiornamento("Scene", prima, dati);
  assert.deepEqual(Object.keys(cambia), ["tokens"]);
  assert.deepEqual(Object.keys(cambia.tokens[0]).sort(), ["==bar1", "==bar2", "_id"]);
  assert.deepEqual(Object.keys(cambia.tokens[1]).sort(), ["==bar1", "==bar2", "==flags", "==texture", "_id", "delta"]);
  assert.deepEqual(Object.keys(cambia.tokens[1].delta).sort(), ["==flags", "==system", "items"]);
  assert.deepEqual(togli, [{ strada: [{ raccolta: "tokens", id: "segn000000000002" }, { uno: "delta" }], raccolta: "items", ids: ["ogg0000000000042"] }]);
  const finita = applicaTogli(applicaAggiornamento(GERARCHIA, "Scene", prima, cambia), togli);
  assert.ok(uguali(finita, dati));
  // A passaggio finito la scheda sotto è nostra e ricorda da dove viene: ripetere non cambia.
  const dopo = (id) => ({ mago000000000001: { prima: "mortal", dopo: "mago" }, png0000000000001: { prima: "spc", dopo: "png" } })[id] ?? null;
  assert.deepEqual(aggiornamento("Scene", finita, convertiScena(finita, dopo).dati), { cambia: null, togli: [] });
  // Un segnalino senza scheda, o di una scheda rimasta com'era: solo barre, immagine e bandiere.
  const orfano = convertiSegnalino({ _id: "s", name: "Orfano", actorId: "x", bar1: { attribute: "rage" }, bar2: { attribute: "salute" }, texture: { src: "a.png" }, flags: {} }).dati;
  assert.deepEqual([orfano.bar1.attribute, orfano.bar2.attribute], [null, "salute"]);
}

// ---------------------------------------------------------------- i messaggi
{
  const [tiro, carta, vathra, frase, iniziativa] = messaggi();
  const t = convertiMessaggio(tiro);
  assert.deepEqual(Object.keys(t.flags), ["m6"]);
  assert.deepEqual(Object.keys(t.flags.m6), ["rollCard", "volonta"]);
  const salvato = JSON.parse(t.rolls[0]);
  assert.equal(salvato.class, "TiroM6");
  assert.deepEqual(salvato.terms.map((termine) => termine.class), ["DadoRiserva", "OperatorTerm", "ParadoxDie"]);
  assert.equal(salvato.options.flavor, "<details class=\"m6-roll-card-details\"><summary>Dettagli</summary></details>");
  assert.equal(salvato.formula, "4dmcs>5 + 0dpcs>5");
  assert.deepEqual(salvato.terms[0].results, JSON.parse(tiroSalvato()).terms[0].results, "i dadi usciti non si toccano");
  assert.equal(convertiTiro(t.rolls[0]), t.rolls[0], "ripetere non cambia");
  assert.equal(convertiTiro("non è un tiro"), "non è un tiro");
  // La carta di un oggetto di wod5e stava nelle bandiere: diventa una carta scritta.
  const c = convertiMessaggio(carta);
  assert.deepEqual(c.flags, {});
  assert.equal(c.content, "<div class=\"m6-oggetto-chat\"><h3><img src=\"systems/m6/assets/icons/condizioni/corpo.svg\" alt=\"\" width=\"36\" height=\"36\">Rallentato</h3><p><em>Arrivi sempre dopo</em></p></div>");
  assert.equal(cartaOggetto({ name: "A<b>", description: "" }), "<div class=\"m6-oggetto-chat\"><h3>A&lt;b&gt;</h3></div>");
  assert.equal(convertiMessaggio(vathra).content, "<div class=\"m6-vathra-carta\">ʼafarilsa</div>");
  // Quello che non è del modulo non cambia: nessun aggiornamento.
  assert.deepEqual(aggiornamento("ChatMessage", frase, convertiMessaggio(frase)), { cambia: null, togli: [] });
  assert.deepEqual(aggiornamento("ChatMessage", iniziativa, convertiMessaggio(iniziativa)), { cambia: null, togli: [] });
  assert.deepEqual(Object.keys(aggiornamento("ChatMessage", tiro, t).cambia).sort(), ["==flags", "rolls"]);
  assert.deepEqual(aggiornamento("ChatMessage", t, convertiMessaggio(t)), { cambia: null, togli: [] });
}

// ----------------------------------------------------- diari, macro e il resto
{
  const prima = diario();
  const dopo = convertiGenerico("JournalEntry", prima);
  assert.equal(dopo.pages[0].text.content, "<p>@UUID[Compendium.m6.mage-pregi.Item.06e291a938e8b30a]{Fortunato} e @UUID[Actor.mago000000000001]{Ada}.</p><p><img src=\"systems/m6/assets/icons/sheet/forces.png\"></p>");
  const { cambia, togli } = aggiornamento("JournalEntry", prima, dopo);
  assert.deepEqual(togli, []);
  assert.deepEqual(cambia, { pages: [{ _id: "pagina0000000001", "==text": { content: dopo.pages[0].text.content } }] }, "si manda solo la pagina cambiata");
  const [modulo, domanda, sua] = macro();
  assert.equal(convertiGenerico("Macro", modulo).command, "// Seleziona i personaggi.\nawait game.m6.condizioni.assign();");
  assert.equal(convertiGenerico("Macro", domanda).command, "game.m6?.vathra?.apri();");
  assert.deepEqual(aggiornamento("Macro", sua, convertiGenerico("Macro", sua)), { cambia: null, togli: [] });
  // `_stats` lo scrive Foundry: non si confronta e non si manda.
  assert.deepEqual(aggiornamento("Macro", { _id: "a", name: "x", _stats: { systemId: "wod5e" } }, { _id: "a", name: "x", _stats: { systemId: "m6" } }), { cambia: null, togli: [] });
}

console.log("Passaggio, i conti: prove passate.");
