import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Handlebars from "handlebars";

const ROOT = new URL("../../templates/actor/", import.meta.url).pathname;
Handlebars.registerHelper("localize", (key, options) => {
  const hash = options?.hash ?? {};
  return Object.keys(hash).length ? `${key}(${Object.entries(hash).map(([k, v]) => `${k}=${v}`).join(",")})` : String(key);
});
Handlebars.registerHelper("numLoop", (num, options) => { let out = ""; for (let i = 0; i < Number(num); i += 1) out += options.fn(i); return out; });
Handlebars.registerHelper("eq", (a, b) => a === b);
// `concat` è di Foundry (HandlebarsHelpers.concat): incolla gli argomenti.
Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
for (const name of readdirSync(`${ROOT}parts`)) {
  if (name.endsWith(".hbs")) Handlebars.registerPartial(`systems/m6/templates/actor/parts/${name}`, readFileSync(`${ROOT}parts/${name}`, "utf8"));
}
const stat = Handlebars.compile(readFileSync(`${ROOT}parts/stat.hbs`, "utf8"), { strict: false });
const header = Handlebars.compile(readFileSync(`${ROOT}mage-header.hbs`, "utf8"));

const context = {
  tab: { cssClass: "active", id: "stats", group: "primary" },
  locked: false, img: "a.png", name: "Ianira Vestri", actor: { name: "Ianira Vestri" }, playerName: "Blue",
  settings: { skillAttributeInputs: false },
  creazioneReset: true, resetsById: { attributes: { id: "attributes", label: "Reset", icon: "fa-rotate-left" }, skills: { id: "skills", label: "Reset", icon: "fa-rotate-left" }, spheres: { id: "spheres", label: "Reset", icon: "fa-rotate-left" }, lineage: { id: "lineage", label: "Reset", icon: "fa-rotate-left" }, all: { id: "all", label: "Reset tutto", icon: "fa-rotate-left" } },
  // Il debito del Sacrificio (29/9): una casella in viola, il lucchetto col conto accanto alla Quintessenza.
  salute: { max: 6, locked: 1, debitoQuintessenza: 3, cells: [{ index: 0, state: "ps", label: "x", locked: false }, { index: 1, state: "", label: "x", locked: true }, { index: 2, state: "pa", label: "x", locked: false, debt: true }], status: "" },
  // Le Condizioni (29/9): una riga accesa con l'icona della famiglia e il grado, la scelta per famiglia e per scala.
  condizioniRows: [{ id: "c1", condizione: "offuscato", img: "s.svg", numeral: "II", list: true, family: "sensi", name: "Offuscato", title: "t", dice: "½", weight: "meta", scale: "Vista", what: "Vedi solo forme.", effect: "−2 dadi e difficoltà 8.", suppressed: false }],
  condizioni: [{ id: "sensi", label: "Sensi", icon: "s.svg", scale: [{ id: "vista", label: "Vista", voci: [{ id: "abbagliato", name: "Abbagliato", numeral: "I", active: false, suppressed: false, title: "t" }, { id: "offuscato", name: "Offuscato", numeral: "II", active: true, suppressed: false, title: "t" }] }] }, { id: "scontro", label: "Scontro", icon: "", scale: [{ id: "scontro", label: "", voci: [{ id: "atterrato", name: "Atterrato", numeral: "", active: false, suppressed: false, title: "t" }] }] }],
  magickTrack: { quintessence: 4, paradox: 2, locked: 1, cells: [{ index: 0, number: 1, position: "--track-x: 10%; --track-y: 50%;", state: "quintessence" }] },
  persistentMagickResources: { generatedQuintessence: "1", permanentParadox: 0 },
  wheelAsBar: false, contraccolpo: { used: false },
  lineage: { completa: "Verbena" }, lineageChoices: { familySphere: { icon: "f.png", label: "Vita" }, subSphere: null, groups: [{ label: "Tradizioni", famiglie: [{ id: "verbena", label: "Verbena", selected: true }] }], hasSubfamilies: false, sottofamiglie: [], subKind: "" },
  credos: [{ id: "arte", label: "Tutto è Arte", selected: true }], credoLabel: "Tutto è Arte", credoSpheres: [{ id: "forces", icon: "s.png", label: "Forze", family: true }], credoFree: false, credoSphereChoices: [],
  ritratti: { list: ["a.png", "b.png"], index: 0, count: 2, position: 1, many: true },
  arete: { value: 3, steps: [{ value: 1, active: true }, { value: 2, active: true }, { value: 3, active: true }, { value: 4, active: false }, { value: 5, active: false }] },
  // I poteri inseriti dal giocatore (21/9): due su Forze (Conduttore scelto per il lancio), nessuno su Vita.
  spheres: [{ id: "forces", label: "M6.Spheres.forces", icon: "s.png", value: 3, family: true, chosen: true, poteri: [{ id: "forces-1-1", sphere: "forces", sphereLabel: "Forze", dot: 3, type: "passivo", label: "Vestire lo scudo", short: "Vestire lo scudo", text: "Difesa", selected: false, any: true, ok: true, hint: "" }, { id: "forces-1-2", sphere: "forces", sphereLabel: "Forze", dot: 2, type: "passivo", label: "Conduttore", short: "Conduttore", text: "", selected: true, any: false, ok: true, hint: "" }, { id: "forces-1-2#attivo", sphere: "forces", sphereLabel: "Forze", dot: 2, type: "passivo", label: "Conduttore · attivo", short: "Conduttore · attivo", text: "", selected: false, variant: "attivo", any: false, ok: false, nota: "0/1 per scena", hint: "0/1 per scena\nusi finiti" }], potere: { id: "forces-1-2", short: "Conduttore" } }, { id: "life", label: "M6.Spheres.life", icon: "s.png", value: 0, family: false, chosen: false, poteri: [], potere: null }],
  scopeRows: [{ id: "epic", base: true, declared: false, label: "Epicità", faIcon: "fa-solid fa-wand-magic-sparkles", level: 1, reading: "Trucco", hint: "", mode: "epic", modeLabel: "", modeShort: "", modeCount: 1, nextModeLabel: "", multi: false, modeChosen: true, modeShown: false, modes: [{ id: "epic", label: "", selected: true }], steps: [1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, active: v === 1, lit: v <= 1, reading: `gesto ${v}`, hint: "", tip: `gesto ${v}` })) }, { id: "potency", declared: true, label: "Potenza", faIcon: "fa-solid fa-burst", level: 4, reading: "Peso: un'auto", hint: "", mode: "potencyWeight", modeLabel: "Peso", modeShort: "Peso", modeCount: 2, nextModeLabel: "Danni", multi: true, modeChosen: true, modeShown: false, modes: [{ id: "potencyDamage", label: "Danni", selected: false }, { id: "potencyWeight", label: "Peso", selected: true }], steps: [1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, active: v === 4, lit: v <= 4, reading: `lettura ${v}`, hint: "", tip: `${v} · lettura ${v}` })) }, { id: "targets", declared: false, label: "Bersagli", faIcon: "fa-solid fa-user", level: 0, reading: "Un bersaglio", hint: "", mode: "targets", modeLabel: "Effetto", modeShort: "Effetto", modeCount: 2, nextModeLabel: "Area", multi: true, modeChosen: true, modeShown: true, modes: [{ id: "targets", label: "Effetto", selected: true }, { id: "targetsArea", label: "Area", selected: false }], steps: [1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, active: false, lit: false, reading: `+${v}`, hint: "", tip: `${v} · +${v}` })) }, { id: "duration", declared: false, label: "Durata", faIcon: "fa-solid fa-hourglass", level: 0, reading: "", hint: "", mode: "duration", modeLabel: "Gioco", modeShort: "Gioco", modeCount: 2, nextModeLabel: "Mondo", multi: true, modeChosen: false, modeShown: false, modes: [{ id: "duration", label: "Gioco", selected: false }, { id: "durationWorld", label: "Mondo", selected: false }], steps: [1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, active: false, lit: false, reading: "", hint: "", tip: String(v) })) }],
  poteri: [{ id: "forces-1-1", sphere: "forces", sphereLabel: "Forze", dot: 3, type: "passivo", label: "Vestire lo scudo", short: "Vestire lo scudo", text: "Difesa", selected: false }],
  incantesimi: [{ id: "s1", name: "Lama di fuoco", icon: "s.png", coda: "Forze 3", hint: "Obiettivo", chosen: true }],
  skillsFlat: false,
  attributeGroups: [{ id: "physical", label: "Fisico", rows: [{ id: "strength", displayName: "Forza", value: 3, icon: "i.png", chosen: false }, { id: "dexterity", displayName: "Destrezza", value: 4, icon: "i.png", chosen: true }] }],
  skillGroups: [{ id: "mental", label: "Mentale", rows: [{ id: "occult", key: "skill:occult", displayName: "Velo", value: 5, icon: "i.png", chosen: true, spec: { slots: 3, free: 2, chosen: "rituali", scritte: [{ index: 0, name: "rituali", chosen: true }], suggestions: ["Cosmologia", "Non morti"] }, specialtyChosen: "rituali" }] }],
  customSkills: [{ id: "k1", name: "Cucina", value: 2, chosen: false }],
  traitRows: [{ id: "i1", name: "Occhio di lince", img: "m.png", kind: "merit", kindLabel: "Pregi", dice: "+1", chosen: true, hint: "h" }],
  traitKinds: [{ id: "background", label: "Background", short: "Background", empty: "Nessun Background", active: false }, { id: "merit", label: "Pregi", short: "Pregi", empty: "Nessun Pregio", active: true }, { id: "grimorio", label: "Grimorio", short: "Grimorio", empty: "Nessun incantesimo", active: false }],
  trattiScheda: "merit",
  // La Saggezza come bilancia (3/10): nove caselle, il segno dell'Hubris al secondo passo e quello del Silenzio al centro.
  wisdom: { hubris: 2, silenzio: 0, risplende: false, resolve: 3, composure: 2, riserva: 5, fine: "", fineLabel: "", stato: { hubris: { passo: 2, fine: false, text: "passo 2", riga: "Hubris: passo 2" }, silenzio: { passo: 0, fine: false, text: "al centro", riga: "Silenzio: al centro" } }, cells: [4, 3, 2, 1, 0, 1, 2, 3, 4].map((passo, index) => ({ index, passo, lato: index < 4 ? "hubris" : (index > 4 ? "silenzio" : "centro"), fine: passo === 4, hubris: index === 2, silenzio: index === 4, title: `t${index}` })), convinzioni: [], ancore: [] },
  tiro: { magick: true, size: 6, empty: false, kindLabel: "Tiro di Magick", pills: [],
    // Il riquadro dell'1/10 (quarta passata del mock): la testa a parole, le due colonne con le righe coi simboli
    // e il totale in fondo col meno e il più, l'esito nella riga delle opzioni, i tasti col solo nome.
    testa: { tipo: "magick", label: "Tiro di Magick", hint: "", arete: { value: 3, label: "Areté 3", hint: "h" }, spheres: [{ id: "forces", label: "Forze", icon: "s.png", hint: "h" }], spell: { id: "s1", name: "Lama di fuoco", hint: "h" } },
    riserva: { righe: [{ kind: "attribute", id: "dexterity", img: "systems/m6/assets/icons/sheet/tratti/dexterity.svg", name: "Destrezza", value: "4", hint: "h", via: true }, { kind: "skill", id: "skill:occult", img: "systems/m6/assets/icons/sheet/tratti/occult.svg", name: "Velo", value: "5", hint: "h", via: true }, { kind: "specialty", id: "rituali", skill: "skill:occult", img: "systems/m6/assets/icons/sheet/tratti/occult.svg", name: "rituali", value: "1", hint: "h", indent: true, via: true }, { kind: "power", id: "forces-1-2", img: "s.png", disc: true, name: "Conduttore", value: "1", hint: "Conduttore: +1 dadi · Un dado in più.\nConduttore: vale nei tiri di Abilità", via: true }, { kind: "trait", id: "i1", img: "m.png", name: "Occhio di lince", value: "1", hint: "h", via: true }, { kind: "condizione", id: "offuscato", mask: "s.svg", numeral: "II", name: "Offuscato", value: "½", meno: true, check: { action: "tiroCondizione", on: true }, off: false, hint: "t" }, { kind: "condizione", id: "contuso", mask: "c.svg", numeral: "", name: "Contuso", value: "−1", meno: true, check: { action: "tiroCondizione", on: false }, off: true, hint: "t" }, { kind: "quintessence", id: "quintessence", fa: "fa-solid fa-droplet", name: "Quintessenza", stepper: { action: "tiroQuintessence", value: "0", min: true, max: false, extra: "/ 4" }, hint: "h" }], vuote: { attributo: false, abilita: false }, totale: { value: 12, label: "12", vuoto: false, ritocco: "+1", meno: false, piu: false, hint: "h" }, hint: "h" },
    soglia: { righe: [{ kind: "scope", id: "targets", fa: "fa-solid fa-user", label: "Bersagli", name: "Un bersaglio", value: "0", spenta: true, hint: "Bersagli · Effetto 0: Un bersaglio solo.", via: false }, { kind: "scope", id: "potency", fa: "fa-solid fa-burst", label: "Potenza", name: "Un'auto", value: "4", spenta: false, hint: "Potenza · Peso 4: Un'auto.", via: true }, { kind: "prize", id: "prize", img: "systems/m6/assets/icons/ui/arete.svg", name: "Premio dell'Areté", value: "−3", check: { action: "tiroPrize", on: true }, off: false, hint: "h" }], vuota: false, totale: { value: 4, label: "4", vuoto: false, ritocco: "", meno: false, piu: false, hint: "h" }, hint: "h" },
    esito: { dadi: 8, parola: "dadi", servono: "servono 4 successi", dal: 6, spento: false, impossibile: false, fallisce: false, fallisceTesto: "", riesce: "" },
    blocco: "",
    extra: { value: 0, dice: 0, cap: 3 }, riservaTotale: 11, pool: 12, computed: 4, difficulty: 4, manual: false, dice: 8, dadi: { value: 1, label: "+1" }, impossible: false, successFrom: 8, prize: { on: true, value: 3, arete: 3 }, quintessence: { value: 0, dice: 0, available: 4, allowed: true }, potere: { name: "Conduttore", note: ["Conduttore: +1 dadi · Un dado in più."], esclusi: ["Conduttore: vale nei tiri di Abilità"], autoSuccess: false, autoSuccessMotivo: "", active: false, cost: 0 }, indulgi: null, narratore: { on: true, hint: "h" }, kinds: [{ kind: "accidentale", label: "Accidentale", hint: "h", paradosso: 0 }, { kind: "volgare", label: "Volgare", hint: "h", paradosso: 1 }, { kind: "testimoni", label: "Volgare con testimoni", hint: "h", paradosso: 2 }], dissonanza: { on: false }, ready: true },
  creationSummary: { grades: [{ id: "a", label: "x", selected: true }], counts: [{ state: "ok", value: 1, target: 2, label: "l", hint: "" }], checks: [{ ok: true, label: "l", target: "" }] },
  // Il memo come spunta (23/9), acceso: i conti sui titoli e i premi della Sfida nella barra.
  memo: { on: true, sfida: { done: 1, total: 3, complete: false, prizes: [{ bonus: 1, label: "Abilità", earned: true }, { bonus: 2, label: "Vantaggi", earned: false }, { bonus: 1, label: "Sfera", earned: false }] }, boxes: { identita: { state: "under", concetto: false }, attributi: { text: "12/22", state: "under", sfida: 0 }, abilita: { text: "20/20", state: "exact", sfida: 1, tetto: { ok: false, target: 3 } }, magick: { state: "exact", arete: { ok: true, target: 1 }, sfere: { text: "6/6", state: "exact", sfida: 0 } }, tratti: { state: "under", vantaggi: { text: "5/7", state: "under", sfida: 0 }, difetti: { text: "2/2", state: "exact" } } }, tabs: { personaggio: { state: "under" }, focus: { state: "exact" }, conceptChallenge: { state: "" }, dotazione: { state: "under" } } },
  bonuses: []
};
const html = stat(context);
// Il lancio non costa (il Sistema, 16/11): al centro delle opzioni resta la sola Dissonanza, spenta finché non la si accende.
for (const marker of ['m6-tiro-paga-tasto paradosso" data-action="tiroDissonanza" aria-pressed="false" title="M6.Tiro.DissonanzaHint">M6.Tiro.Dissonanza</button>', 'data-action="saluteSacrificio"', 'data-action="saluteSalda"', '<i class="fa-solid fa-lock" aria-hidden="true"></i> 3', 'm6-salute-cell m6-salute-debito" data-state="pa" data-debt="true"']) {
  assert.ok(html.includes(marker), `manca ${marker}`);
}
{
  // La Dissonanza accesa, e la Ruota senza debito.
  const povero = stat({ ...context, tiro: { ...context.tiro, dissonanza: { on: true } }, salute: { ...context.salute, debitoQuintessenza: 0 } });
  assert.ok(povero.includes('m6-tiro-paga-tasto paradosso acceso" data-action="tiroDissonanza" aria-pressed="true"'), "accesa, la Dissonanza prende il rosso del Paradosso");
  assert.ok(!/tiroPaga|data-pay=/.test(povero) && !/tiroPaga|data-pay=/.test(html), "«paga con» non c'è più: lanciare non costa");
  assert.ok(!povero.includes('data-action="saluteSalda"'), "senza debito niente lucchetto");
}
if (process.env.PRIMA_PAGINA) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.env.PRIMA_PAGINA, html);
}
// Il riquadro del Tiro dell'1/10: la testa col tipo a parole, l'incantesimo e la Sfera sul disco d'oro (l'Areté non
// si stampa); le due colonne con le righe coi simboli (il sigillo dell'Attributo, l'icona dell'Ambito con la lettura
// del livello, spenta a zero; la Condizione con la famiglia e il grado, il potere col sigillo della Sfera), la spunta
// del premio e delle Condizioni, il totale in fondo col meno e il più e la matita; l'esito nelle opzioni; i tasti col
// solo nome.
for (const marker of ['m6-tiro-tipo tipo-magick" title="">Tiro di Magick</span>', 'm6-tiro-chip tipo-spell"', 'data-action="tiroPill" data-kind="spell" data-id="s1"', '<img class="m6-sfera-sigillo" src="s.png" alt=""><span>Forze</span>', 'data-action="tiroPill" data-kind="sphere" data-id="forces"', 'data-action="tiroClear"', 'm6-tiro-colonna riserva"', 'm6-tiro-colonna-testa" title="h">M6.Tiro.Riserva</div>', 'm6-tiro-colonna soglia"', 'm6-tiro-colonna-testa" title="h">M6.Tiro.Soglia</div>', 'm6-tiro-voce tipo-attribute"', '<img class="m6-tiro-voce-icona" src="systems/m6/assets/icons/sheet/tratti/dexterity.svg" alt="">', '<span class="m6-tiro-voce-nome">Destrezza</span>', '<b class="m6-tiro-voce-valore">4</b>', 'm6-tiro-voce tipo-specialty rientro"', 'data-action="tiroPill" data-kind="specialty" data-id="rituali" data-skill="skill:occult"', 'm6-tiro-voce tipo-power"', '<img class="m6-tiro-voce-icona m6-sfera-sigillo" src="s.png" alt="">', 'm6-tiro-voce tipo-prize"', 'data-action="tiroPrize" data-condizione="prize" checked', '<b class="m6-tiro-voce-valore">−3</b>', 'm6-tiro-voce tipo-condizione"', 'data-action="tiroCondizione" data-condizione="offuscato" checked', 'mask-image: url(s.svg)"></i><b>II</b>', '<b class="m6-tiro-voce-valore meno">½</b>', 'm6-tiro-voce tipo-condizione fuori"', 'data-action="tiroCondizione" data-condizione="contuso"  aria-label="Contuso"', 'm6-tiro-voce tipo-quintessence"', 'data-action="tiroQuintessence" data-delta="1"', 'm6-tiro-voce tipo-scope"', 'm6-tiro-voce tipo-scope spenta" title="Bersagli · Effetto 0: Un bersaglio solo."', '<i class="fa-solid fa-user m6-tiro-voce-icona" aria-hidden="true"></i>', '<span class="m6-tiro-voce-nome">Un bersaglio</span>', '<i class="fa-solid fa-burst m6-tiro-voce-icona" aria-hidden="true"></i>', '<span class="m6-tiro-voce-nome">Un&#x27;auto</span>', 'data-action="tiroPill" data-kind="scope" data-id="potency"', 'M6.Tiro.PillolaVia: Potenza"', 'm6-tiro-totale" title="h"', '<span class="m6-tiro-penna"><i class="fa-solid fa-pen" aria-hidden="true"></i>+1</span>', 'data-action="tiroDadi" data-delta="-1"', '<b class="m6-tiro-totale-numero">12</b>', 'data-action="tiroDadi" data-delta="1"', 'data-action="tiroSoglia" data-delta="-1"', '<b class="m6-tiro-totale-numero">4</b>', 'data-action="tiroSoglia" data-delta="1"', 'm6-tiro-opzioni"', '<span class="m6-tiro-esito" title="M6.Tiro.ServonoHint"><i class="fa-solid fa-dice-d10" aria-hidden="true"></i><b>8</b><span>dadi · servono 4 successi</span></span>', 'm6-tiro-indulgi" data-action="tiroIndulgi" aria-pressed="false" title="M6.Tiro.IndulgiHint">M6.Tiro.Indulgi</button>', 'm6-tiro-narratore acceso" data-action="tiroNarratore" aria-pressed="true" title="h">M6.Verdetto.DalNarratore</button>', 'm6-tiro-tasto m6-tiro-tasto-testimoni" data-action="tiroRoll" data-kind="testimoni" title="h">Volgare con testimoni</button>']) {
  assert.ok(html.includes(marker), `manca ${marker}`);
}
assert.ok(html.indexOf("m6-tiro-colonna riserva") < html.indexOf("m6-tiro-colonna soglia") && html.indexOf("m6-tiro-colonna soglia") < html.indexOf("m6-tiro-opzioni"), "Riserva, Soglia, poi le opzioni con l'esito");
assert.ok(!html.includes("m6-pillola") && !html.includes("m6-tiro-catena") && !html.includes("m6-tiro-numero\"") && !html.includes("M6.Tiro.Difficulty"), "niente pillole, catene né i tre numeri di prima; «Difficoltà» non c'è più nel Tiro");
// La quarta passata (1/10): niente riga del conto, niente «a mano» a parte, niente «Paghi con», niente simboli
// sui tasti né sulle pillole; in testa l'Areté non si stampa.
const tiroHtml = html.slice(html.indexOf("m6-riq-tiro"));
for (const via of ["m6-tiro-conto", "m6-tiro-mano", "m6-tiro-paga-etichetta", "m6-tiro-prezzo", "tiroExtra", "fa-wand-sparkles", "fa-dice ", "fa-signal", "fa-circle-dot", "fa-eye", "fa-hand-fist", "fa-user-check", "tipo-arete", 'data-kind="arete"']) {
  assert.ok(!tiroHtml.includes(via), `la quarta passata: nel Tiro non c'è più ${via}`);
}
assert.ok(!html.includes('<span class="m6-tiro-voce-nome">Potenza</span>') && !html.includes('<span class="m6-tiro-voce-nome">Bersagli</span>'), "nella Soglia l'Ambito parla col simbolo e la lettura: il nome sta nel sorvolo");
for (const marker of ["m6-riq-identita", "m6-riq-risorse", "m6-riq-magick", "m6-riq-attributi", "m6-riq-tratti", "m6-riq-abilita", "m6-riq-tiro", 'data-action="tiroArete"', 'data-action="tiroScope" data-scope="potency" data-level="4" data-tooltip="4 · lettura 4"', 'data-action="tiroScope" data-scope="duration" data-level="3" data-tooltip="3"', 'class="m6-pallino-ambito lit" data-action="tiroScope" data-scope="potency" data-level="4"', 'class="m6-pallino-ambito" data-action="tiroScope" data-scope="potency" data-level="5"', 'data-tooltip="7 · lettura 7"', '<small class="m6-ambito-tag" title="Peso">Peso</small></button>', '<span>Durata</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>', 'm6-riga-nome m6-riga-nome-ambito" data-action="cassettoToggle"', 'data-action="scopeMode" data-scope="potency" data-mode="potencyWeight"', 'm6-pastiglia m6-pastiglia-modo scelta" data-action="scopeMode" data-scope="potency" data-mode="potencyWeight"', 'data-action="ventaglioToggle"', 'data-action="tiroDadi" data-delta="1"', 'm6-potere-voce scelta" role="checkbox" aria-checked="true" data-action="tiroPower" data-power="forces-1-2" data-sphere="forces"', 'm6-casella spuntata"', 'm6-sfera-potere pieno" data-action="cassettoToggle"', '<span>Conduttore</span>', 'm6-sfera-conto vuoto"', 'data-action="tiroIncantesimo" data-row="s1"', "m6-riga m6-riga-oggetto m6-riga-incantesimo scelta", 'm6-riq-tratti" data-scheda="merit"', 'm6-filtro m6-scheda active" role="tab" data-kind="merit"', 'data-kind="grimorio"', 'data-action="skillsFlatToggle"', 'data-action="tiroRoll" data-kind="testimoni"', "m6-riga-saggezza con-ventaglio", 'm6-saggezza-track m6-bilancia"', 'm6-bilancia-cella lato-hubris fine" data-action="wisdomCellChange" data-index="0" data-lato="hubris" data-passo="4" title="t0"', '<i class="fa-solid fa-skull" aria-hidden="true"></i>', 'm6-bilancia-cella lato-hubris segno-hubris" data-action="wisdomCellChange" data-index="2" data-lato="hubris" data-passo="2"', 'm6-bilancia-cella lato-centro segno-silenzio" data-action="wisdomCellChange" data-index="4" data-lato="centro" data-passo="0"', 'm6-bilancia-cella lato-silenzio fine" data-action="wisdomCellChange" data-index="8" data-lato="silenzio" data-passo="4"', '<i class="fa-solid fa-hurricane" aria-hidden="true"></i>', '<span class="m6-bilancia-segno hubris" aria-hidden="true"></span>', '<span class="lato-hubris fuori">Hubris: passo 2</span>', '<span class="lato-silenzio">Silenzio: al centro</span>', '<b class="m6-riga-valore" title="M6.Wisdom.RiservaHint(composure&#x3D;2,resolve&#x3D;3)">5</b>', 'data-action="wisdomAtto"', 'data-action="wisdomRisplende"', 'data-action="wisdomAncora"', 'data-action="wisdomReset"', 'm6-ruota-tasto quintessence meno', 'm6-ruota-tasto paradox piu', 'm6-ventaglio m6-ventaglio-sei', 'm6-ventaglio m6-ventaglio-quattro', 'data-action="saluteExtraChange" data-delta="1"', "m6-condizioni-occhiello", 'm6-cond-voce lit" data-action="condizioneToggle" data-condizione="offuscato"', '<b class="m6-cond-grado">II</b><span>Offuscato</span>', 'm6-cond-voce" data-action="condizioneToggle" data-condizione="atterrato" title="t" aria-pressed="false"><span>Atterrato</span>', 'mask-image: url(s.svg)"></i><b>II</b>', 'm6-condizione-dadi">½</b>', '<small>Vista II</small><em>Vedi solo forme.</em><span>−2 dadi e difficoltà 8.</span>', 'data-action="ritrattoNext"', "1/2", 'data-action="specialtyDelete" data-skill="occult" data-index="0"', 'm6-riga-abilita scelta con-specializzazioni aperta" data-skill="occult"', 'class="m6-abilita-apri piena" data-action="specialtyToggle" aria-expanded="true" title="M6.Specialties.Apri" aria-label="Velo: M6.Specialties.Apri"><small>1</small><i class="fa-solid fa-chevron-down"', 'm6-pastiglia m6-pastiglia-spec scelta', 'data-action="tiroSpecialty" data-key="skill:occult" data-specialty="rituali" aria-pressed="true"', 'class="m6-pastiglia-scrivi" list="m6-spec--occult" data-specialty-add="occult" data-skill-label="Velo"', '<datalist id="m6-spec--occult"><option value="Cosmologia"></option><option value="Non morti"></option></datalist>', "m6-riga m6-riga-tratto scelta", "m6-stat-creazione"]) {
  assert.ok(html.includes(marker), `manca ${marker}`);
}
// Il memo acceso (23/9): la barra con la spunta, il grado e la Sfida; i conti sui titoli, colorati.
for (const marker of ["m6-creazione-barra acceso", "name=\"flags.m6.creazione.memo\" checked", "m6-memo-premio preso\">+1 Abilità", "m6-memo-premio\">+2 Vantaggi", "data-reset=\"all\"", 'm6-riq-title memo-under', 'm6-riq-title memo-exact', '<b class="m6-memo-conto" title="M6.Riepilogo.Attributes">12/22</b>', 'M6.Riepilogo.SkillCapBreve 3', 'fa-circle-xmark']) {
  assert.ok(html.includes(marker), `manca ${marker}`);
}
assert.ok(!html.includes("m6-riepilogo-chip") && !html.includes("m6-riepilogo-checks"), "niente chip né spunte del memo vecchio");
{
  // Spento: nessun conto e nessun colore sui titoli.
  const spento = stat({ ...context, memo: { ...context.memo, on: false } });
  assert.ok(!spento.includes("m6-memo-conto") && !spento.includes("memo-under") && !spento.includes("m6-memo-grado"), "memo spento: titoli puliti");
}
assert.ok(!html.includes("m6-tiro-tira"), "con l'Areté acceso il tasto TIRA non c'è: ci sono i tre tasti");
assert.ok(!html.includes("m6-riq-salute") && !html.includes("m6-riq-poteri") && !html.includes("m6-ambito-livello") && !html.includes("m6-riq-grimorio"), "niente riquadri vecchi");
assert.equal((html.match(/data-action="scopeMode"/g) ?? []).length, 6, "le pastiglie delle lenti (23/9): due per Potenza, due per Bersagli, due per Durata");
assert.equal((html.match(/data-action="cassettoToggle"/g) ?? []).length, 4, "le tendine: Potenza, Bersagli e Durata dal nome, il potere di Forze (le Specializzazioni stanno in riga dal 26/9)");
assert.ok(!html.includes('data-action="specialtyAdd"') && !html.includes("m6-abilita-tendina"), "niente finestra né tendina per le Specializzazioni (26/9)");
const sfereHtml = html.slice(html.indexOf("m6-sfere-lista"), html.indexOf("m6-ambiti-lista"));
assert.ok(!sfereHtml.includes("dotCounterChange") && !sfereHtml.includes("resource-value-step"), "niente pallini sulle Sfere della prima pagina (20/9 sera)");
assert.equal((sfereHtml.match(/m6-potere-voce/g) ?? []).length, 3 + 1, "la tendina di Forze: una casella per potere, più la riga «· attivo» (con la sua nota in piccolo)");
// Gli effetti sul tiro (tappa 3): la riga dice se vale fuori dalla Magick, la variante attiva porta la nota e si spegne se non si può; nel Tiro il potere è una riga col sigillo della Sfera e le note nel sorvolo.
for (const marker of ['data-power="forces-1-1" data-sphere="forces" data-any="true"', 'm6-potere-voce variante spenta" role="checkbox" aria-checked="false" data-action="tiroPower" data-power="forces-1-2#attivo"', '<small class="m6-potere-voce-nota">0/1 per scena</small>', 'title="Conduttore: +1 dadi · Un dado in più.', '<span class="m6-tiro-voce-nome">Conduttore</span>', 'data-action="tiroQuintessence" data-delta="1"']) {
  assert.ok(html.includes(marker), `manca ${marker}`);
}
{
  // La riuscita senza tirare sta nell'esito, al posto dei successi che servono; il tiro che fallisce pure, in rosso.
  const riesce = stat({ ...context, tiro: { ...context.tiro, esito: { ...context.tiro.esito, riesce: "Riesce senza tirare: Conduttore" } } });
  assert.ok(riesce.includes('<span class="m6-tiro-esito riesce"><i class="fa-solid fa-check" aria-hidden="true"></i><span>Riesce senza tirare: Conduttore</span></span>') && !riesce.includes("servono 4 successi"), "la riuscita senza tirare");
  const fallisce = stat({ ...context, tiro: { ...context.tiro, esito: { ...context.tiro.esito, dadi: 0, fallisce: true, fallisceTesto: "Il tiro fallisce: Cieco" } } });
  assert.ok(fallisce.includes('<span class="m6-tiro-esito fallisce"><i class="fa-solid fa-ban" aria-hidden="true"></i><span>Il tiro fallisce: Cieco</span></span>'), "il tiro che fallisce");
  // Un dado solo: la parola al singolare; con zero dadi l'esito è rosso.
  const uno = stat({ ...context, tiro: { ...context.tiro, esito: { ...context.tiro.esito, dadi: 1, parola: "dado" } } });
  assert.ok(uno.includes("<b>1</b><span>dado · servono 4 successi</span>"), "un dado solo");
  // La mano del Narratore sulla soglia (Blue, 15/11): oltre +3 o −3 la matita col numero diventa rossa, col suo perché nel sorvolo.
  const conMano = (totale) => stat({ ...context, tiro: { ...context.tiro, soglia: { ...context.tiro.soglia, totale: { ...context.tiro.soglia.totale, ...totale } } } });
  assert.ok(conMano({ ritocco: "+3", oltre: false, oltreHint: "" }).includes('<span class="m6-tiro-penna"><i class="fa-solid fa-pen" aria-hidden="true"></i>+3</span>'), "dentro il metro: la matita com'è");
  assert.ok(conMano({ ritocco: "+4", oltre: true, oltreHint: "Oltre il metro" }).includes('<span class="m6-tiro-penna oltre" title="Oltre il metro"><i class="fa-solid fa-pen" aria-hidden="true"></i>+4</span>'), "oltre il metro: la matita in rosso");
  const zero = stat({ ...context, tiro: { ...context.tiro, esito: { ...context.tiro.esito, dadi: 0, impossibile: true } } });
  assert.ok(zero.includes('m6-tiro-esito impossibile"'), "zero dadi: l'esito è rosso");
  const senzaQ = stat({ ...context, tiro: { ...context.tiro, magick: false, riserva: { ...context.tiro.riserva, righe: context.tiro.riserva.righe.filter((r) => r.kind !== "quintessence") } } });
  assert.ok(!senzaQ.includes('data-action="tiroQuintessence"'), "fuori dalla Magick la Quintessenza c'è solo se un potere lo dice");
}
assert.equal((html.match(/data-action="ventaglioToggle"/g) ?? []).length, 2, "il tastino della ruota su Salute e Saggezza");
// I pallini (21/9): tutti li hanno, anche la Durata senza lettura scelta (col solo numero nel tooltip).
const ambiti = html.slice(html.indexOf("m6-ambiti-lista"), html.indexOf("m6-riq-tiro"));
assert.equal((ambiti.match(/data-action="tiroScope" data-scope="potency"/g) ?? []).length, 7);
// Via il pallino dello 0 (Blue, 2/10): sette pallini per Ambito, i livelli.
assert.ok(!ambiti.includes("pallino-ambito zero") && !ambiti.includes("Scopes.Zero"), "niente pallino dello 0");
// L'Epicità in cima (2/10), staccata: la sua riga ha la classe dello stacco, il nome fermo e il primo pallino acceso.
assert.ok(ambiti.indexOf('data-cassetto="ambito-epic"') < ambiti.indexOf('data-cassetto="ambito-potency"'), "l'Epicità prima degli altri");
assert.ok(ambiti.includes('<div class="m6-riga m6-riga-ambito base" data-cassetto="ambito-epic" title="Trucco">'), "la riga dell'Epicità: staccata, non «scelta» finché non la si alza");
assert.ok(ambiti.includes('<div class="m6-riga m6-riga-ambito con-tendina scelta" data-cassetto="ambito-potency"'), "la Potenza alzata è scelta");
assert.equal((ambiti.match(/data-action="tiroScope" data-scope="epic"/g) ?? []).length, 7);
assert.ok(ambiti.includes('class="m6-pallino-ambito lit" data-action="tiroScope" data-scope="epic" data-level="1"'), "il primo pallino dell'Epicità acceso: ogni lancio vale almeno 1");
assert.equal((ambiti.match(/data-action="tiroScope" data-scope="targets"/g) ?? []).length, 7);
assert.ok(!ambiti.includes('data-scope="area"'), "l'Area non è più un Ambito: è una lente dei Bersagli (23/9)");
assert.ok(ambiti.includes("title=\"Un bersaglio\""), "a riposo la riga legge lo 0, la base");
assert.equal((ambiti.match(/data-action="tiroScope" data-scope="duration"/g) ?? []).length, 7);
assert.ok(!ambiti.includes("m6-ambito-scegli") && !ambiti.includes("ScopeModeChoose"), "«Scegli la lettura» non c'è più");
assert.ok(!ambiti.includes("m6-pastiglia-modo scelta\" data-action=\"scopeMode\" data-scope=\"duration\""), "nessuna pastiglia accesa finché la lettura non è scelta");
assert.ok(!ambiti.includes("pallino-ambito lit scelta") && !ambiti.includes("pallino-ambito scelta"), "niente pallino viola: il livello è il conto degli accesi");
assert.ok(!ambiti.includes("m6-livello") && !ambiti.includes("m6-riga-modo"), "via la tendina dei livelli e il tastino della lettura");
assert.ok(!ambiti.includes("m6-ambito-lettura"), "niente seconda linea sotto l'Ambito (23/9)");
assert.ok(ambiti.includes("title=\"Peso: un&#x27;auto\""), "la lettura del livello resta nel tooltip della riga");
// Le Risorse nell'ordine di Blue (20/9): Salute, Saggezza, Quintessenza,
// Paradosso, Ruota, Condizioni; le colonne: Identità, Attributi, Abilità, Magick.
assert.ok(html.indexOf("m6-riq-attributi") < html.indexOf("m6-riq-abilita") && html.indexOf("m6-riq-abilita") < html.indexOf("m6-riq-magick"), "ordine delle colonne");
const risorseHtml = html.slice(html.indexOf("m6-riq-risorse"), html.indexOf("m6-riq-attributi"));
const posti = ["m6-salute-track", "m6-saggezza-track", "m6-riga-conto quintessence", "m6-riga-conto paradox", "m6-magick-track-stat", "m6-condizioni-box"].map((m) => risorseHtml.indexOf(m));
assert.ok(posti.every((p, i) => p >= 0 && (i === 0 || p > posti[i - 1])), `ordine delle Risorse: ${posti.join(", ")}`);
// Il meno e il più sulle righe dei conti, non sull'arco; niente ventaglio al sorvolo (solo la classe aperto).
assert.ok(!/m6-magick-track-stat[\s\S]*?m6-ruota-tasto[\s\S]*?m6-ruota-dettagli/.test(risorseHtml), "l'arco non porta tasti");
assert.equal((risorseHtml.match(/data-action="ventaglioToggle"/g) ?? []).length, 2, "un tastino della ruota per Salute e Saggezza");
assert.equal((risorseHtml.match(/m6-ventaglio m6-ventaglio-sei/g) ?? []).length, 1, "la ruota a sei della Salute");
assert.equal((risorseHtml.match(/m6-ventaglio m6-ventaglio-quattro/g) ?? []).length, 1, "la ruota a quattro della Saggezza (3/10)");
// La bilancia (3/10): nove caselle, due alla fine coi simboli, il segno dell'Hubris su una e quello del Silenzio al centro.
assert.equal((risorseHtml.match(/m6-bilancia-cella /g) ?? []).length, 9, "nove caselle della bilancia");
assert.equal((risorseHtml.match(/ segno-hubris/g) ?? []).length, 1, "un segno dell'Hubris");
assert.equal((risorseHtml.match(/ segno-silenzio/g) ?? []).length, 1, "un segno del Silenzio");
assert.equal((risorseHtml.match(/m6-bilancia-cella lato-[a-z]+ fine/g) ?? []).length, 2, "Caduto e Folle");
assert.ok(!risorseHtml.includes("m6-inchiostro") && !risorseHtml.includes("m6-saggezza-fine"), "niente inchiostro; senza fine niente etichetta");
{
  // Il personaggio finito: la riga porta la classe e l'etichetta Caduto; entrambi i segni al centro stanno sulla stessa casella.
  const caduto = stat({ ...context, wisdom: { ...context.wisdom, hubris: 4, fine: "hubris", fineLabel: "Caduto", stato: { ...context.wisdom.stato, hubris: { passo: 4, fine: true, text: "Caduto", riga: "Hubris: Caduto" } }, cells: context.wisdom.cells.map((c) => ({ ...c, hubris: c.index === 0 })) } });
  assert.ok(caduto.includes("m6-riga-saggezza con-ventaglio finita") && caduto.includes('<output class="m6-saggezza-fine lato-hubris" title="M6.Wisdom.Fine.hubris">Caduto</output>') && caduto.includes('lato-hubris fine segno-hubris" data-action="wisdomCellChange" data-index="0"'), "Caduto");
  const centro = stat({ ...context, wisdom: { ...context.wisdom, hubris: 0, cells: context.wisdom.cells.map((c) => ({ ...c, hubris: c.index === 4 })) } });
  assert.ok(centro.includes('lato-centro segno-hubris segno-silenzio" data-action="wisdomCellChange" data-index="4"'), "al centro i due segni insieme");
}
// Le Abilità in fila: niente occhielli delle famiglie, le Specifiche in mezzo alle altre.
const flat = stat({ ...context, skillsFlat: true, skillGroups: [{ id: "tutte", label: "", rows: [{ id: "athletics", key: "skill:athletics", displayName: "Atletica", value: 2, icon: "i.png", chosen: false, spec: { slots: 1, free: 1, chosen: "", scritte: [], suggestions: [] } }, { id: "k1", name: "Cucina", displayName: "Cucina", value: 2, chosen: false, custom: true }, { id: "occult", key: "skill:occult", displayName: "Velo", value: 5, icon: "i.png", chosen: false, spec: { slots: 3, free: 3, chosen: "", scritte: [], suggestions: [] } }] }], customSkills: [] });
const abilitaFlat = flat.slice(flat.indexOf("m6-riq-abilita"), flat.indexOf("m6-riq-magick"));
assert.ok(!abilitaFlat.includes("m6-riq-occhiello"), "in fila niente occhielli");
assert.ok(abilitaFlat.indexOf("Atletica") < abilitaFlat.indexOf('customSkills.k1.name') && abilitaFlat.indexOf('customSkills.k1.name') < abilitaFlat.indexOf("Velo"), "la Specifica sta in mezzo, in ordine alfabetico");
assert.ok(abilitaFlat.includes("fa-layer-group"), "il tasto acceso riporta alle famiglie");
const skillRoll = stat({ ...context, tiro: { ...context.tiro, magick: false, kindLabel: "Tiro di Abilità", empty: true, size: 0, ready: false, blocco: "manca l'Attributo o l'Abilità", testa: { tipo: "", label: "", hint: "", arete: null, spheres: [], spell: null }, riserva: { ...context.tiro.riserva, righe: [], vuote: { attributo: true, abilita: true }, totale: { value: 0, label: "0", vuoto: true, ritocco: "", meno: true, piu: false, hint: "h" } }, soglia: { righe: [], vuota: true, totale: { value: null, label: "?", vuoto: true, ritocco: "", meno: false, piu: false, hint: "h" }, hint: "h" }, esito: { ...context.tiro.esito, dadi: 0, dal: 6, spento: true }, dissonanza: null } });
assert.ok(skillRoll.includes('m6-tiro-tira spento" disabled') && skillRoll.includes("<small><i class=\"fa-solid fa-circle-exclamation\" aria-hidden=\"true\"></i> manca l&#x27;Attributo o l&#x27;Abilità</small>"), "senza tratti TIRA c'è, è spento e dice cosa manca");
assert.ok(!skillRoll.includes('data-kind="testimoni"') && !skillRoll.includes("m6-tiro-tipo") && !skillRoll.includes('data-action="tiroClear"'), "niente tipo né Azzera a riquadro vuoto");
for (const marker of ['<span class="m6-tiro-voce-nome">M6.Tiro.VuotoAttributo</span>', '<span class="m6-tiro-voce-nome">M6.Tiro.VuotoAbilita</span>', '<span class="m6-tiro-voce-nome">M6.Tiro.VuotoAmbiti</span>', '<b class="m6-tiro-totale-numero vuoto">0</b>', '<b class="m6-tiro-totale-numero vuoto">?</b>', 'data-action="tiroDadi" data-delta="-1" aria-label="M6.Tiro.Riserva −1" disabled', 'm6-tiro-esito spento"', '<span class="m6-tiro-paga vuota" aria-hidden="true"></span>']) {
  assert.ok(skillRoll.includes(marker), `manca ${marker}`);
}
assert.ok(!skillRoll.includes("m6-tiro-paga-tasto"), "fuori dalla Magick niente Dissonanza: resta il posto al centro");
assert.ok(header({}).includes("m6-header-vuota"));
console.log("template della prima pagina: ok,", html.length, "caratteri");
