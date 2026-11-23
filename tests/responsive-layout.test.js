import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../styles/m6.css", import.meta.url), "utf8");
const tabNavigation = readFileSync(
  new URL("../templates/actor/parts/tab-navigation.hbs", import.meta.url),
  "utf8"
);
const mageHeader = readFileSync(
  new URL("../templates/actor/mage-header.hbs", import.meta.url),
  "utf8"
);
const stat = (file) => readFileSync(new URL(`../templates/actor/parts/${file}`, import.meta.url), "utf8");
const statTemplate = stat("stat.hbs");
const magickTemplate = readFileSync(
  new URL("../templates/actor/parts/spheres.hbs", import.meta.url),
  "utf8"
);

// La scheda minimizzata non può ereditare un pavimento che impedisca a
// Foundry di richiuderla tramite doppio clic sulla barra del titolo.
assert.match(
  css,
  /\.m6\.m6w\.actor\.sheet\.minimized\s*\{[^}]*min-height:\s*0;/s
);
assert.doesNotMatch(
  css,
  /\.m6\.m6w\.actor\.sheet\s*\{[^}]*min-height:/s
);

// La prima pagina a otto riquadri (16/9 sera): quattro colonne, due riquadri
// ciascuna; le colonne sono trasparenti alla griglia e ogni riquadro ha la
// sua area, così la fascia bassa (Grimorio, Tratti, Il Tiro) sta su una riga
// sola e le Risorse prendono le due righe sotto l'Identità.
assert.match(css, /\.m6-stat-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\) minmax\(0, 1\.45fr\);[^}]*min-height:\s*0;/s);
assert.match(css, /\.m6-stat\.active\s*\{[^}]*flex:\s*1 1 auto;[^}]*min-height:\s*0;/s);
assert.match(css, /\.m6-riq-body\s*\{[^}]*overflow-y:\s*auto;/s);
assert.match(css, /\.m6-stat-col\s*\{[^}]*display:\s*contents;/s);
// L'ordine delle colonne (Blue, 20/9): Identità, Attributi, Abilità, Magick;
// sotto, Risorse, Tratti, Grimorio, Il Tiro.
// Dal 23/9 il Grimorio sta dentro i Tratti e Il Tiro prende due colonne.
for (const [riq, area] of [["identita", "1 / 1 / 2 / 2"], ["risorse", "2 / 1 / 4 / 2"], ["attributi", "1 / 2 / 3 / 3"], ["tratti", "3 / 2 / 4 / 3"], ["abilita", "1 / 3 / 3 / 4"], ["magick", "1 / 4 / 3 / 5"], ["tiro", "3 / 3 / 4 / 5"]]) {
  assert.match(css, new RegExp(`\\.m6-riq-${riq} \\{ grid-area: ${area.replace(/\//g, "\\/")}; \\}`), `area di ${riq}`);
}
assert.doesNotMatch(css, /m6-riq-salute|m6-riq-poteri|m6-ambito-livell|m6-riq-grimorio/);
// Gli otto riquadri stanno in stat.hbs nell'ordine delle colonne; la testata è vuota e nascosta.
assert.match(statTemplate, /stat-identita\.hbs[\s\S]*stat-risorse\.hbs[\s\S]*stat-attributi\.hbs[\s\S]*stat-tratti\.hbs[\s\S]*stat-abilita\.hbs[\s\S]*stat-magick\.hbs[\s\S]*stat-tiro\.hbs/);
assert.doesNotMatch(statTemplate, /stat-grimorio\.hbs/);
assert.doesNotMatch(statTemplate, /stat-poteri\.hbs|riq-salute/);
assert.match(mageHeader, /<header class="actor-header m6-header m6-header-vuota" aria-hidden="true"><\/header>/);
assert.match(css, /\.m6-header-vuota\s*\{\s*display: none;/);
// La finestra parte larga per le quattro colonne.
const sheetSource = readFileSync(new URL("../scripts/sheets/mage-actor-sheet.js", import.meta.url), "utf8");
assert.match(sheetSource, /position: \{\s*width: 1340,\s*height: 1080\s*\}/);
// Le righe scelte sono viola; il livello dell'Ambito scelto è viola nel
// cassetto e nel cerchio sulla riga; il cassetto si apre al sorvolo su ogni
// riga che ce l'ha (Abilità, Sfere, Ambiti) e sopra quando sotto non c'è posto.
assert.match(css, /\.m6-riga\.scelta\s*\{[^}]*background:\s*var\(--mage-viola\);/s);
// I pallini degli Ambiti (20/9 sera): come quelli delle Sfere, oro pieno fino al
// livello, niente viola; a riposo al 40%; «Scegli la lettura» al loro posto
// finché una lettura non c'è; la pastiglia della lettura sotto il nome, la
// lettura del livello centrata e in grassetto.
assert.match(css, /\.m6-pallino-ambito\.lit\s*\{[^}]*background:\s*var\(--mage-dot-color\);/s);
assert.doesNotMatch(css, /\.m6-pallino-ambito\.scelta/);
assert.match(css, /\.m6-riga-ambito:not\(\.scelta\):not\(:hover\) \.m6-ambito-pallini\s*\{\s*opacity: 0\.4;/);
// «Scegli la lettura» non c'è più (21/9): i pallini ci sono sempre, la lettura è facoltativa.
assert.doesNotMatch(css, /\.m6-ambito-scegli/);
// La seconda linea con la lettura non c'è più (23/9): la pastiglia sta dopo il nome, sulla stessa linea.
assert.doesNotMatch(css, /\.m6-ambito-lettura/);
assert.match(css, /\.m6-riga-nome-ambito > \.m6-ambito-tag\s*\{\s*margin-left: 2px;/);
assert.match(css, /\.m6-ambito-tag\s*\{[^}]*text-transform: uppercase;/s);
assert.match(css, /\.m6-riga-tastini\s*\{[^}]*margin-left:\s*auto;/s);
assert.match(css, /\.m6-cassetto-modi\s*\{[^}]*flex-wrap:\s*wrap;/s);
assert.doesNotMatch(css, /m6-cassetto-ambito|m6-livello-lettura/);
assert.match(css, /\.m6-riga\.aperto > \.m6-cassetto\s*\{\s*display: flex;/);
// Le tendine degli Ambiti non si aprono al sorvolo: nessuna regola :hover su con-tendina.
assert.doesNotMatch(css, /con-tendina[^{]*:hover[^{]*\.m6-cassetto/);
assert.doesNotMatch(css, /m6-riga-modo/);
assert.doesNotMatch(css, /pastiglia-livello/);
assert.match(css, /\.m6-riga\.con-cassetto:hover > \.m6-cassetto[^{]*\{\s*display: flex;/);
assert.match(css, /\.m6-riga\.cassetto-su > \.m6-cassetto\s*\{[^}]*bottom: calc\(100% - 2px\);[^}]*top: auto;/s);
// La tendina dei poteri (20/9 sera) si apre col clic, non al sorvolo: una colonna di caselle.
assert.doesNotMatch(css, /con-cassetto:hover > \.m6-cassetto-poteri/);
assert.match(css, /\.m6-cassetto-poteri\s*\{[^}]*flex-direction: column;/s);
assert.match(css, /\.m6-casella\.spuntata::before \{\s*content: "\\2713";/);
// La misura del testo: una scala sul contenuto della finestra.
assert.match(css, /\.window-content\s*\{\s*position: relative;\s*zoom: var\(--mage-scala, 1\);/);
// La scheda minimizzata resta richiudibile; sotto i 1280 le quattro colonne si
// accavallavano (16/9), e la minima segue la scala dello schermo (16/9 sera).
assert.match(
  css,
  /\.sheet:not\(\.minimized\)\s*\{[^}]*min-width:\s*calc\(1280px \* var\(--mage-scala, 1\)\);/s
);
// La finestra parte della misura che sta nello schermo e si riadatta al ridimensionamento.
assert.match(sheetSource, /_initializeApplicationOptions\(options\) \{[\s\S]*misuraFinestra\(game\.settings\.get\(MODULE_ID, SCALA_SETTING\), window\)/);
assert.match(sheetSource, /static adattaAlloSchermo\(\)[\s\S]*sporgeDalloSchermo\(app\.position, window\)[\s\S]*app\.setPosition\(misuraFinestra\(scala, window\)\)/);
assert.match(sheetSource, /window\.addEventListener\("resize"/);
assert.match(sheetSource, /viewport: window \}\);\n\s+MageActorSheet\.agganciaSchermo\(\);/);
// La pagina si vede solo quando è la linguetta accesa. Il Tiro (1/10, quarta
// passata del mock di Blue): la testa col tipo a parole e la Sfera; due
// colonne, Riserva e Soglia, con le righe di quello che è in tiro e il totale
// in fondo col meno e il più; l'esito nelle opzioni con la Dissonanza al
// centro (il lancio non costa più: 16/11); TIRA o i tre tasti del tipo col solo nome.
assert.match(css, /\.m6-stat:not\(\.active\)\s*\{\s*display: none;/);
assert.match(css, /\.m6-stat\.active\s*\{[^}]*display: flex;/s);
const tiroTemplate = stat("stat-tiro.hbs");
assert.match(tiroTemplate, /m6-riq-title m6-tiro-testa[\s\S]*m6-tiro-tipo tipo-\{\{tiro\.testa\.tipo\}\}" title="\{\{tiro\.testa\.hint\}\}">\{\{tiro\.testa\.label\}\}<\/span>[\s\S]*\{\{#each tiro\.testa\.spheres as \|sphere\|\}\}[\s\S]*m6-sfera-sigillo[\s\S]*data-action="tiroClear"[\s\S]*m6-tiro-colonne[\s\S]*m6-tiro-colonna riserva[\s\S]*M6\.Tiro\.Riserva[\s\S]*\{\{#each tiro\.riserva\.righe as \|voce\|\}\}[\s\S]*data-action="tiroPill" data-kind="\{\{voce\.kind\}\}" data-id="\{\{voce\.id\}\}"[\s\S]*m6-tiro-totale[\s\S]*m6-tiro-penna[\s\S]*data-action="tiroDadi" data-delta="-1"[\s\S]*\{\{tiro\.riserva\.totale\.label\}\}[\s\S]*data-action="tiroDadi" data-delta="1"[\s\S]*m6-tiro-colonna soglia[\s\S]*M6\.Tiro\.Soglia[\s\S]*\{\{#each tiro\.soglia\.righe as \|voce\|\}\}[\s\S]*\{\{#if voce\.spenta\}\} spenta\{\{\/if\}\}[\s\S]*data-action="tiroSoglia" data-delta="-1"[\s\S]*\{\{tiro\.soglia\.totale\.label\}\}[\s\S]*data-action="tiroSoglia" data-delta="1"[\s\S]*m6-tiro-opzioni[\s\S]*m6-tiro-esito[\s\S]*\{\{tiro\.esito\.dadi\}\}[\s\S]*\{\{tiro\.esito\.servono\}\}[\s\S]*data-action="tiroDissonanza"[\s\S]*data-action="tiroIndulgi"[\s\S]*data-action="tiroNarratore"[\s\S]*data-action="tiroRoll" data-kind="\{\{kind\.kind\}\}" title="\{\{kind\.hint\}\}">\{\{kind\.label\}\}<\/button>[\s\S]*m6-tiro-tira" data-action="tiroRoll"[\s\S]*m6-tiro-tira spento" disabled/);
assert.doesNotMatch(tiroTemplate, /m6-pillola|m6-tiro-catena|m6-tiro-numero"|M6\.Tiro\.Difficulty\b|tiroDifficulty|m6-tiro-conto|m6-tiro-mano|tiroExtra|m6-tiro-prezzo|paga-etichetta|tipo-arete|fa-wand-sparkles|fa-circle-dot|fa-eye|fa-hand-fist|fa-user-check|fa-dice"|fa-signal/);
assert.match(css, /\.m6-tiro-colonne\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/s, "due colonne, Riserva e Soglia");
assert.match(css, /\.m6-tiro-tasti\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/s, "i tre tasti del tipo in fila");
assert.match(css, /\.m6-tiro-opzioni\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\);/s, "l'esito a sinistra, la Dissonanza al centro, gli interruttori a destra");
assert.doesNotMatch(tiroTemplate, /tiroPaga|data-pay=|Costo\.PagaCon/, "«paga con» è uscito dal riquadro: lanciare non costa");
assert.doesNotMatch(css, /m6-tiro-paga-tasto\.quintessenza/, "la coppia Quintessenza | Paradosso non c'è più");
assert.match(css, /\.m6-tiro-paga-tasto\s*\{[^}]*border-radius: 12px;/s, "la Dissonanza è una pastiglia sola");
assert.match(css, /\.m6-tiro-paga-tasto\.paradosso\.acceso\s*\{[^}]*background: var\(--mage-rosso\);/s, "la Dissonanza accesa è del rosso del Paradosso");
assert.match(css, /\.m6-tiro-voce\.spenta > \.m6-tiro-voce-nome,[\s\S]*color: var\(--mage-tenue\);/, "l'Ambito a zero è spento");
assert.match(css, /\.m6-tiro-chip > \.m6-sfera-sigillo\s*\{/, "il sigillo della Sfera in testa sta sul disco d'oro, come nel riquadro della Magick");
assert.match(sheetSource, /tiroDadi: onTiroDadi/);
assert.match(stat("grimorio.hbs"), /data-action="grimorioClose"/);
// Le Risorse a righe (Blue, 20/9): Salute e Saggezza col tastino che apre il
// ventaglio (lo stesso cassettoToggle degli Ambiti, solo col clic), poi
// Quintessenza e Paradosso col meno e il più ai lati del numero, la Ruota
// nuda, le Condizioni in fondo.
const risorseRiq = stat("stat-risorse.hbs");
assert.match(risorseRiq, /m6-risorse-righe[\s\S]*parts\/salute\.hbs[\s\S]*m6-riga-saggezza con-ventaglio[\s\S]*m6-ventaglio-tasto" data-action="ventaglioToggle"[\s\S]*m6-saggezza-track m6-bilancia[\s\S]*m6-bilancia-cella lato-\{\{cell\.lato\}\}[^"]*" data-action="wisdomCellChange" data-index="\{\{cell\.index\}\}"[\s\S]*m6-ventaglio m6-ventaglio-quattro[\s\S]*style="--voce: 3" data-action="wisdomAtto"[\s\S]*style="--voce: 2" data-action="wisdomRisplende"[\s\S]*style="--voce: 0" data-action="wisdomAncora"[\s\S]*style="--voce: 1" data-action="wisdomReset"[\s\S]*m6-riga-conto quintessence[\s\S]*data-resource="quintessence" data-delta="-1"[\s\S]*magickTrack\.quintessence[\s\S]*data-resource="quintessence" data-delta="1"[\s\S]*m6-riga-conto paradox[\s\S]*data-action="paradoxBurst"[\s\S]*data-resource="paradox" data-delta="-1"[\s\S]*magickTrack\.paradox[\s\S]*data-resource="paradox" data-delta="1"[\s\S]*parts\/stat-ruota\.hbs[\s\S]*parts\/stat-condizioni\.hbs/);
assert.doesNotMatch(risorseRiq, /m6-saggezza-tendina|parts\/wisdom\.hbs|squareCounterChange|resource-counter-step|m6-inchiostro|wisdomSegna|wisdomCura|wisdomResourceChange/);
// La ruota della Salute (23/9): il meno a sinistra (0), il più a destra (3), Riposo e Relax sopra (5, 4), Danni e Reset sotto (1, 2).
const saluteRiga = stat("salute.hbs");
for (const [voce, action] of [["5", 'data-action="saluteRiposo"'], ["4", 'data-action="saluteRelax"'], ["2", 'data-action="saluteReset"'], ["1", 'data-action="saluteDanni"'], ["0", 'data-action="saluteExtraChange" data-delta="-1"'], ["3", 'data-action="saluteExtraChange" data-delta="1"']]) {
  assert.ok(saluteRiga.includes(`style="--voce: ${voce}" ${action}`), `ruota della Salute: ${action} al posto ${voce}`);
}
assert.doesNotMatch(stat("stat-ruota.hbs"), /m6-magick-end/);
// La Ruota dentro le Risorse: il mezzo cerchio vero senza tasti né conti né
// etichetta, i Dettagli della Ruota chiusi e centrati.
const risorse = stat("stat-ruota.hbs");
assert.match(risorse, /A150 150 0 0 1[\s\S]*preserveAspectRatio="xMidYMid meet"|preserveAspectRatio="xMidYMid meet"[\s\S]*A150 150 0 0 1/);
assert.match(risorse, /m6-magick-track-stat[\s\S]*m6-magick-node/);
assert.doesNotMatch(risorse, /m6-ruota-tasto|m6-ruota-conti|m6-ruota-conto|m6-riq-occhiello|magickBalanceChange/);
assert.doesNotMatch(css, /\.m6-magick-track-stat \.m6-ruota-tasto/);
assert.match(css, /\.m6-ruota-dettagli > summary \{\s*text-align: center;/);
assert.match(risorse, /<details class="m6-ruota-dettagli">[\s\S]*generatedQuintessence[\s\S]*permanentParadox[\s\S]*data-action="contraccolpoNega"[\s\S]*data-action="wheelModeToggle"/);
// La ruota dei comandi (20/9 sera): la sorgente nella riga non si vede mai,
// niente :hover; il resto sta in tests/ventaglio.test.js.
assert.match(css, /\.m6-ventaglio \{\s*display: none;/);
assert.doesNotMatch(css, /con-ventaglio[^{]*:hover[^{]*\.m6-ventaglio/);
assert.match(sheetSource, /ventaglioToggle: onVentaglioToggle/);
assert.match(sheetSource, /function onCassettoToggle\(event, target\) \{[\s\S]*?closest\?\.\("\.m6-riga\.con-tendina, \.m6-riga\.con-cassetto"\)/);
assert.doesNotMatch(risorse, /data-action="areteRoll"|m6-header-arete/);
// Magick: le Sfere col cassetto dei poteri, gli Ambiti con la lettura e il cassetto dei livelli.
const magickRiq = stat("stat-magick.hbs");
// La Sfera (20/9 sera, cambio di direttiva): niente pallini; il sigillo, il conto
// dei poteri conosciuti, il nome, il tasto del potere che apre la tendina a
// caselle (un potere per riga, la casella spuntata su quello scelto).
assert.match(magickRiq, /m6-riga-sfera[^"]*\{\{#if sphere\.poteri\.length\}\} con-tendina[\s\S]*m6-sfera-sigillo[\s\S]*m6-sfera-conto[^>]*>\{\{sphere\.poteri\.length\}\}<\/b>[\s\S]*m6-riga-nome" data-action="tiroSphere"[\s\S]*m6-sfera-potere\{\{#if sphere\.potere\}\} pieno\{\{\/if\}\}" data-action="cassettoToggle"[\s\S]*\{\{sphere\.potere\.short\}\}[\s\S]*Stat\.PotereScegli[\s\S]*m6-cassetto m6-cassetto-poteri[\s\S]*m6-potere-voce\{\{#if power\.selected\}\} scelta[\s\S]*role="checkbox" aria-checked="\{\{power\.selected\}\}" data-action="tiroPower" data-power="\{\{power\.id\}\}"[\s\S]*m6-casella\{\{#if power\.selected\}\} spuntata[\s\S]*\{\{power\.label\}\}/);
assert.doesNotMatch(magickRiq, /resource-value-step|dotCounterChange|m6-pastiglia-potere/);
// L'Ambito (20/9 sera): il nome col chevron se ha più letture (il clic apre la
// tendina delle letture, una pastiglia per lettura), i sette pallini in fondo
// alla testa quando la lettura è scelta (il sorvolo dice livello e lettura),
// sotto la lettura del livello scelto, centrata, con la lettura dell'Ambito in piccolo.
// La riga dell'Ambito (21/9): il nome (tendina delle letture se ne ha più d'una), i sette pallini SEMPRE
// (col tooltip del livello e, se la lettura è scelta, della lettura), la lettura sotto solo se c'è.
assert.match(magickRiq, /m6-riga-ambito\{\{#if scope\.base\}\} base\{\{\/if\}\}\{\{#if scope\.multi\}\} con-tendina\{\{\/if\}\}\{\{#if scope\.declared\}\} scelta[\s\S]*m6-riga-testa[\s\S]*\{\{#if scope\.multi\}\}[\s\S]*m6-riga-nome m6-riga-nome-ambito\{\{#if scope\.modeChosen\}\} con-lente\{\{\/if\}\}" data-action="cassettoToggle"[\s\S]*\{\{else\}\}[\s\S]*m6-riga-nome-fermo[\s\S]*\{\{\/if\}\}\s*<span class="m6-ambito-pallini"[\s\S]*m6-pallino-ambito\{\{#if step\.lit\}\} lit\{\{\/if\}\}" data-action="tiroScope" data-scope="\{\{scope\.id\}\}" data-level="\{\{step\.value\}\}" data-tooltip="\{\{step\.tip\}\}" data-tooltip-class="m6-tooltip-righe"[\s\S]*m6-cassetto m6-cassetto-modi[\s\S]*m6-pastiglia m6-pastiglia-modo\{\{#if mode\.selected\}\} scelta\{\{\/if\}\}" data-action="scopeMode" data-scope="\{\{scope\.id\}\}" data-mode="\{\{mode\.id\}\}"/);
assert.doesNotMatch(magickRiq, /m6-ambito-scegli|ScopeModeChoose/);
// La pastiglia della lente dentro il nome (23/9), col nome corto, al posto
// del chevron quando la lente è scelta; niente seconda linea.
assert.match(magickRiq, /m6-riga-nome-ambito\{\{#if scope\.modeChosen\}\} con-lente\{\{\/if\}\}" data-action="cassettoToggle"[^>]*><span>\{\{scope\.label\}\}<\/span>\{\{#if scope\.modeChosen\}\}<small class="m6-ambito-tag" title="\{\{scope\.modeLabel\}\}">\{\{scope\.modeShort\}\}<\/small>\{\{else\}\}<i class="fa-solid fa-chevron-down" aria-hidden="true"><\/i>\{\{\/if\}\}<\/button>/);
assert.doesNotMatch(magickRiq, /m6-ambito-lettura/);
assert.doesNotMatch(magickRiq, /m6-riga-modo|m6-cassetto-ambito|m6-livello|title="\{\{step\.reading\}\}"/);
assert.doesNotMatch(magickRiq, /riga-ambito con-cassetto/);
const sheetJs = readFileSync(new URL("../scripts/sheets/mage-actor-sheet.js", import.meta.url), "utf8");
assert.match(sheetJs, /scopeMode: onScopeMode,\n\s+cassettoToggle: onCassettoToggle/);
assert.match(sheetJs, /addEventListener\("pointerdown"[\s\S]*classList\.remove\("aperto"\)/);
assert.match(sheetJs, /modes: scopeModesOf\(this\)/);
assert.doesNotMatch(magickRiq, /m6-ambito-livello/);
// Via il pallino dello 0 (Blue, 2/10): sette pallini, i livelli; l'Epicità in cima, staccata.
assert.doesNotMatch(magickRiq, /m6-pallino-ambito zero|scope\.zero|Scopes\.Zero/);
assert.doesNotMatch(css, /\.m6-pallino-ambito\.zero|\.m6-arete-sphere-dot\.zero|nemico-liv > button\.zero/);
assert.match(css, /\.m6-riga-ambito\.base \{\s*margin-bottom: 6px;/);
assert.match(css, /\.m6-tiro-voce\.base \{\s*margin-bottom: 4px;/);
assert.match(css, /\.m6-arete-dotrow\.base > \* \{\s*margin-bottom: 0\.4rem;/);
assert.match(css, /\.m6-nemico-ambito\.base \{\s*margin-bottom: 6px;/);
assert.match(css, /tr\.m6-scope-stacco > td \{[^}]*background: transparent;[^}]*height: 2px;/s);
// Il Grimorio dentro i Tratti a schede (23/9): le schede sono i filtri di specie in testa,
// gli incantesimi sono righe della stessa lista con data-kind="grimorio", il libro apre la pagina.
const trattiRiq = stat("stat-tratti.hbs");
assert.match(trattiRiq, /m6-riq-tratti" data-scheda="\{\{trattiScheda\}\}"[\s\S]*m6-riq-title m6-riq-schede[\s\S]*data-filters="tratti"[\s\S]*m6-filtro m6-scheda\{\{#if kind\.active\}\} active\{\{\/if\}\}" role="tab" data-kind="\{\{kind\.id\}\}"[\s\S]*data-filter="tratti"[\s\S]*data-action="tiroGrimorio"[\s\S]*data-list="tratti"[\s\S]*data-action="tiroTrait"[\s\S]*\{\{#each poteriFiltri as \|p\|\}\}[\s\S]*m6-riga-potere-filtro\{\{#if p\.chosen\}\} scelta\{\{\/if\}\}" data-action="tiroPower" data-power="\{\{p\.pick\}\}" data-sphere="\{\{p\.sphere\}\}" data-any="\{\{p\.any\}\}" data-kind="\{\{p\.kind\}\}" data-search="\{\{p\.search\}\}"[\s\S]*m6-riga-effetto[\s\S]*data-action="tiroIncantesimo" data-row="\{\{spell\.id\}\}" data-kind="grimorio"/);
// Niente righe di vuoto in corsivo (Blue, 25/9).
assert.doesNotMatch(trattiRiq, /m6-tratti-vuoto|m6-riq-vuoto/);
assert.doesNotMatch(trattiRiq, /data-kind=""|Stat\.Tutti|data-list="incantesimi"/);
assert.match(sheetJs, /SCHEDE_TRATTI = Object\.freeze\(\["tratti", "equipment", "attivi", "passivi", "other", "grimorio"\]\)/);
assert.match(sheetJs, /context\.trattiScheda = schedaTratti\(this\._filters\?\.tratti\)/);
assert.match(sheetJs, /box\.dataset\.scheda = kind/);
// Le Abilità: il tasto accanto al + le mette tutte in fila.
const abilitaTemplate = stat("stat-abilita.hbs");
assert.match(abilitaTemplate, /data-action="skillsFlatToggle"[\s\S]*data-action="customSkillAdd"/);
assert.match(abilitaTemplate, /\{\{#if group\.label\}\}<span class="m6-riq-occhiello">/);
// Le Specializzazioni stanno in riga sotto l'Abilità (Blue, 26/9: via la finestra e la tendina): la riga è
// `con-specializzazioni` e va a capo, sotto le pastiglie e la casella che ne scrive una; niente tendina.
// La freccetta in fondo (26/9 sera) apre e chiude la riga (`aperta`), che nasce aperta con la Specializzazione nel Tiro.
assert.match(abilitaTemplate, /m6-riga-abilita\{\{#if skill\.chosen\}\} scelta\{\{\/if\}\}\{\{#if skill\.spec\.slots\}\} con-specializzazioni\{\{#if skill\.spec\.chosen\}\} aperta\{\{\/if\}\}\{\{\/if\}\}" data-skill="\{\{skill\.id\}\}">\s*<button type="button" class="m6-riga-nome" data-action="tiroSkill"[\s\S]*<button type="button" class="m6-abilita-apri\{\{#if skill\.spec\.scritte\.length\}\} piena\{\{\/if\}\}" data-action="specialtyToggle" aria-expanded="[\s\S]*<div class="m6-specializzazioni" role="group"[\s\S]*data-action="tiroSpecialty"[\s\S]*data-specialty-add="\{\{skill\.id\}\}"/);
assert.doesNotMatch(abilitaTemplate, /con-cassetto|con-tendina|cassettoToggle|m6-cassetto/);
// Le tendine delle righe si ricordano per chiave e il render le riapre (Blue, 25/9 sera: coi pallini «si chiudono da sole»).
for (const [file, key] of [["stat-magick.hbs", 'data-cassetto="sfera-{{sphere.id}}"'], ["stat-magick.hbs", 'data-cassetto="ambito-{{scope.id}}"'], ["strumento-riga.hbs", 'data-cassetto="strumento-{{row.id}}"']]) {
  assert.ok(readFileSync(new URL(`../templates/actor/parts/${file}`, import.meta.url), "utf8").includes(key), `${file}: ${key}`);
}
assert.match(sheetJs, /const aperte = \(this\._cassettiAperti \?\?= new Set\(\)\);[\s\S]*aperte\[open \? "add" : "delete"\]\(row\.dataset\.cassetto\)/);
assert.match(sheetJs, /function riapriCassetti\(sheet\)[\s\S]*row\.classList\.add\("aperto"\);\s*flipCassetto\(row\);/);
assert.match(sheetJs, /riapriPoteri\(this\);\s*riapriCassetti\(this\);/);
// Le Specializzazioni in riga (26/9): la scheda prepara la riga di ogni Abilità con `rigaSpecializzazioni`.
assert.match(sheetJs, /const spec = rigaSpecializzazioni\(skill\.id, skill\.value, specialtyNames\[skill\.id\] \?\? \[\], \{ chosen: tiro\.skill === key \? tiro\.specialty \?\? "" : "" \}\);/);
// La carta del potere in chat va a capo (Blue, 25/9: «mi esce tagliata»): colonna sola, non la griglia del tiro.
assert.match(css, /\.m6-roll-card\.m6-potere-chat \{\s*display: flex;\s*flex-direction: column;/);
assert.doesNotMatch(magickTemplate, /m6-scopes\b|m6-persistent-resources/);
// La pagina Magick (21/9, dal mock): a sinistra le Sfere e le Magick in atto,
// a destra i poteri conosciuti, in fondo la tendina della tavola degli Ambiti.
// Le Specialità delle Sfere, il selettore a cerchietti e la colonna Influenza non ci sono più.
assert.match(css, /\.m6-magick-layout\s*\{[^}]*"sinistra poteri"\s*"ambiti ambiti";[^}]*grid-template-columns: 440px minmax\(0, 1fr\);/s);
assert.match(css, /\.m6-magick-sinistra\s*\{[^}]*grid-area: sinistra;/s);
assert.match(css, /\.m6-riq-conosciuti\s*\{\s*grid-area: poteri;/);
assert.match(css, /\.m6-riq-ambiti-tavola\s*\{\s*grid-area: ambiti;/);
assert.match(css, /\.m6-riq\.m6-riq-pagina\s*\{[^}]*overflow: visible;/s);
assert.doesNotMatch(css, /m6-sphere-specialt|m6-sphere-selector|m6-sphere-choice|m6-sphere-influence|m6-spheres-panel|m6-ongoing-magick-grid|grid-area:\s*table;/);
assert.match(magickTemplate, /m6-magick-sinistra[\s\S]*m6-riq-sfere[\s\S]*m6-ongoing-magick[\s\S]*m6-riq-conosciuti[\s\S]*<details class="m6-riq m6-riq-pagina m6-riq-ambiti-tavola">[\s\S]*parts\/scope-table\.hbs/);
assert.doesNotMatch(magickTemplate, /SphereSpecialties|Spheres\.Influence|Spheres\.Selector|m6-sphere-choice/);
// La lista delle Sfere (Blue, 25/9 sera): come nella prima pagina, niente livelli. Il segno dell'accesso
// apre e chiude il Dominio, poi il sigillo, il conto dei poteri conosciuti, il nome, la casetta; le altre spente.
assert.match(magickTemplate, /m6-riga m6-riga-sfera-pagina\{\{#if sphere\.family\}\} family\{\{\/if\}\}">\s*<button type="button" class="m6-sfera-accesso acceso" data-action="sphereSelectionChange" data-sphere="\{\{sphere\.id\}\}" data-selected="true" title="\{\{localize 'M6\.Poteri\.DominioChiudi'\}\}"[^>]*><img class="m6-riga-icona m6-sfera-sigillo"[\s\S]*?m6-sfera-conto\{\{#unless sphere\.conto\}\} vuoto\{\{\/unless\}\}"[\s\S]*?m6-riga-nome m6-riga-nome-fermo[\s\S]*?m6-sfera-casa\{\{#if sphere\.family\}\} on\{\{\/if\}\}" data-action="familySphereToggle"[\s\S]*Poteri\.AltreSfere[\s\S]*m6-riga-sfera-pagina spenta">\s*<button type="button" class="m6-sfera-accesso" data-action="sphereSelectionChange" data-sphere="\{\{sphere\.id\}\}" data-selected="false" title="\{\{localize 'M6\.Poteri\.DominioApri'\}\}"[^>]*><img class="m6-riga-icona m6-sfera-sigillo"/, "il sigillo è il tasto (Blue, 25/9 sera)");
assert.doesNotMatch(magickTemplate, /fa-circle-check|fa-circle"/);
assert.doesNotMatch(magickTemplate, /sphereDotChange|resource-value-step|m6-sfera-prendi/);
assert.doesNotMatch(readFileSync(new URL("../scripts/sheets/mage-actor-sheet.js", import.meta.url), "utf8"), /sphereDotChange/);
// I poteri conosciuti (24/9 sera): una lista sola, senza la divisione per Sfere; in testa il conto, il
// Catalogo completo e Aggiungi (la finestra con le pastiglie delle Sfere); la riga del potere a colonne
// (sigillo della Sfera, pallino, nome, le pastiglie del tipo, Amalgama, costo, la freccia che è un tasto),
// Catalogo completo e Aggiungi (la finestra con le pastiglie delle Sfere); la riga del potere a colonne fisse (27/9:
// sigillo della Sfera, grado, nome, le pastiglie del tipo, Amalgama, usi, costo, Usa, la freccia che è un tasto), le quattro
// parti che si aprono (Grado, Prerequisiti, Effetto attivo, Effetto passivo), Modifica, Per tutti e Togli. Niente tendina sotto la Sfera, niente sezioni.
assert.match(magickTemplate, /m6-potere-riga\{\{#if p\.editing\}\} aperta modifica\{\{\/if\}\}" data-row="\{\{p\.id\}\}"[\s\S]*m6-potere-testa[\s\S]*m6-potere-sfera" src="\{\{p\.sphereIcon\}\}"[\s\S]*m6-potere-pallino[\s\S]*m6-potere-nome" data-action="potereApri"[\s\S]*m6-potere-tipi[\s\S]*m6-potere-tipo attivo[\s\S]*m6-potere-tipo passivo[\s\S]*m6-potere-amalgama[\s\S]*m6-potere-usi[\s\S]*m6-potere-costo[\s\S]*<button type="button" class="m6-potere-usa\{\{#unless p\.usa\.ok\}\} spento\{\{\/unless\}\}\{\{#unless p\.tipi\.attivo\}\} mostra\{\{\/unless\}\}" data-action="potereUsa" data-row="\{\{p\.id\}\}"[\s\S]*Poteri\.Mostra[\s\S]*<button type="button" class="m6-potere-chevron" data-action="potereApri"[\s\S]*m6-potere-spiega[\s\S]*name="flags\.m6\.poteri\.\{\{p\.id\}\}\.name"[\s\S]*name="flags\.m6\.poteri\.\{\{p\.id\}\}\.dot" data-dtype="Number"[\s\S]*\.type"[\s\S]*\.cost"[\s\S]*\.prerequisitiTesto"[\s\S]*\.attivo"[\s\S]*\.passivo"[\s\S]*\.amalgam"[\s\S]*\.amalgamText"[\s\S]*\.flavor"[\s\S]*m6-potere-parti[\s\S]*m6-potere-blocco prerequisiti[\s\S]*Poteri\.Prerequisiti[\s\S]*m6-potere-blocco attivo[\s\S]*Poteri\.EffettoAttivo[\s\S]*\{\{#each p\.parti\.attivo\.voci as \|v\|\}\}[\s\S]*<b>\{\{v\.chiave\}\}:<\/b>[\s\S]*m6-potere-blocco passivo[\s\S]*Poteri\.EffettoPassivo[\s\S]*m6-potere-fondo[\s\S]*data-action="potereModifica" data-row="\{\{p\.id\}\}"[\s\S]*data-action="potereModificaBase" data-row="\{\{p\.id\}\}"[\s\S]*data-action="potereTogli" data-row="\{\{p\.id\}\}"/, "la riga del potere a colonne (27/9), le quattro parti aperte, Modifica, Per tutti, Togli");
// «Usa» sta nella testa, non nel fondo (Blue, 25/9: senza aprire la tendina); il testo è a blocchi, non un paragrafo solo.
assert.doesNotMatch(magickTemplate, /m6-potere-fondo">\s*\{\{!--[\s\S]*?--\}\}\s*<button type="button" class="m6-potere-usa/);
assert.doesNotMatch(magickTemplate, /<p class="m6-potere-testo"><span class="m6-potere-k">\{\{localize "M6\.Poteri\.CosaFa"\}\}<\/span>\{\{#if p\.text\}\}/);
assert.match(css, /\.m6-potere-testa\s*\{[^}]*display: grid;[^}]*grid-template-columns: 22px 20px minmax\(0, 1fr\) 140px 22px 84px 58px 64px 18px;/s);
assert.match(css, /\.m6-potere-riga\.aperta > \.m6-potere-spiega\s*\{\s*display: flex;/);
const sheetPoteri = readFileSync(new URL("../scripts/sheets/mage-actor-sheet.js", import.meta.url), "utf8");
assert.match(sheetPoteri, /potereNuovo: onPotereNuovo,\n\s+potereDaCatalogo: onPotereDaCatalogo,\n[\s\S]{0,160}potereCatalogo: onPotereCatalogo,\n\s+potereCatalogoCompleto: onPotereCatalogoCompleto,\n\s+potereModifica: onPotereModifica,\n\s+potereModificaBase: onPotereModificaBase,\n\s+potereTogli: onPotereTogli,\n\s+potereApri: onPotereApri,/);
assert.match(sheetPoteri, /Object\.assign\(context, preparePoteriPagina\(actor, this, \{/);
assert.doesNotMatch(sheetPoteri, /prepareSphereSpecialties|loadSpherePowers/);

// La sidebar (6/9): 64px, icona centrata e sotto il nome corto della pagina;
// le pagine si scostano di altrettanto.
assert.match(
  css,
  /\.m6-tabs\s+\.sheet-tabs\s*\{[^}]*width:\s*64px;/s
);
assert.match(
  css,
  /\.sheet-tabs\s*>\s*\[data-tab\][^{]*\{[^}]*border:\s*0;[^}]*flex-direction:\s*column;[^}]*height:\s*58px;[^}]*width:\s*64px;/s
);
assert.match(css, /\.window-content \.tab \{\s*margin-left:\s*62px;/);
assert.match(css, /\.m6-tab-label \{[^}]*text-transform:\s*uppercase;/s);
assert.match(tabNavigation, /<span class="m6-tab-label">\{\{localize tab\.short\}\}<\/span>/);
assert.doesNotMatch(tabNavigation, /class="navlabel"/);
const sheetTabs = readFileSync(new URL("../scripts/sheets/mage-actor-sheet.js", import.meta.url), "utf8");
assert.equal((sheetTabs.match(/short: "M6\.Tabs\.Short\./g) ?? []).length, 9);
const itShort = JSON.parse(readFileSync(new URL("../lang/it.json", import.meta.url), "utf8")).M6.Tabs.Short;
// Le pagine a gruppi (6/9): chi sei | la Magick | la storia, con un
// divisorio davanti a Magick e a Bussola; accesa SOLO la pagina in cui sei.
assert.deepEqual(Object.values(itShort), ["Stat", "Tratti", "Magick", "Formule", "Credo", "Bussola", "Sfida", "Exp", "Note"]);
assert.match(sheetTabs, /stats: \{[\s\S]*?dotazione: \{[\s\S]*?magick: \{\s*id: "magick",\s*groupStart: true,[\s\S]*?grimorio: \{[\s\S]*?focus: \{[\s\S]*?personaggio: \{\s*id: "personaggio",\s*groupStart: true,[\s\S]*?conceptChallenge: \{[\s\S]*?esperienza: \{[\s\S]*?note: \{/);
assert.match(tabNavigation, /\{\{#if tab\.groupStart\}\}<hr class="m6-tabs-divider"/);
assert.match(css, /\.m6-tabs-divider \{[^}]*border-top: 1px solid var\(--mage-oro-scuro\);/s);
assert.doesNotMatch(css, /:is\(\[data-tab="magick"\], \[data-tab="focus"\], \[data-tab="conceptChallenge"\]\) \.navicon \{/);
assert.match(css, /\.sheet-tabs > \[data-tab\] \.navicon,\s*\.m6\.m6w\.actor\.sheet \.sheet-tabs \.lock-btn \{[^}]*background-color: var\(--mage-incavo\);/s);
// Gli Attributi e le Abilità nei loro riquadri (16/9): per famiglia, il nome
// è il tasto che li mette nel tiro, i pallini restano quelli della scheda.
const attributi = stat("stat-attributi.hbs");
const abilita = stat("stat-abilita.hbs");
assert.match(attributi, /attributeGroups[\s\S]*data-action="tiroAttribute" data-attribute="\{\{attribute\.id\}\}"[\s\S]*data-action="dotCounterChange"/);
assert.match(abilita, /skillGroups[\s\S]*data-action="tiroSkill" data-key="\{\{skill\.key\}\}"[\s\S]*data-action="essentialSkillDotChange"[\s\S]*m6-specializzazioni[\s\S]*data-action="tiroSpecialty"[\s\S]*data-specialty-add="\{\{skill\.id\}\}"/);
assert.match(attributi, /m6-riga-icona[\s\S]*attribute\.icon/);
assert.match(abilita, /m6-riga-icona[\s\S]*skill\.icon/);
assert.doesNotMatch(readFileSync(new URL("../scripts/sheets/mage-actor-sheet.js", import.meta.url), "utf8"), /traitsLayoutToggle|traitsOrderToggle|parts\/tratti\.hbs|parts\/ruota\.hbs/);
// I nodi della Ruota sono 26 px.
assert.match(css, /\.m6-magick-node \{[^}]*height: 26px;[^}]*width: 26px;/s);
assert.match(css, /\.m6-magick-track-compact \.m6-magick-node \{[^}]*height: 26px;[^}]*width: 26px;/s);
assert.ok(Object.values(itShort).every((label) => label.length <= 7), "nomi corti entro sette lettere");

// La Ruota ad arco accende i nodi con i token della palette, non con
// variabili definite in un contenitore che non esiste più.
assert.match(
  css,
  /\.m6-magick-node\.quintessence\s*\{[^}]*background:\s*var\(--mage-oro\);/s
);
assert.match(
  css,
  /\.m6-magick-node\.paradox\s*\{[^}]*background:\s*var\(--mage-rosso\);/s
);
assert.doesNotMatch(css, /var\(--quintessence-color\)|var\(--paradox-color\)/);

// I pallini di Arete respirano rispetto alla parola cliccabile.
assert.match(
  css,
  /\.m6-header-arete > \.m6-arete-dots\s*\{[^}]*margin-left:/s
);

// Il dialogo del tiro di Arete segue il mockup: una riga per Sfera con
// tendina Ambito e campo N.S., e la Tipologia con le spiegazioni in corsivo.
const areteDialog = readFileSync(
  new URL("../templates/dialogs/arete-roll.hbs", import.meta.url),
  "utf8"
);
// Due colonne (6/9): a sinistra nome, Obiettivo, Effetto e i pallini di
// Sfere e Ambiti (un campo nascosto per riga, la Specialità segnata sulla
// Sfera che ce l'ha); a destra la riserva, la narrativa, il premio e la
// Tipologia.
// L'ordine di Blue (10/9 notte): Obiettivo, Effetto | Sfere | Ambiti; tratti | Tipologia Effetto | Altro.
// Armonia e «Paga con» sono usciti col tiro della finestra: si lancia dal riquadro del Tiro (il Sistema).
assert.match(areteDialog, /m6-arete-layout[\s\S]*m6-arete-dots-column[\s\S]*name="spellName"[\s\S]*name="goal"[\s\S]*name="effectKind"[\s\S]*<hr class="m6-arete-rule">[\s\S]*data-kind="sphere"[\s\S]*name="sphere-\{\{sphere\.id\}\}"[\s\S]*m6-arete-sphere-dot[\s\S]*<hr class="m6-arete-rule">[\s\S]*data-kind="scope"[\s\S]*name="scope-\{\{scope\.id\}\}"[\s\S]*m6-arete-side[\s\S]*name="attributeTrait"[\s\S]*name="narrative"[\s\S]*<hr class="m6-arete-rule">[\s\S]*m6-arete-types[\s\S]*Arete\.MagickTypeHead[\s\S]*<hr class="m6-arete-rule">[\s\S]*Arete\.Other[\s\S]*name="maintained"[\s\S]*name="prize"/);
assert.match(css, /\.m6-arete-layout\s*\{[^}]*grid-template-columns: minmax\(250px, 1\.1fr\) minmax\(230px, 0\.9fr\);/s);
// Nel Grimorio degli effetti la testata di ogni Sfera è il nome al centro,
// senza simbolo: il simbolo sta nei tasti in cima (verdetto di Blue, 7/9).
assert.match(css, /\.m6-grimorio-sphere > summary > h3\s*\{[^}]*text-align: center;/s);
assert.doesNotMatch(readFileSync(new URL("../templates/dialogs/grimorio.hbs", import.meta.url), "utf8"), /<h3><img src="\{\{group\.icon\}\}"/);
// Le file a pallini non portano più la classe della vecchia riga flex.
assert.doesNotMatch(areteDialog, /m6-arete-dotrow m6-arete-sphere"/);
assert.doesNotMatch(areteDialog, /data-specialty|specialtyScope/, "la Specialità dell'Ambito è uscita (il Sistema)");
assert.doesNotMatch(areteDialog, /scopeRowTemplate|data-role="scopeAdd"|m6-arete-sphere-box|ScopeSuccesses/);
// La riserva (11/9): Attributo, Abilità e la Specializzazione come casella (+1);
// la seconda Abilità non c'è più; l'Areté non tira, entra come premio (anche per l'Ibrida, 2/10).
assert.match(areteDialog, /RollSelection\.Attribute"[\s\S]*name="attributeTrait"[\s\S]*RollSelection\.Ability"[\s\S]*name="primaryTrait"[\s\S]*Arete\.SkillSpecialty"[\s\S]*name="skillSpecialty"/);
assert.match(areteDialog, /data-role="scopeTableOpen"/);
assert.doesNotMatch(areteDialog, /name="primarySkill"|name="arete"|Arete\.Include/);
// Il conto: la riserva e la soglia, poi Altro (Effetto Mantenuto, Premio). Armonia, «Paga con» e Bussola
// sono usciti col tiro della finestra: li conta il riquadro del Tiro (il Sistema).
assert.match(areteDialog, /data-role="pool"[\s\S]*data-role="threshold"[\s\S]*m6-arete-altro"[\s\S]*name="maintained"[\s\S]*name="prize"[\s\S]*Arete\.Prize"/);
assert.doesNotMatch(areteDialog, /m6-arete-conto-numbers|bussolaHtml|name="pagaCon"/);
assert.doesNotMatch(areteDialog, /PrizeHybrid|prize\.allowed/);
// L'Armonia (i dadi degli altri Maghi) sta nel riquadro del Tiro, fra i dadi extra.
assert.doesNotMatch(areteDialog, /name="harmony"/);
// Le spiegazioni della Tipologia stanno nei titoli delle caselle (10/9): niente testo a destra.
assert.match(areteDialog, /m6-arete-type-grid[\s\S]*title="\{\{localize 'M6\.Arete\.CoincidentalHint'\}\}"[\s\S]*Arete\.Coincidental"[\s\S]*title="\{\{localize 'M6\.Arete\.VulgarHint'\}\}"[\s\S]*title="\{\{localize 'M6\.Arete\.WitnessesHint'\}\}"/);
assert.doesNotMatch(areteDialog, /<em>\{\{localize "M6\.Arete\.(Coincidental|Vulgar|Witnesses)Hint"\}\}<\/em>|Arete\.ThresholdShort|Arete\.HarmonyShort|Arete\.QuintessenceShort|carry\.traitLabels/);
// Una lettura alla volta accanto ai pallini degli Ambiti, col tasto che cambia (10/9).
assert.match(areteDialog, /data-role="dotReading"[^>]*><button type="button" class="m6-arete-reading-switch" data-role="readingSwitch"[^>]*>[\s\S]*?<\/button><span data-role="readingText"><\/span>/);
assert.doesNotMatch(areteDialog, /m6-arete-sphere-list|m6-arete-sphere-row\b/);
assert.match(css, /\.m6-arete-layout\s*\{[^}]*grid-template-columns:/s);
assert.match(css, /\.m6-arete-sphere-dot\.active\s*\{[^}]*var\(--mage-oro\)/s);
assert.match(css, /\.m6-arete-type-grid\s*\{[^}]*grid-template-columns:/s);
assert.match(css, /\.m6-arete-type-grid > em\s*\{[^}]*font-style: italic;/s);

console.log("Responsive Mage sheet layout tests passed.");

// L'Esperienza a due colonne (Blue, 25/9: «gli spazi sono molto sfasati»): a sinistra il conto, le prese e il
// listino; a destra le spese con le proposte. Sotto i 900 px tutto in colonna.
assert.match(css, /\.m6-esperienza-layout \{[^}]*grid-template-areas:\s*"conto spese"\s*"prese spese"\s*"listino spese";[^}]*grid-template-columns: minmax\(0, 0\.85fr\) minmax\(0, 1\.15fr\);/s);
console.log("Esperienza a due colonne: ok");
