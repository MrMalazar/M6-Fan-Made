import assert from "node:assert/strict";
import { haSchedeDiPrima, operazioniDelGiro, pianoDelPassaggio } from "../scripts/passaggio/piano.js";
import { contiDi, unisciRapporti } from "../scripts/passaggio/rapporto.js";
import { GERARCHIA } from "../scripts/passaggio/regole.js";
import { applicaAggiornamento, applicaTogli, mondoDelModulo } from "./passaggio-mondo.mjs";

/**
 * Fa sul mondo fotografato quello che farebbe chi esegue: applica le operazioni che si possono fare adesso
 * e apre le schede passate. I delta da rifare si azzerano, e si riscrivono dalla copia se l'operazione lo dice.
 */
function esegui(mondo, piano) {
  for (const op of operazioniDelGiro(piano)) {
    const voci = op.pacco ? mondo.pacchi.find((pacco) => pacco.id === op.pacco).voci : mondo.raccolte[op.raccolta];
    const voce = voci.find((riga) => riga.fonte._id === op.id);
    voce.fonte = applicaTogli(applicaAggiornamento(GERARCHIA, op.documento, voce.fonte, op.cambia), op.togli);
    voce.invalido = false;
    for (const { id } of op.rifai ?? []) {
      const segnalino = voce.fonte.tokens.find((riga) => riga._id === id);
      const copia = segnalino.flags.m6.passaggio.delta;
      segnalino.delta = null;
      if (!op.riscrivi) continue;
      segnalino.delta = copia;
      delete segnalino.flags.m6.passaggio;
    }
  }
  // Le impostazioni portate lasciano il posto a quelle del sistema.
  mondo.impostazioni = mondo.impostazioni.filter((voce) => !piano.impostazioni.some((mossa) => mossa.mossa === "porta" && mossa.id === voce.id));
  if (piano.compendi) mondo.impostazioni.find((voce) => voce.key === "core.compendiumConfiguration").value = piano.compendi;
}

const mondo = mondoDelModulo();
assert.equal(haSchedeDiPrima(mondo), true);

// ------------------------------------------------------------ il primo giro
const primo = pianoDelPassaggio(mondo, { quando: "2026-11-26" });
assert.equal(primo.daFare, true);
assert.equal(primo.aspettano, true, "le schede chiuse non si svuotano e i segnalini aspettano");
// Le quattro schede che hanno un posto, chiuse; il gruppo e il potere del mondo restano.
assert.deepEqual(primo.operazioni.filter((op) => op.documento === "Actor").map((op) => [op.nome, op.invalido, op.togli.length]), [["Ada", true, 0], ["Sgherro", true, 0], ["Via - Nome", true, 0], ["Anziano", true, 0]]);
assert.deepEqual(primo.lasciati, [
  { documento: "Actor", pacco: "", id: "gruppo0000000001", nome: "Il gruppo", tipo: "group" },
  { documento: "Item", pacco: "", id: "mondo00000000002", nome: "Potere del mondo", tipo: "power" }
]);
// La scena aspetta le schede; il resto parte subito. A schede chiuse non si prepara nemmeno il delta da rifare.
const scene = primo.operazioni.filter((op) => op.documento === "Scene");
assert.deepEqual(scene.map((op) => [op.dopoLeSchede, op.rifai.length]), [[true, 1]]);
assert.ok(!operazioniDelGiro(primo).some((op) => op.documento === "Scene"));
assert.deepEqual(contiDi(primo.rapporto), { actors: 4, items: 1, scenes: 1, messages: 3, journal: 1, macros: 2, users: 1, "world.grimorio-comune": 1 });
assert.deepEqual(primo.operazioni.filter((op) => op.pacco).map((op) => [op.pacco, op.documento, op.nome]), [["world.grimorio-comune", "Item", "Formula"]]);
// Le impostazioni: quelle del modulo che il sistema conosce passano, anche il timbro; le altre restano.
assert.deepEqual(primo.impostazioni.map((voce) => [voce.da, voce.a, voce.mossa]), [
  ["wod5e-mage.paradossoNarratore", "m6.paradossoNarratore", "porta"],
  ["wod5e-mage.guidaTesti", "m6.guidaTesti", "porta"],
  ["wod5e-mage.condizioniVersione", "m6.condizioniVersione", "porta"],
  ["wod5e-mage.nonPiuUsata", "m6.nonPiuUsata", "resta"],
  ["wod5e.worldVersion", "", "resta"]
]);
assert.equal(primo.impostazioni[1].valore.controllo.perche, "<p class=\"m6-guidata-lead\">Il memo.</p>");
assert.deepEqual(primo.compendi, { "wod5e.macros": { folder: "a" }, "m6.mage-pregi": { folder: "b" }, "world.grimorio-comune": { folder: null } });
// Il rapporto.
assert.deepEqual(primo.rapporto.portati.map((voce) => [voce.nome, voce.da, voce.a]), [["Ada", "mortal", "mago"], ["Sgherro", "spc", "png"], ["Via - Nome", "spc", "png"], ["Anziano", "vampire", "mago"]]);
assert.deepEqual(primo.rapporto.assorbite, [
  { di: "Ada", voci: [{ nome: "Mischia (armi)", pallini: 2 }, { nome: "Furtività", pallini: 1 }] },
  { di: "Anziano", voci: [{ nome: "Intimidire", pallini: 4 }] }
]);
assert.deepEqual(primo.rapporto.condizioni, [{ di: "Ada", nome: "Mano fasciata", dadi: [{ dadi: -2, tiri: ["physical"] }] }]);
assert.deepEqual(primo.rapporto.casi.find((voce) => voce.di === "Via - Nome").nomi, ["Intimidire", "Guardia del corpo"]);
assert.deepEqual(primo.rapporto.domini.find((voce) => voce.di === "Via - Nome").sfere, ["forces", "mind"]);
assert.ok(primo.rapporto.scarti.some((voce) => voce.di === "Anziano" && voce.nome === "Dominazione" && voce.tipo === "power"));
// I file del sistema nominati negli aggiornamenti, da controllare che ci siano.
assert.ok(primo.percorsi.includes("systems/m6/assets/icons/archivi/pregio-soprannaturali.svg"));
assert.ok(primo.percorsi.includes("systems/m6/assets/icons/sheet/forces.png"));
assert.ok(primo.percorsi.every((percorso) => percorso.startsWith("systems/m6/")));

// ----------------------------------------------------------- il secondo giro
esegui(mondo, primo);
assert.equal(haSchedeDiPrima(mondo), false);
const secondo = pianoDelPassaggio(mondo, { quando: "2026-11-27", inCorso: true });
// Adesso le schede si svuotano. La scena aspetta che siano intere, ma il delta che porta un tratto si
// prepara subito: la copia al sicuro e il delta azzerato, davanti alle schede.
assert.equal(secondo.aspettano, true);
assert.deepEqual(secondo.operazioni.map((op) => [op.documento, op.nome, op.invalido, op.togli.flatMap((voce) => voce.ids).length, Boolean(op.dopoLeSchede)]), [
  ["Actor", "Ada", false, 2, false],
  ["Actor", "Via - Nome", false, 3, false],
  ["Actor", "Anziano", false, 1, false],
  ["Scene", "Il porto", false, 0, true],
  ["Scene", "Il porto", false, 0, false]
]);
const preparazione = secondo.operazioni.at(-1);
assert.deepEqual([preparazione.riscrivi, preparazione.rifai], [false, [{ id: "segn000000000002", nome: "Via - Nome" }]]);
assert.deepEqual(Object.keys(preparazione.cambia.tokens[0]), ["_id", "==flags"], "la preparazione scrive solo la copia");
assert.deepEqual(secondo.rapporto.portati, [], "nessuna scheda viene portata due volte");
assert.deepEqual(secondo.rapporto.scarti.map((voce) => voce.nome), ["Scorta"], "nel secondo giro è nuovo solo quello dei segnalini");
assert.deepEqual(secondo.impostazioni.map((voce) => voce.mossa), ["resta", "resta"]);
assert.equal(secondo.compendi, null);

// ------------------------------------------------- il seguito, a schede intere
esegui(mondo, secondo);
{
  const inMezzo = mondo.raccolte.scenes[0].fonte.tokens[1];
  assert.equal(inMezzo.delta, null, "il delta vecchio è azzerato");
  assert.ok(inMezzo.flags.m6.passaggio.delta, "e quello nuovo aspetta al sicuro");
  assert.deepEqual(inMezzo.bar1, { attribute: "health" }, "il resto del segnalino aspetta le schede");
}
const seguito = pianoDelPassaggio(mondo, { quando: "2026-11-27", inCorso: true });
assert.equal(seguito.aspettano, false);
assert.deepEqual(seguito.operazioni.map((op) => [op.documento, op.nome, op.riscrivi, op.rifai, Boolean(op.dopoLeSchede)]), [["Scene", "Il porto", true, [{ id: "segn000000000002", nome: "Via - Nome" }], false]]);
assert.deepEqual(seguito.rapporto.scarti, [], "il tratto del segnalino è già stato detto");

// ------------------------------------------------------------ a mondo passato
esegui(mondo, seguito);
const terzo = pianoDelPassaggio(mondo);
assert.deepEqual(terzo.operazioni, []);
assert.equal(terzo.daFare, false, "un mondo passato non ha più niente da fare");
assert.equal(terzo.lasciati.length, 2, "quello che resta com'era resta in elenco");
// Com'è finito: Ada senza la Condizione vecchia e senza il tiro su misura, il PNG coi suoi casi, il segnalino a posto.
const ada = mondo.raccolte.actors[0].fonte;
assert.equal(ada.type, "mago");
assert.deepEqual(ada.items.map((voce) => voce.name), ["Fortunato", "Scosso", "Di cattivo umore", "Pistola"]);
assert.equal(ada.flags.m6.passaggio.quando, "2026-11-26");
assert.equal(ada.flags.m6.passaggio.daTogliere, undefined);
const png = mondo.raccolte.actors[2].fonte;
assert.deepEqual(png.items.map((voce) => voce.name), ["Bastone"]);
assert.deepEqual(Object.keys(png.flags.m6.nemico.casi), ["assorbita_intimidation", "tratto_ogg0000000000023"]);
const segnalino = mondo.raccolte.scenes[0].fonte.tokens[1];
assert.deepEqual([segnalino.bar1.attribute, segnalino.bar2.attribute], ["salute", null]);
assert.deepEqual(segnalino.delta.items.map((voce) => voce._id), ["ogg0000000000041", "ogg0000000000024"]);
assert.deepEqual(segnalino.delta.flags.m6.nemico.casi.tratto_ogg0000000000042.nome, "Scorta", "il caso nato dal tratto del segnalino è arrivato");
assert.deepEqual(segnalino.flags, { m6: { nota: "sul segnalino" } }, "la copia è sparita");
assert.equal(mondo.raccolte.users[0].fonte.flags.m6.tema, "chiaro");
assert.equal(mondo.pacchi[0].voci[0].fonte.flags.m6.formula.sfera, "forces");

// --------------------------------------------- l'esame dal mondo del modulo
// Nel mondo che gira ancora col modulo Foundry dà le schede per aperte e non si sa che cosa il sistema
// conosce: il piano è lo stesso del primo giro (una scheda col tipo di prima è chiusa comunque), e il
// rapporto dice già tutto quello che succederà.
{
  const vecchio = mondoDelModulo();
  for (const voce of [...vecchio.raccolte.actors, ...vecchio.raccolte.items]) voce.invalido = false;
  vecchio.registrate = null;
  const esame = pianoDelPassaggio(vecchio);
  assert.equal(esame.aspettano, true);
  assert.deepEqual(esame.operazioni.filter((op) => op.documento === "Actor").map((op) => [op.invalido, op.togli.length]), [[true, 0], [true, 0], [true, 0], [true, 0]]);
  assert.deepEqual(esame.rapporto.condizioni, primo.rapporto.condizioni);
  assert.deepEqual(esame.rapporto.scarti.length, primo.rapporto.scarti.length);
  assert.deepEqual(esame.impostazioni.filter((voce) => voce.mossa === "porta").length, 4);
}

// Una scheda di prima dentro un compendio: Foundry la dà per aperta, ma va trattata da chiusa.
{
  const conPacco = mondoDelModulo();
  const scheda = structuredClone(conPacco.raccolte.actors[2].fonte);
  conPacco.pacchi.push({ id: "world.bestiario", nome: "Bestiario", documento: "Actor", voci: [{ fonte: scheda, invalido: false }] });
  const piano = pianoDelPassaggio(conPacco);
  const op = piano.operazioni.find((voce) => voce.pacco === "world.bestiario");
  assert.deepEqual([op.invalido, op.togli.length, op.cambia.type], [true, 0, "png"]);
  assert.equal(piano.rapporto.nomi["world.bestiario"], "Bestiario");
}

// Una scena dentro un compendio passa come quelle del mondo, coi tipi delle schede del mondo.
{
  const conScena = mondoDelModulo();
  conScena.pacchi.push({ id: "world.mappe", nome: "Mappe", documento: "Scene", voci: [{ fonte: structuredClone(conScena.raccolte.scenes[0].fonte), invalido: false }] });
  const piano = pianoDelPassaggio(conScena);
  const op = piano.operazioni.find((voce) => voce.pacco === "world.mappe");
  assert.deepEqual([op.documento, op.dopoLeSchede, op.rifai.length], ["Scene", true, 1]);
}

// Il rapporto di due giri: le voci dette due volte restano una, i documenti toccati due volte si contano una.
{
  const due = unisciRapporti(primo.rapporto, primo.rapporto);
  assert.deepEqual(due.portati, primo.rapporto.portati);
  assert.deepEqual(contiDi(due), contiDi(primo.rapporto));
  const coiGiri = unisciRapporti(primo.rapporto, secondo.rapporto);
  assert.equal(contiDi(coiGiri).actors, 4);
  assert.equal(contiDi(coiGiri).scenes, 1);
  assert.deepEqual(coiGiri.scarti.map((voce) => voce.nome).slice(-1), ["Scorta"]);
}

// Un mondo nato col sistema: niente da fare.
{
  const nostro = { raccolte: { actors: [{ fonte: { _id: "a", name: "Nuovo", type: "mago", system: {}, items: [], effects: [], flags: {}, prototypeToken: { bar1: { attribute: "salute" }, bar2: { attribute: null }, texture: { src: "icons/svg/mystery-man.svg" }, flags: {} } }, invalido: false }], messages: [{ fonte: { _id: "m", content: "ciao", rolls: [], flags: {} }, invalido: false }] }, pacchi: [], impostazioni: [{ id: "i", key: "m6.quadroMaghi", value: { ids: [] } }], registrate: ["m6.quadroMaghi"] };
  const piano = pianoDelPassaggio(nostro);
  assert.equal(piano.daFare, false);
  assert.deepEqual(piano.operazioni, []);
  assert.equal(haSchedeDiPrima(nostro), false);
}

console.log("Passaggio, il piano: prove passate.");
