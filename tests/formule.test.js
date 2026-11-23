import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Handlebars from "handlebars";
import { FORMULE_ALIAS, FORMULE_M6 } from "../scripts/data/formule.js";
import { POTERI } from "../scripts/data/poteri.js";
import { SCOPES } from "../scripts/scopes.js";
import { SPHERES } from "../scripts/spheres.js";
import { prepareGrimorio, prepareGrimorioFormule, prepareGrimorioSpheres } from "../scripts/grimorio.js";

// Le 48 matrici (Blue, 24/9): Sfere e Ambiti del modulo, soglia che torna,
// poteri che esistono, tre testi di Blue, quattro coppie fuse.
assert.equal(FORMULE_M6.length, 48);
assert.equal(new Set(FORMULE_M6.map((formula) => formula.id)).size, 48);
for (const formula of FORMULE_M6) {
  assert.ok(formula.name && formula.intro && formula.limit && formula.use, formula.id);
  assert.ok(formula.access.length >= 1 && formula.access.every((sphere) => SPHERES.includes(sphere)), formula.id);
  assert.ok(formula.amalgams.every((sphere) => SPHERES.includes(sphere) && !formula.access.includes(sphere)), formula.id);
  assert.ok(formula.thresholds.length >= 1, formula.id);
  for (const threshold of formula.thresholds) {
    const scopes = Object.entries(threshold.scopes);
    // Dal 29/9, tolto l'Impatto, una soglia può restare senza Ambiti: è
    // l'effetto di base (Ritoccare, Contrastare), e si legge «0».
    assert.ok(scopes.length <= 3, formula.id);
    assert.ok(scopes.every(([scope, level]) => SCOPES.includes(scope) && level >= 1 && level <= 7), formula.id);
    assert.equal(scopes.reduce((sum, [, level]) => sum + level, 0), threshold.base, formula.id);
  }
  assert.ok(formula.powers.every((id) => POTERI.some((power) => power.id === id)), formula.id);
  // Ogni Sfera d'Accesso ha la sua riga nella Descrizione (Blue, 24/9).
  const righe = Object.keys(formula.bySphere).flatMap((key) => key.split("+"));
  assert.ok(formula.access.every((sphere) => righe.includes(sphere)), `${formula.id}: manca la riga di ${formula.access.find((sphere) => !righe.includes(sphere))}`);
}
assert.deepEqual(FORMULE_M6.filter((formula) => formula.byBlue).map((formula) => formula.name).sort(), ["Accelerare e Rallentare", "Annientare", "Guarire"]);
assert.deepEqual(FORMULE_M6.filter((formula) => formula.name.includes(" e ")).map((formula) => formula.name).sort(), ["Accelerare e Rallentare", "Aprire e Bloccare", "Benedire e Maledire", "Creare e Distruggere"]);
assert.equal(FORMULE_ALIAS.accelerare, "accelerare-e-rallentare");
assert.deepEqual(FORMULE_M6.find((formula) => formula.id === "guarire").thresholds, [{ base: 3, scopes: { potency: 3 } }]);
assert.deepEqual(FORMULE_M6.filter((formula) => formula.thresholds.some((threshold) => !Object.keys(threshold.scopes).length)).map((formula) => formula.id).sort(), ["contrastare", "ritoccare"]);
assert.equal(FORMULE_M6.some((formula) => formula.thresholds.some((threshold) => "impact" in threshold.scopes) || /Impatto/.test(`${formula.thresholdText} ${formula.use}`)), false);
// I poteri: ognuno sta sotto la sua matrice, e la matrice lo elenca. I poteri nuovi del rifacimento
// (30/9, gli aggiunti) una matrice non ce l'hanno ancora: la decide Blue.
const rifacimento = JSON.parse(readFileSync(new URL("../tools/dati/rifacimento.json", import.meta.url), "utf8"));
assert.deepEqual(POTERI.filter((power) => !power.formula).map((power) => power.id).sort(), Object.keys(rifacimento.aggiunti).sort());
for (const power of POTERI.filter((entry) => entry.formula)) {
  const formula = FORMULE_M6.find((entry) => entry.id === power.formula);
  assert.ok(formula, `${power.id}: matrice ${power.formula}`);
  assert.ok(formula.powers.includes(power.id), `${power.id} non sta in ${formula.id}`);
}
assert.equal(POTERI.filter((power) => power.link === "proposta").length, 12);
// I poteri di rigenerazione stanno sotto Guarire (Riparare è per le cose, 24/9).
for (const id of ["rigenerazione", "tempra", "pisolino", "buona-forchetta", "chiodo-fisso"]) {
  assert.equal(POTERI.find((power) => power.id === id).formula, "guarire", id);
}
assert.deepEqual(POTERI.find((power) => power.id === "pila").formula, "riparare");

// Il dialogo del Grimorio si compila con le matrici dentro (la finta Foundry
// non lo apre): la vista per Formula, le scelte e i tasti ci sono.
Handlebars.registerHelper("localize", (key) => String(key));
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("gt", (a, b) => a > b);
const template = Handlebars.compile(readFileSync(new URL("../templates/dialogs/grimorio.hbs", import.meta.url), "utf8"));
const levels = { forces: 3, life: 2, matter: 1 };
const html = template({ groups: prepareGrimorio(levels), formule: prepareGrimorioFormule(levels), spheres: prepareGrimorioSpheres(levels), view: "formula", inSheet: true });
for (const marker of ['data-formula="guarire"', 'data-role="formulaAccess" value="life"', 'data-role="formulaAmalgam" value="matter"', 'data-role="formulaSave"', 'data-role="formulaRoll"', 'data-formula="annientare"', 'data-role="formulaThreshold" value="1"', "M6.Grimorio.NoAccess", "m6-matrice-sfera-riga lit", "Pronto soccorso"]) {
  assert.ok(html.includes(marker), `manca ${marker}`);
}
// Guarire ha due Sfere d'Accesso e il personaggio ne ha una sola: la scelta è già fatta.
assert.match(html, /data-role="formulaAccess" value="life" checked/);
// Dal tiro (fuori dalla scheda) c'è solo «Scegli».
const dalTiro = template({ groups: [], formule: prepareGrimorioFormule(levels), spheres: [], view: "formula", inSheet: false });
assert.ok(dalTiro.includes('data-role="formulaPick"') && !dalTiro.includes('data-role="formulaSave"'));
console.log("Matrici e catalogo dei poteri: test passati.");

// La pagina Formule (Blue, 26/9): a sinistra le Formule accessibili dalle
// Sfere possedute, o tutte; le scelte sulla riga sono tasti; i due tasti in
// fondo scrivono fra gli effetti o caricano il Tiro della prima pagina.
{
  const { accendiScelta, prepareFormulePagina, rigaDellaFormula, sceltaDellaRiga, sfereDelFiltro } = await import("../scripts/formule-scheda.js");
  const conForze = prepareFormulePagina({ forces: 2 }, { localize: (key) => key });
  assert.equal(conForze.totale, 48);
  assert.ok(conForze.aperte > 0 && conForze.aperte < 48);
  assert.equal(conForze.righe.length, conForze.aperte, "senza «tutte» restano le accessibili");
  assert.ok(conForze.righe.every((formula) => formula.open && formula.access.some((sphere) => sphere.id === "forces" && sphere.owned)));
  assert.equal(conForze.tutte, false);
  const tutte = prepareFormulePagina({ forces: 2 }, { tutte: true, localize: (key) => key });
  assert.deepEqual([tutte.righe.length, tutte.aperte, tutte.tutte], [48, conForze.aperte, true]);
  assert.deepEqual(tutte.righe.map((formula) => formula.name), [...tutte.righe.map((formula) => formula.name)].sort((a, b) => a.localeCompare(b, "it")), "in ordine di nome");
  assert.deepEqual(prepareFormulePagina({}, { localize: (key) => key }).righe, [], "senza Sfere niente accessibili");
  // Il filtro per Sfera (26/9 sera): ogni riga porta le sue Sfere d'Accesso in
  // `kinds`, e la pagina le Sfere che compaiono nelle righe mostrate, in ordine di nome.
  assert.ok(conForze.righe.every((formula) => formula.kinds === formula.access.map((sphere) => sphere.id).join(" ")));
  assert.ok(conForze.sfere.some((sphere) => sphere.id === "forces") && conForze.sfere.every((sphere) => sphere.label && sphere.icon.endsWith(`/${sphere.id}.png`)));
  assert.ok(conForze.sfere.length <= tutte.sfere.length && tutte.sfere.length === 9, "con «tutte» compaiono tutte le Sfere");
  assert.deepEqual(sfereDelFiltro([["forces", "time"], ["forces"], []], (key) => key.split(".").pop()).map((sphere) => sphere.id), ["forces", "time"]);
  assert.deepEqual(sfereDelFiltro([["time", "forces"]], (key) => ({ "M6.Spheres.forces": "Forze", "M6.Spheres.time": "Tempo" })[key]).map((sphere) => sphere.label), ["Forze", "Tempo"], "in ordine di nome");
  assert.deepEqual(sfereDelFiltro([]), []);
  // La riga di un tasto (il bug del 26/9 sera: i tasti in fondo portano anch'essi
  // `data-formula`, e `closest` parte da sé: la scelta si leggeva sul tasto, vuota).
  const dettagli = { tag: "DETAILS" };
  const tastoInFondo = { tag: "BUTTON", closest: (selector) => (selector === "[data-formula]" ? tastoInFondo : dettagli) };
  assert.equal(rigaDellaFormula(tastoInFondo), dettagli);
  assert.equal(rigaDellaFormula(null), null);
  // La lettura della riga: la Sfera d'Accesso accesa, le Amalgame accese, la soglia accesa.
  const tasto = (role, dataset, scelta = true) => ({ dataset: { role, ...dataset }, classe: scelta });
  const riga = (tasti) => ({ querySelectorAll: (selector) => tasti.filter((t) => selector.includes(`[data-role=${t.dataset.role}]`) && (!selector.endsWith(".scelta") || t.classe)) });
  assert.deepEqual(sceltaDellaRiga(riga([tasto("formulaAccess", { sphere: "forces" }), tasto("formulaAccess", { sphere: "prime" }, false), tasto("formulaAmalgam", { sphere: "matter" }), tasto("formulaAmalgam", { sphere: "life" }, false), tasto("formulaThreshold", { index: "1" })])), { access: "forces", amalgams: ["matter"], threshold: 1 });
  assert.deepEqual(sceltaDellaRiga(riga([])), { access: "", amalgams: [], threshold: 0 });
  assert.deepEqual(sceltaDellaRiga(null), { access: "", amalgams: [], threshold: 0 });
  // I tasti: l'Accesso e la soglia ne tengono uno acceso, le Amalgame vanno e vengono.
  const finto = (role, sphere) => {
    const el = { dataset: { role, sphere }, attrs: {}, classes: new Set() };
    el.classList = { add: (c) => el.classes.add(c), remove: (c) => el.classes.delete(c), contains: (c) => el.classes.has(c), toggle: (c, on) => { on ? el.classes.add(c) : el.classes.delete(c); return on; } };
    el.setAttribute = (k, v) => { el.attrs[k] = v; };
    return el;
  };
  const a = finto("formulaAccess", "forces"), b = finto("formulaAccess", "prime"), m = finto("formulaAmalgam", "matter");
  const row = { querySelectorAll: (selector) => [a, b, m].filter((el) => selector.includes(el.dataset.role)) };
  for (const el of [a, b, m]) el.closest = () => row;
  b.classes.add("scelta");
  accendiScelta(a);
  assert.deepEqual([a.classes.has("scelta"), b.classes.has("scelta"), a.attrs["aria-pressed"], b.attrs["aria-pressed"]], [true, false, "true", "false"]);
  accendiScelta(a);
  assert.equal(a.classes.has("scelta"), true, "l'Accesso non si spegne da solo");
  assert.equal(accendiScelta(m, { single: false }), true);
  assert.equal(accendiScelta(m, { single: false }), false);
  assert.equal(m.classes.has("scelta"), false);
}

// La pagina si compila: due colonne, la cerca, il tasto «tutte», le righe
// delle Formule coi tasti (senza campi col nome: siamo nel form della scheda),
// gli effetti a tendina con l'Obiettivo da chiusi.
{
  const { prepareFormulePagina, sfereDelFiltro } = await import("../scripts/formule-scheda.js");
  const { prepareIncantesimo, groupIncantesimiBySphere } = await import("../scripts/incantesimi.js");
  Handlebars.registerHelper("localize", (key, options) => {
    const hash = options?.hash ?? {};
    return Object.keys(hash).length ? `${key}(${Object.entries(hash).map(([k, v]) => `${k}=${v}`).join(",")})` : String(key);
  });
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
  for (const name of ["formula-scheda", "incantesimo-card", "filtro-sfere"]) {
    Handlebars.registerPartial(`systems/m6/templates/actor/parts/${name}.hbs`, readFileSync(new URL(`../templates/actor/parts/${name}.hbs`, import.meta.url), "utf8"));
  }
  const pagina = Handlebars.compile(readFileSync(new URL("../templates/actor/parts/grimorio.hbs", import.meta.url), "utf8"), { strict: false });
  const localize = (key) => key;
  const formule = prepareFormulePagina({ forces: 2, prime: 1 }, { localize });
  const incantesimi = [prepareIncantesimo("s1", { name: "Lama di fuoco", goal: "Una lama che brucia", spheres: { forces: 2 }, scopes: { potency: 2 }, magickType: "vulgar" }, localize)];
  const html = pagina({ tab: { cssClass: "active", id: "grimorio", group: "primary" }, locked: false, formule, incantesimi, incantesimiGroups: groupIncantesimiBySphere(incantesimi, localize), effettiSfere: sfereDelFiltro(incantesimi.map((spell) => spell.spheres.map((sphere) => sphere.id)), localize) });
  for (const marker of ["m6-formule-layout", 'data-action="formuleTutte"', 'data-filter="formule"', 'data-list="formule"', "M6.Formule.Conto(", 'm6-formula" data-formula="danneggiare"', `data-formula="${formule.righe[0].id}" data-search="${formule.righe[0].name} ${formule.righe[0].use}" data-kinds="${formule.righe[0].kinds}"`, 'm6-filtri-sfere" data-filters="formule"', 'm6-filtro active" data-kind="" title="M6.Formule.SfereTutte">M6.Formule.SfereTutteBreve</button>', 'm6-filtro m6-filtro-sfera" data-kind="forces" title="M6.Formule.SferaFiltro(sphere&#x3D;M6.Spheres.forces)"', 'data-filter="effetti"', 'm6-filtri-sfere" data-filters="effetti"', 'data-list="effetti"', 'm6-incantesimi-group" data-gruppo="forces"', 'm6-incantesimo" data-row="s1" data-search="Lama di fuoco Una lama che brucia" data-kinds="forces"', 'data-role="formulaAccess" data-sphere="forces"', 'data-action="formulaScrivi" data-formula="danneggiare"', 'data-action="formulaLancia" data-formula="danneggiare"', "m6-riq-effetti", 'data-action="incantesimoFromEffetti"', 'data-action="incantesimoAdd"', 'data-action="grimorioClose"', '<span class="m6-incantesimo-obiettivo" title="Una lama che brucia"><b>M6.Arete.Goal</b> Una lama che brucia</span>', 'data-action="incantesimoRoll" data-row="s1" title="M6.Incantesimi.RollHint"']) {
    assert.ok(html.includes(marker), `manca ${marker}`);
  }
  const righeFormule = html.slice(html.indexOf('data-list="formule"'), html.indexOf("m6-riq-effetti"));
  assert.doesNotMatch(righeFormule, /<(?:input|select|textarea)\b[^>]*\sname=/, "nessun campo col nome dentro le righe delle Formule");
  assert.ok(!righeFormule.includes(" closed"), "senza «tutte» ogni riga è accessibile");
  assert.equal((righeFormule.match(/m6-formula-scelta scelta" data-role="formulaAccess"/g) ?? []).length, formule.righe.filter((formula) => formula.accessOwned.length === 1).length, "con una Sfera d'Accesso sola è già scelta");
  const conTutte = pagina({ tab: { cssClass: "active", id: "grimorio", group: "primary" }, locked: true, formule: prepareFormulePagina({ forces: 2 }, { tutte: true, localize }), incantesimi: [], incantesimiGroups: [] });
  assert.ok(conTutte.includes("m6-formule-tutte active") && conTutte.includes(" closed") && conTutte.includes("M6.Grimorio.NoAccess") && conTutte.includes("M6.Incantesimi.Empty"), "con «tutte» anche le chiuse, e la lista vuota degli effetti");
  assert.ok(conTutte.includes('data-action="formulaScrivi" data-formula="danneggiare" title="M6.Formule.ScriviHint" disabled data-fermo="true"'), "scheda bloccata: non si scrive, si può ancora lanciare");
  const vuota = pagina({ tab: { cssClass: "active", id: "grimorio", group: "primary" }, locked: false, formule: prepareFormulePagina({}, { localize }), incantesimi: [], incantesimiGroups: [], effettiSfere: [] });
  assert.ok(vuota.includes("M6.Formule.Vuote"));
  assert.ok(!vuota.includes("m6-filtri-sfere") && !vuota.includes('data-filter="effetti"'), "senza righe niente filtri");
}
console.log("pagina Formule: ok");
