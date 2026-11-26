import assert from "node:assert/strict";
import { haSchedeDiPrima, operazioniDelGiro, pianoDelPassaggio } from "../scripts/passaggio/piano.js";
import { GERARCHIA } from "../scripts/passaggio/regole.js";
import { applicaAggiornamento, applicaTogli, mondoDelModulo } from "./passaggio-mondo.mjs";

/** Fa sul mondo fotografato quello che farebbe Foundry: applica le operazioni di un giro e apre le schede passate. */
function esegui(mondo, piano) {
  for (const op of operazioniDelGiro(piano)) {
    const voci = op.pacco ? mondo.pacchi.find((pacco) => pacco.id === op.pacco).voci : mondo.raccolte[op.raccolta];
    const voce = voci.find((riga) => riga.fonte._id === op.id);
    voce.fonte = applicaTogli(applicaAggiornamento(GERARCHIA, op.documento, voce.fonte, op.cambia), op.togli);
    voce.invalido = false;
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
// La scena aspetta le schede; il resto parte subito.
const scena = primo.operazioni.find((op) => op.documento === "Scene");
assert.equal(scena.dopoLeSchede, true);
assert.ok(!operazioniDelGiro(primo).includes(scena));
assert.deepEqual(primo.rapporto.conti, { actors: 4, items: 1, scenes: 1, messages: 3, journal: 1, macros: 2, users: 1, "world.grimorio-comune": 1 });
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
assert.equal(secondo.aspettano, false);
// Adesso le schede si svuotano e la scena passa; niente altro è rimasto da fare.
assert.deepEqual(secondo.operazioni.map((op) => [op.documento, op.nome, op.invalido, op.togli.flatMap((voce) => voce.ids).length]), [
  ["Actor", "Ada", false, 2],
  ["Actor", "Via - Nome", false, 3],
  ["Actor", "Anziano", false, 1],
  ["Scene", "Il porto", false, 1]
]);
assert.ok(secondo.operazioni.every((op) => !op.dopoLeSchede));
assert.deepEqual(secondo.rapporto.portati, [], "nessuna scheda viene portata due volte");
assert.deepEqual(secondo.rapporto.scarti.map((voce) => voce.nome), ["Scorta"], "nel secondo giro è nuovo solo quello dei segnalini");
assert.deepEqual(secondo.impostazioni.map((voce) => voce.mossa), ["resta", "resta"]);
assert.equal(secondo.compendi, null);

// ------------------------------------------------------------ a mondo passato
esegui(mondo, secondo);
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
assert.equal(mondo.raccolte.users[0].fonte.flags.m6.tema, "chiaro");
assert.equal(mondo.pacchi[0].voci[0].fonte.flags.m6.formula.sfera, "forces");

// --------------------------------------------- l'esame dal mondo del modulo
// Nel mondo che gira ancora col modulo le schede sono aperte e non si sa che cosa il sistema conosce:
// il piano dice tutto quello che succederebbe, in un giro solo.
{
  const vecchio = mondoDelModulo();
  for (const voce of [...vecchio.raccolte.actors, ...vecchio.raccolte.items]) voce.invalido = false;
  vecchio.registrate = null;
  const esame = pianoDelPassaggio(vecchio);
  assert.equal(esame.aspettano, false);
  assert.deepEqual(esame.operazioni.filter((op) => op.documento === "Actor").map((op) => op.togli.flatMap((voce) => voce.ids).length), [2, 0, 3, 1]);
  assert.equal(esame.operazioni.find((op) => op.documento === "Scene").dopoLeSchede, false);
  assert.deepEqual(esame.impostazioni.filter((voce) => voce.mossa === "porta").length, 4);
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
