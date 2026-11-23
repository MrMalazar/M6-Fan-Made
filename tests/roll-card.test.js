import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  renderBacklashNote,
  renderAutoVictoryBanner,
  renderAutoVictoryContent,
  renderRollCard,
  renderRollNote,
  renderRollSymbols,
  renderRollTitle,
  rollSymbols,
  rollOutcome,
  applySuccessoParadossale
} from "../scripts/roll-card.js";
import { SCOPE_ICONS, SCOPES } from "../scripts/scopes.js";

const it = JSON.parse(readFileSync(new URL("../lang/it.json", import.meta.url), "utf8"));
const localize = (key) => key.split(".").reduce((node, part) => node?.[part], it) ?? key;

// Ogni Ambito ha il suo simbolo.
for (const scope of SCOPES) assert.match(SCOPE_ICONS[scope], /^fa-solid fa-/, scope);

// I simboli: premio (+N dadi dal 27/9), Sfere col livello, Ambiti col livello, in quest'ordine.
const symbols = rollSymbols({
  prize: 3,
  spheres: [{ id: "forces", level: 3 }, { id: "life", level: 2 }],
  scopes: [{ id: "potency", level: 2 }, { id: "precision", level: 1 }]
});
assert.deepEqual(symbols.map((symbol) => [symbol.kind, symbol.id, symbol.value]), [
  ["arete", "arete", "+3"],
  ["sphere", "forces", ""],
  ["sphere", "life", ""],
  ["scope", "potency", "2"],
  ["scope", "precision", "1"]
]);
assert.match(symbols[1].icon, /assets\/icons\/sheet\/forces\.png$/);
assert.equal(symbols[3].faIcon, SCOPE_ICONS.potency);
assert.deepEqual(rollSymbols({}), []);
assert.equal(renderRollSymbols([]), "");

// La fila dei simboli (per i messaggi di prima della 0.86.0): nome e livello nel titolo; le Sfere senza numero (25/9 sera).
const symbolsHtml = renderRollSymbols(symbols, localize);
assert.match(symbolsHtml, /^<div class="m6-roll-symbols">/);
assert.match(symbolsHtml, /m6-roll-symbol-sphere" title="Forze"><img src="[^"]*forces\.png" alt="Forze"><\/span>/);
assert.match(symbolsHtml, /m6-roll-symbol-scope" title="Potenza 2"><i class="fa-solid fa-burst" aria-hidden="true"><\/i><b>2<\/b>/);
assert.match(symbolsHtml, /m6-roll-symbol-arete"[^>]*><img [^>]*arete\.svg[^>]*><b>\+3<\/b>/);

// La scritta grande, in chiaro.
assert.equal(renderAutoVictoryBanner(localize), '<p class="m6-roll-victory">Vittoria automatica</p>');

// La testata (10/9 notte): «Tiro di», poi il sigillo di ogni tratto col nome sotto, separati dal più.
const title = renderRollTitle([
  { id: "intelligence", type: "attribute", label: "Intelligenza", value: 3 },
  { id: "investigation", type: "skill", label: "Investigare", value: 2 },
  { id: "x1", type: "custom", label: "Lancio <coltelli>", value: 1 }
], localize);
assert.match(title, /^<span class="m6-roll-of">Tiro di<\/span><span class="m6-roll-traits">/);
assert.match(title, /<span class="m6-roll-trait" title="Intelligenza 3"><img src="systems\/m6\/assets\/icons\/sheet\/tratti\/intelligence\.svg" alt=""><small>Intelligenza<\/small><\/span><span class="m6-roll-plus">\+<\/span><span class="m6-roll-trait" title="Investigare 2"><img src="[^"]*investigation\.svg" alt=""><small>Investigare<\/small><\/span>/);
assert.match(title, /<span class="m6-roll-plus">\+<\/span><span class="m6-roll-trait" title="Lancio &lt;coltelli&gt; 1"><i class="fa-solid fa-circle-dot" aria-hidden="true"><\/i><small>Lancio &lt;coltelli&gt;<\/small><\/span><\/span>$/);
assert.equal((title.match(/m6-roll-plus/g) ?? []).length, 2);

// Le righe (10/9 notte): Obiettivo, Sfere coi glifi, Ambiti coi simboli, Soglia, Tipo, Effetto, Riserva; i nomi liberi protetti.
const card = renderRollCard({
  traits: [{ label: "Forza", value: 3 }, { label: "Lancio <coltelli>", value: 2 }],
  bonusParts: ["Armonia 2"],
  prize: 3,
  threshold: 4,
  magickType: "Accidentale",
  goal: "Ferire con un'onda <d'urto>",
  effectKind: "M6.Arete.EffectKinds.physical",
  spheres: [{ id: "forces", label: "M6.Spheres.forces", level: 3 }],
  scopes: [{ id: "potency", label: "M6.Scopes.potency", level: 2 }]
}, localize);
const row = (key, label, body) => `<div class="m6-roll-row m6-roll-row-${key}"><b class="m6-roll-key">${label}</b><span class="m6-roll-value">${body}</span></div>`;
// Dall'11/9 le righe stanno in una tendina chiusa: «Dettagli».
assert.equal(
  card,
  '<details class="m6-roll-card-details"><summary>Dettagli</summary><div class="m6-roll-card">'
  + row("goal", "Obiettivo", "Ferire con un'onda &lt;d'urto&gt;")
  + row("spheres", "Sfere", '<span class="m6-roll-symbol m6-roll-symbol-sphere" title="Forze"><img src="systems/m6/assets/icons/sheet/forces.png" alt="Forze"></span>')
  + row("scopes", "Ambiti", '<span class="m6-roll-symbol m6-roll-symbol-scope" title="Potenza 2"><i class="fa-solid fa-burst" aria-hidden="true"></i><b>2</b></span>')
  + row("threshold", "Soglia", "4")
  + row("prize", "Premio dell'Areté", "+3")
  + row("type", "Tipo", "Accidentale")
  + row("effect", "Effetto", "Fisico")
  + row("pool", "Riserva", "Forza 3 + Lancio &lt;coltelli&gt; 2 + Armonia 2")
  + "</div></details>"
);
assert.doesNotMatch(renderRollCard({ traits: [{ label: "Forza", value: 3 }], threshold: 1, magickType: "x" }), /Sfere|Ambiti|Obiettivo|Effetto/);

// Le note: una riga in corsivo, il Contraccolpo in rosso.
assert.equal(renderRollNote("Tetto +3: 1 dadi in meno."), '<p class="m6-roll-note">Tetto +3: 1 dadi in meno.</p>');
assert.match(renderRollNote("CONTRACCOLPO", "backlash"), /m6-roll-note m6-roll-note-backlash/);

// La vittoria senza dadi: scritta, conto (coi glifi nelle righe), note; niente fila di simboli in più.
const content = renderAutoVictoryContent({ symbols, card, notes: [renderRollNote("nota")] }, localize);
assert.match(content, /^<p class="m6-roll-victory">Vittoria automatica<\/p><details class="m6-roll-card-details">[\s\S]*<p class="m6-roll-note">nota<\/p>$/);
assert.doesNotMatch(content, /m6-roll-symbols/);

// La finestra del Grimorio non tira più (il Sistema): la carta del lancio la scrive il riquadro del Tiro.
const arete = readFileSync(new URL("../scripts/arete.js", import.meta.url), "utf8");
assert.doesNotMatch(arete, /renderRollCard|rollSymbols/);
assert.match(readFileSync(new URL("../scripts/tiro-scheda.js", import.meta.url), "utf8"), /spheres: sphereEntries\.map\(\(entry\) => \(\{ id: entry\.id, label:/);
// Nel ramo C la riuscita senza dadi (comprata) la scrive paradox-dice.js con la stessa scritta grande.
assert.doesNotMatch(arete, /renderAutoVictoryContent/);
assert.match(readFileSync(new URL("../scripts/paradox-dice.js", import.meta.url), "utf8"), /renderAutoVictoryBanner\(localize, banner\)/);
assert.equal(renderAutoVictoryBanner(localize, "Riuscita comprata"), '<p class="m6-roll-victory">Riuscita comprata</p>');
assert.doesNotMatch(arete, /Arete\.RollFlavor|Arete\.SpherePlan|Arete\.ScopePlan/);
const paradox = readFileSync(new URL("../scripts/paradox-dice.js", import.meta.url), "utf8");
assert.match(paradox, /\[ROLL_CARD_FLAG\]: card/);
assert.match(paradox, /effectKind: effectKind \?\? "",\s*arete,/);
assert.doesNotMatch(paradox, /isOneStepShort|Arete\.OneStep/);
// Il Contraccolpo in una riga sola (10/9 sera): il nome in rosso, il testo in chiaro; l'Ustione scritta una volta.
assert.match(paradox, /renderBacklashNote\(localize\(onlyParadox \? "M6\.Burst\.Label" : "M6\.Arete\.BacklashLabel"\), `\$\{eyesText\}\.`\)/);
assert.doesNotMatch(paradox, /Arete\.Backlash"/);
assert.match(renderBacklashNote("Contraccolpo", "un occhio sui rossi: Ustione 5"), /^<p class="m6-roll-note m6-roll-note-backlash"><b class="m6-roll-backlash-label">Contraccolpo<\/b> <span class="m6-roll-backlash-text">un occhio sui rossi: Ustione 5<\/span><\/p>$/);
const main = readFileSync(new URL("../scripts/main.js", import.meta.url), "utf8");
assert.match(main, /registerRollCardRendering\(\)/);
for (const lang of ["it", "en"]) {
  const strings = JSON.parse(readFileSync(new URL(`../lang/${lang}.json`, import.meta.url), "utf8"));
  assert.equal(typeof strings.M6.Arete.AutoVictoryBanner, "string", lang);
}

// Il dialogo del tiro: simbolo a sinistra di ogni Sfera e di ogni Ambito,
// i pallini partono dalla stessa colonna, a sinistra.
const dialog = readFileSync(new URL("../templates/dialogs/arete-roll.hbs", import.meta.url), "utf8");
assert.match(dialog, /data-kind="sphere"[^>]*>\s*<img class="m6-arete-row-icon" src="\{\{sphere\.icon\}\}"/);
assert.match(dialog, /data-kind="scope"[^>]*>\s*<i class="m6-arete-row-icon \{\{scope\.faIcon\}\}"/);
// Il conto (10/9): la casella col suo +N a sinistra, il nome a destra (dal 27/9 il premio sono dadi).
assert.match(dialog, /name="prize"[^>]*>\s*<span class="m6-arete-toggle-value">−\{\{prize\.dice\}\}<\/span>\s*<\/span>\s*<span class="m6-arete-row-label">\{\{localize "M6\.Arete\.Prize"\}\}/);
assert.doesNotMatch(dialog, /m6-arete-row-label-full/);
const css = readFileSync(new URL("../styles/m6.css", import.meta.url), "utf8");
assert.match(css, /\.m6-arete-dots-column\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*18px max-content max-content minmax\(0, 1fr\);/s);
assert.match(css, /\.m6-arete-dotrow\s*\{[^}]*display:\s*contents;/s);
assert.match(css, /\.m6-arete-body \.m6-arete-conto-row\s*\{[^}]*grid-template-columns: 4rem minmax\(0, 1fr\);/s);
// Le Sfere in oro come gli Ambiti; l'Obiettivo sul fondo scuro; i titoli nell'oro, le voci in bianco sporco d'arancio (10/9 notte).
assert.match(css, /\.m6-arete-body img\.m6-arete-row-icon\s*\{[^}]*filter: brightness\(0\) invert\(93%\)/s);
assert.match(css, /\.m6-arete-body \.m6-arete-goal-box > textarea,[^{]*\{[^}]*background: var\(--mage-incavo, #15130f\);/s);
assert.match(css, /\.m6-arete-body\s*\{[^}]*color: var\(--mage-oro, #d9a827\);/s);
assert.match(css, /\.m6-arete-body\s*\{\s*--mage-arete-voce: #f3e4c8;\s*\}/);
assert.match(css, /\.m6-arete-body hr\.m6-arete-rule\s*\{[^}]*grid-column: 1 \/ -1;/s);
assert.doesNotMatch(css.slice(css.indexOf("Il dialogo dell'Areté riletto con Blue")), /--mage-oro-chiaro/);
assert.match(css, /\.m6-roll-victory\s*\{[^}]*text-transform:\s*uppercase;/s);
// La carta: le righe in griglia, la fascia gialla, la fila dei tasti.
assert.match(css, /\.m6-roll-card\s*\{[^}]*grid-template-columns: max-content minmax\(0, 1fr\);/s);
assert.match(css, /\.m6-roll-row\s*\{\s*display: contents;/);
assert.match(css, /\.chat-message \.roll-result-label\.failure\.m6-roll-open\s*\{[^}]*background-color: #c99a1e;/s);
assert.match(css, /\.m6-roll-actions > \.m6-roll-action\s*\{/);
assert.doesNotMatch(css, /\.m6-volonta > button|\.m6-sforzo > button|m6-volonta-aggravato|roll-note-onestep/);

console.log("Roll card tests passed.");

// Il conto del Mago in chat: totale vero (successi automatici compresi) contro la soglia,
// e la fascia con una parola (10/9 notte): Successo o Fallimento, e il perché quando c'è.
assert.deepEqual(rollOutcome(5, 3, localize), { total: 5, cssClass: "success", text: "Successo", missing: 0 });
assert.deepEqual(rollOutcome(5, 5, localize), { total: 5, cssClass: "success", text: "Successo", missing: 0 });
assert.deepEqual(rollOutcome(2, 3, localize), { total: 2, cssClass: "failure", text: "Fallimento", missing: 1 });
assert.deepEqual(rollOutcome(3, 6, localize), { total: 3, cssClass: "failure", text: "Fallimento", missing: 3 });
assert.deepEqual(rollOutcome(3, 6, localize, { forced: true }), { total: 3, cssClass: "success", text: "Successo indulgendo", missing: 0 });
assert.deepEqual(rollOutcome(3, 4, localize, { priced: true }), { total: 3, cssClass: "success", text: "Successo a un prezzo", missing: 0 });
assert.deepEqual(rollOutcome(4, 0, localize), { total: 4, cssClass: "", text: "", missing: 0 });
for (const lang of ["it", "en"]) {
  const strings = JSON.parse(readFileSync(new URL(`../lang/${lang}.json`, import.meta.url), "utf8"));
  for (const key of ["Of", "Successes", "Threshold", "Goal", "Spheres", "Scopes", "Type", "Effect", "Pool", "Success", "Failure", "Forced", "Priced"]) assert.equal(typeof strings.M6.RollCard[key], "string", `${lang} ${key}`);
  for (const key of ["CountOne", "CountMany", "Won", "WonMargin", "Lost", "LostOne"]) assert.equal(strings.M6.RollCard[key], undefined, `${lang} ${key} tolta`);
  for (const key of ["BacklashLabel", "BacklashEyesOne", "BacklashEyes", "BacklashSign", "MagickTypeHead", "Other"]) assert.equal(typeof strings.M6.Arete[key], "string", `${lang} ${key}`);
  assert.equal(strings.M6.Arete.OneStep, undefined, `${lang} OneStep tolta`);
  for (const key of ["Label", "Physical", "PhysicalOne", "Mental", "MentalOne", "Aggravated", "AggravatedOne"]) assert.equal(typeof strings.M6.Burst[key], "string", `${lang} ${key}`);
}
const rollCard = readFileSync(new URL("../scripts/roll-card.js", import.meta.url), "utf8");
assert.match(rollCard, /totalTitle\.textContent = game\.i18n\.localize\("M6\.RollCard\.Successes"\)/);
assert.match(rollCard, /title\.innerHTML = renderRollTitle\(data\.traits, game\.i18n\.localize\.bind\(game\.i18n\)\)/);
assert.match(rollCard, /data\.traits \? "" : renderRollSymbols\(data\.symbols \?\? \[\], localize\)/);
assert.match(rollCard, /export function rollActionsBox\(target\)/);
assert.match(rollCard, /export function markRollOpen\(html\)/);
assert.match(paradox, /cardData\.total = roll\._total;/);

// Il successo paradossale sulla carta (Blue, 30/9): la nota compare se il lancio riesce e un rosso fa successo.
{
  const prima = globalThis.game;
  globalThis.game = { i18n: { localize: (k) => k } };
  const finto = () => {
    const target = { html: "", querySelector: (sel) => (sel === ".m6-roll-note-paradossale" && target.html.includes("m6-roll-note-paradossale") ? {} : null), insertAdjacentHTML: (_pos, h) => { target.html += h; } };
    return { target, html: { querySelector: (sel) => (sel === ".dice-result" ? target : null) } };
  };
  const messaggio = (rossi) => ({ rolls: [{ advancedDice: { results: rossi.map((result) => ({ result, active: true })) } }] });
  const carta = { ramo: "C", rossiAParte: true, total: 1, successFrom: 6 };
  let f = finto();
  assert.equal(applySuccessoParadossale(messaggio([7, 2]), f.html, carta), true);
  assert.match(f.target.html, /m6-roll-note-paradossale/);
  assert.match(f.target.html, /M6\.RamoC\.SuccessoParadossale/);
  assert.equal(applySuccessoParadossale(messaggio([7, 2]), f.html, carta), false, "una nota sola per render");
  f = finto();
  assert.equal(applySuccessoParadossale(messaggio([7]), f.html, { ...carta, total: 0 }), false, "col lancio fallito niente nota");
  f = finto();
  assert.equal(applySuccessoParadossale(messaggio([5, 4]), f.html, carta), false, "senza rossi a successo niente nota");
  // Col Sistema la nota la chiama il segno della carta: il tiro ha preso i rossi, per scelta o per forza.
  const nuova = { ...carta, sistema: true, difficulty: 3, total: 3 };
  f = finto();
  assert.equal(applySuccessoParadossale(messaggio([7, 2]), f.html, nuova), false, "un rosso a successo non basta: va preso");
  assert.equal(applySuccessoParadossale(messaggio([7, 2]), f.html, { ...nuova, paradossale: true, rossiPresi: "scelta" }), true);
  assert.match(f.target.html, /M6\.RamoC\.Paradossale</);
  f = finto();
  assert.equal(applySuccessoParadossale(messaggio([10]), f.html, { ...nuova, total: 0, paradossale: true, rossiPresi: "obbligo" }), true, "anche a tiro fallito");
  assert.match(f.target.html, /M6\.RamoC\.ParadossaleObbligo</);
  globalThis.game = prima;
}

// Il margine col Sistema (14/11): i successi oltre la soglia, su ogni tiro; sulle carte di prima
// restava ai tiri di Abilità, oltre il primo successo (la loro soglia scritta è 1).
{
  const fonte = readFileSync(new URL("../scripts/roll-card.js", import.meta.url), "utf8");
  assert.match(fonte, /const margin = Math\.max\(outcome\.total - Math\.max\(Math\.trunc\(Number\(data\.difficulty\) \|\| 0\), 1\), 0\);/);
  assert.match(fonte, /const conMargine = data\.sistema \? !data\.burst && !data\.burstResult : data\.ramo === RAMO && data\.skill;/);
  assert.doesNotMatch(fonte, /ramoCMargin/);
  for (const lang of ["it", "en"]) {
    const strings = JSON.parse(readFileSync(new URL(`../lang/${lang}.json`, import.meta.url), "utf8"));
    assert.doesNotMatch(strings.M6.RamoC.MarginHint, /oltre il primo|beyond the first/, `${lang}: il margine è oltre la soglia`);
  }
}

console.log("Roll outcome tests passed.");
