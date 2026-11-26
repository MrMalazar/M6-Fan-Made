/**
 * Il passaggio dal modulo al sistema: i conti, senza Foundry.
 *
 * Ogni funzione prende i dati di un documento com'erano nel mondo del modulo
 * (l'oggetto che Foundry tiene in `_source`) e torna com'è lo stesso
 * documento nel sistema. Non scrive niente: chi scrive è esegui.js, che
 * confronta il prima e il dopo. Le scelte stanno nelle tavole di regole.js.
 *
 * Tutte le funzioni si possono ripetere: su un documento già passato tornano
 * gli stessi dati, così l'esame di un mondo a posto non trova niente da fare.
 */
import { iconaDelTipo } from "../base/icone-tipo.js";
import { definizioneDi } from "../condizioni.js";
import {
  ABILITA_ASSORBITE,
  BARRE,
  BARRE_NOSTRE,
  CHIAVI_DI_FOUNDRY,
  CLASSI_DADO,
  CLASSI_TIRO,
  DADI_DEL_MODULO,
  TIRO_SEMPLICE,
  DATI_SISTEMA,
  GERARCHIA,
  IMMAGINE_ATTORE,
  IMMAGINE_OGGETTO,
  IMMAGINI_VECCHIE,
  NOMI_SFERE,
  NUOVO,
  REGISTRO,
  RESTO,
  TESTI,
  TIPI_ATTORE,
  TIPI_OGGETTO,
  TIPO_TRATTO,
  VECCHIO_MODULO,
  VECCHIO_SISTEMA
} from "./regole.js";

/* ------------------------------------------------------------ gli attrezzi */

/** Un oggetto semplice, o uno vuoto. */
export function oggetto(valore) {
  return valore && typeof valore === "object" && !Array.isArray(valore) ? valore : {};
}

/** Una copia staccata di un dato fatto di sole parole, numeri, liste e oggetti. */
export function copia(valore) {
  return valore === undefined ? undefined : JSON.parse(JSON.stringify(valore));
}

/** Un intero dentro due argini. */
export function intero(valore, minimo = 0, massimo = Number.MAX_SAFE_INTEGER) {
  return Math.min(Math.max(Math.trunc(Number(valore) || 0), minimo), massimo);
}

/** Due dati uguali, guardati fino in fondo; l'ordine delle chiavi non conta. */
export function uguali(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((voce, indice) => uguali(voce, b[indice]));
  const chiaviA = Object.keys(a);
  const chiaviB = Object.keys(b);
  return chiaviA.length === chiaviB.length && chiaviA.every((chiave) => Object.hasOwn(b, chiave) && uguali(a[chiave], b[chiave]));
}

/** `sopra` messo su `sotto`, voce per voce: dove tutti e due hanno un oggetto si scende, altrimenti vince `sopra`. */
export function unisci(sotto, sopra) {
  if (sopra === undefined) return copia(sotto);
  if (!sotto || typeof sotto !== "object" || Array.isArray(sotto) || !sopra || typeof sopra !== "object" || Array.isArray(sopra)) return copia(sopra);
  const esito = copia(sotto);
  for (const [chiave, valore] of Object.entries(sopra)) esito[chiave] = unisci(esito[chiave], valore);
  return esito;
}

/** Il testo di un pezzo di pagina, senza i tag. */
export function senzaTag(html) {
  return String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Una parola messa dentro una pagina senza che diventi pagina. */
export function protetta(testo) {
  return String(testo ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Un dato senza i vuoti: via le parole vuote, gli zeri, i no, le liste e gli
 * oggetti rimasti senza niente. Torna `undefined` se non resta nulla.
 */
export function pota(valore) {
  if (valore === null || valore === undefined) return undefined;
  if (typeof valore === "string") return senzaTag(valore) ? valore : undefined;
  if (typeof valore === "number") return Number.isFinite(valore) && valore !== 0 ? valore : undefined;
  if (typeof valore === "boolean") return valore || undefined;
  if (Array.isArray(valore)) {
    const lista = valore.map(pota).filter((voce) => voce !== undefined);
    return lista.length ? lista : undefined;
  }
  if (typeof valore === "object") {
    const voci = Object.entries(valore).map(([chiave, voce]) => [chiave, pota(voce)]).filter(([, voce]) => voce !== undefined);
    return voci.length ? Object.fromEntries(voci) : undefined;
  }
  return undefined;
}

/* ------------------------------------------------------------------ i testi */

/** Un testo salvato, con le parole del modulo girate in quelle del sistema. */
export function convertiTesto(testo) {
  if (typeof testo !== "string" || !testo.includes(VECCHIO_MODULO) && !testo.includes("WOD5E_MAGE.")) return testo;
  let esito = testo;
  for (const regola of TESTI) esito = esito.replace(regola.cerca, regola.metti);
  return esito;
}

/** Ogni parola dentro un dato, fino in fondo. Le chiavi non si toccano. */
export function convertiParole(valore) {
  if (typeof valore === "string") return convertiTesto(valore);
  if (Array.isArray(valore)) return valore.map(convertiParole);
  if (valore && typeof valore === "object") return Object.fromEntries(Object.entries(valore).map(([chiave, voce]) => [chiave, convertiParole(voce)]));
  return valore;
}

/** Il percorso di un'immagine: quelle del vecchio sistema non ci sono più e prendono il ripiego. */
export function convertiImmagine(percorso, ripiego) {
  if (typeof percorso !== "string" || !percorso) return percorso;
  if (IMMAGINI_VECCHIE.test(percorso)) return ripiego;
  return convertiTesto(percorso);
}

/**
 * Le bandiere di un documento. Quelle del modulo passano sotto il nome del
 * sistema (se il sistema ne ha già di sue, le sue vincono); quelle del
 * vecchio sistema cadono, perché non le legge più nessuno; la scheda scelta
 * a mano cade se era una scheda di prima, e il tipo nuovo apre la sua.
 */
export function convertiBandiere(bandiere) {
  const vecchie = oggetto(bandiere);
  const nuove = {};
  for (const [ambito, dati] of Object.entries(vecchie)) {
    if (ambito === VECCHIO_SISTEMA || ambito === VECCHIO_MODULO) continue;
    nuove[ambito] = convertiParole(dati);
  }
  if (Object.hasOwn(vecchie, VECCHIO_MODULO)) nuove[NUOVO] = unisci(convertiParole(vecchie[VECCHIO_MODULO]), nuove[NUOVO]);
  const scheda = vecchie.core?.sheetClass;
  if (typeof scheda === "string" && scheda.startsWith(VECCHIO_SISTEMA) && nuove.core) {
    nuove.core = { ...nuove.core };
    delete nuove.core.sheetClass;
  }
  return nuove;
}

/* ----------------------------------------------------- un documento qualunque */

/**
 * Un documento senza regole sue (un diario, una macro, una tavola, una
 * cartella, un utente, una scena): le bandiere e le parole, sue e dei
 * documenti che ha dentro. `nome` è il nome del documento per Foundry.
 */
export function convertiGenerico(nome, fonte) {
  if (!fonte || typeof fonte !== "object") return fonte;
  const dentro = GERARCHIA[nome] ?? {};
  const esito = {};
  for (const [chiave, valore] of Object.entries(fonte)) {
    if (CHIAVI_DI_FOUNDRY.includes(chiave)) esito[chiave] = valore;
    else if (chiave === "flags") esito.flags = convertiBandiere(valore);
    else if (dentro[chiave]?.uno) esito[chiave] = valore ? convertiGenerico(dentro[chiave].uno, valore) : valore;
    else if (dentro[chiave] && Array.isArray(valore)) esito[chiave] = valore.map((voce) => convertiGenerico(dentro[chiave], voce));
    else esito[chiave] = convertiParole(valore);
  }
  return esito;
}

/* ----------------------------------------------------------------- gli oggetti */

/** I dadi in meno scritti a mano su un oggetto: quelli che dal 26/11 pesano sul tiro. */
export function dadiInMeno(fonte) {
  return (Array.isArray(fonte?.system?.bonuses) ? fonte.system.bonuses : [])
    .map((voce) => ({ dadi: Math.trunc(Number(voce?.value) || 0), tiri: Array.isArray(voce?.paths) ? voce.paths.map(String) : [] }))
    .filter((voce) => voce.dadi < 0);
}

/** Quello che resta scritto nel registro di un oggetto che non passa. */
export function schedina(fonte) {
  return pota({ _id: fonte?._id, name: fonte?.name, type: fonte?.type, img: fonte?.img, system: convertiParole(fonte?.system) }) ?? {};
}

/**
 * Un oggetto. Torna `{ dati }` se il sistema ha il suo tipo: gli stessi dati
 * con bandiere, parole e immagine girate. Torna `{ dati: null, scarto }` se
 * il tipo nel sistema non c'è: `scarto` è la schedina per il registro.
 */
export function convertiOggetto(fonte) {
  if (!fonte || typeof fonte !== "object" || fonte._tombstone) return { dati: fonte };
  if (!TIPI_OGGETTO.includes(fonte.type)) return { dati: null, scarto: schedina(fonte) };
  const dati = convertiGenerico("Item", fonte);
  dati.img = convertiImmagine(fonte.img, iconaDelTipo(fonte.type, dati) ?? IMMAGINE_OGGETTO);
  return { dati };
}

/* ------------------------------------------------------------------ gli attori */

/** I dati `system` di un Mago, presi da quelli di prima. `parziale`: solo le voci che ci sono (il delta di un segnalino). */
export function sistemaMago(vecchio, { parziale = false } = {}) {
  const v = oggetto(vecchio);
  const tavola = DATI_SISTEMA.mago;
  const esito = {};
  const attributi = Object.fromEntries(tavola.attributi.filter((id) => v.attributes?.[id]?.value !== undefined).map((id) => [id, { value: intero(v.attributes[id].value) }]));
  if (Object.keys(attributi).length || !parziale) esito.attributes = attributi;
  const abilita = Object.fromEntries(tavola.abilita.filter((id) => v.skills?.[id] !== undefined).map((id) => [id, {
    value: intero(v.skills[id]?.value),
    bonuses: convertiParole(Array.isArray(v.skills[id]?.bonuses) ? v.skills[id].bonuses : [])
  }]));
  if (Object.keys(abilita).length || !parziale) esito.skills = abilita;
  const testate = Object.fromEntries(tavola.testate.filter((id) => typeof v.headers?.[id] === "string").map((id) => [id, convertiTesto(v.headers[id])]));
  if (Object.keys(testate).length || !parziale) esito.headers = testate;
  if (v.locked !== undefined || !parziale) esito.locked = Boolean(v.locked);
  const impostazioni = Object.fromEntries(tavola.impostazioni.filter((id) => v.settings?.[id] !== undefined).map((id) => [id, Boolean(v.settings[id])]));
  if (Object.keys(impostazioni).length) esito.settings = impostazioni;
  return esito;
}

/** I dati `system` di un PNG, presi da quelli di prima. */
export function sistemaPng(vecchio, { parziale = false } = {}) {
  const v = oggetto(vecchio);
  const tavola = DATI_SISTEMA.png;
  const esito = {};
  const riserve = Object.fromEntries(tavola.campi.filter((campo) => v.standarddicepools?.[campo]?.value !== undefined).map((campo) => [campo, { value: intero(v.standarddicepools[campo].value, 0, tavola.riservaMax) }]));
  if (Object.keys(riserve).length || !parziale) esito.standarddicepools = riserve;
  const casi = Object.fromEntries(tavola.abilita.filter((id) => v.exceptionaldicepools?.[id] !== undefined).map((id) => [id, {
    value: intero(v.exceptionaldicepools[id]?.value, 0, tavola.riservaMax),
    active: Boolean(v.exceptionaldicepools[id]?.active)
  }]));
  if (Object.keys(casi).length || !parziale) esito.exceptionaldicepools = casi;
  if (v.health?.max !== undefined || !parziale) esito.health = { max: intero(v.health?.max, 1, tavola.caselleMax) };
  const testate = Object.fromEntries(tavola.testate.filter((id) => typeof v.headers?.[id] === "string").map((id) => [id, convertiTesto(v.headers[id])]));
  if (Object.keys(testate).length || !parziale) esito.headers = testate;
  if (typeof v.biography === "string" || !parziale) esito.biography = convertiTesto(String(v.biography ?? ""));
  if (typeof v.spcType === "string" && v.spcType) esito.spcType = v.spcType;
  if (v.locked !== undefined || !parziale) esito.locked = Boolean(v.locked);
  return esito;
}

/** Le Abilità assorbite che su una scheda intera hanno pallini: da travasare a mano. */
export function abilitaAssorbite(vecchio) {
  return Object.entries(ABILITA_ASSORBITE)
    .map(([id, voce]) => ({ id, nome: voce.nome, pallini: intero(oggetto(vecchio).skills?.[id]?.value) }))
    .filter((voce) => voce.pallini > 0);
}

/** Le riserve eccezionali accese di un PNG sulle Abilità assorbite: diventano casi a dadi. */
export function riserveAssorbite(vecchio) {
  return Object.entries(ABILITA_ASSORBITE)
    .map(([id, voce]) => ({ id, nome: voce.nome, campo: voce.campo, dadi: intero(oggetto(vecchio).exceptionaldicepools?.[id]?.value), accesa: Boolean(oggetto(vecchio).exceptionaldicepools?.[id]?.active) }))
    .filter((voce) => voce.accesa && voce.dadi > 0);
}

/**
 * Quello che dei dati di prima non ha un posto sulla scheda nuova ed è roba
 * scritta a mano (le tavole di RESTO): finisce nel registro del passaggio.
 * `tipoPrima` è il tipo di wod5e, `tipoDopo` il nostro.
 */
export function restoDelSistema(vecchio, tipoPrima, tipoDopo) {
  const v = oggetto(vecchio);
  const resto = {};
  for (const chiave of RESTO.testi) {
    if (tipoDopo === "png" && chiave === "biography") continue;
    if (v[chiave] !== undefined) resto[chiave] = convertiParole(v[chiave]);
  }
  for (const chiave of [...RESTO.conti, ...(RESTO.perTipo[tipoPrima] ?? [])]) if (v[chiave] !== undefined) resto[chiave] = convertiParole(v[chiave]);
  for (const chiave of RESTO.danni) {
    const danni = pota({ superficial: v[chiave]?.superficial, aggravated: v[chiave]?.aggravated });
    if (danni) resto[chiave] = danni;
  }
  const testate = Object.fromEntries(Object.entries(oggetto(v.headers)).filter(([chiave]) => !DATI_SISTEMA[tipoDopo]?.testate.includes(chiave)));
  if (Object.keys(testate).length) resto.headers = convertiParole(testate);
  const assorbite = Object.fromEntries(Object.keys(ABILITA_ASSORBITE).filter((id) => v.skills?.[id] !== undefined).map((id) => [id, v.skills[id]]));
  if (Object.keys(assorbite).length) resto.skills = convertiParole(assorbite);
  if (tipoDopo === "png" && (v.attributes !== undefined || v.skills !== undefined)) {
    // Un PNG con anche Attributi e Abilità scritti: la scheda del nemico non li ha.
    resto.attributes = v.attributes;
    resto.skills = convertiParole(v.skills);
  }
  const riserve = Object.fromEntries(Object.keys(ABILITA_ASSORBITE).filter((id) => v.exceptionaldicepools?.[id] !== undefined).map((id) => [id, v.exceptionaldicepools[id]]));
  if (tipoDopo === "png" && Object.keys(riserve).length) resto.exceptionaldicepools = riserve;
  return pota(resto);
}

/** La Sfera che un nome scritto a mano indica, o "". */
export function sferaDalNome(nome) {
  const pulito = String(nome ?? "").trim().toLocaleLowerCase("it");
  if (!pulito) return "";
  for (const [id, nomi] of Object.entries(NOMI_SFERE)) if (nomi.some((voce) => voce.toLocaleLowerCase("it") === pulito)) return id;
  return "";
}

/** Il posto in fila della prossima riga di una tavola a righe (`{ id: { sort } }`). */
function prossimoPosto(tavola) {
  return Object.values(oggetto(tavola)).reduce((massimo, riga) => Math.max(massimo, Number(riga?.sort) || 0), 0) + 1;
}

/** La copia del delta nuovo che un segnalino tiene da parte finché il suo delta non è riscritto. */
function scortaDi(bandiere) {
  const scorta = bandiere?.[NUOVO]?.[REGISTRO]?.delta;
  return scorta && typeof scorta === "object" ? scorta : null;
}

/**
 * Un segnalino (quello di partenza di un attore, o uno su una scena): le
 * barre, l'immagine, le bandiere e, se non è legato alla scheda, quello che
 * porta di suo (il delta). `tipo` è il tipo nostro della scheda sotto: senza
 * una scheda nostra sotto il delta resta com'è, perché Foundry non lo apre.
 * Resta com'è anche il delta di un segnalino legato: Foundry lo tiene da
 * parte e non lo lascia ritoccare.
 *
 * Un delta con dentro qualcosa da togliere non si ritocca: Foundry 14 non sa
 * togliere dal delta un oggetto che non conosce, e finché c'è rifiuta ogni
 * altro ritocco a quel delta. Si rifà: il delta nuovo e pulito va prima al
 * sicuro nelle bandiere del segnalino (`flags.m6.passaggio.delta`), poi chi
 * esegue azzera il delta e lo riscrive dalla copia, e la copia sparisce.
 * `rifai` dice che il segnalino è in questo giro (e un rifacimento rimasto
 * a metà si riconosce dalla copia ancora lì).
 *
 * `soloPreparare`: non si converte niente, si mette solo al sicuro la copia.
 * Serve finché le schede non sono intere: Foundry accetta i ritocchi al
 * delta di un segnalino solo quando la scheda sotto non ha più oggetti che
 * non conosce, ma il delta va azzerato prima di toccare la scheda.
 */
export function convertiSegnalino(fonte, { tipo = "", tipoPrima = "", inCorso = false, soloPreparare = false } = {}) {
  if (!fonte || typeof fonte !== "object") return { dati: fonte, note: {}, rifai: false };
  let dati;
  if (soloPreparare) dati = { ...fonte };
  else {
    dati = convertiGenerico("Token", { ...fonte, delta: undefined });
    delete dati.delta;
    for (const barra of ["bar1", "bar2"]) {
      const attributo = fonte[barra]?.attribute;
      if (attributo === null || attributo === undefined) continue;
      if (BARRE[attributo]) dati[barra] = { ...fonte[barra], attribute: BARRE[attributo] };
      else if (!BARRE_NOSTRE.includes(attributo)) dati[barra] = { ...fonte[barra], attribute: null };
    }
    if (fonte.texture?.src !== undefined) dati.texture = { ...dati.texture, src: convertiImmagine(fonte.texture.src, IMMAGINE_ATTORE) };
  }
  if (!Object.hasOwn(fonte, "delta")) return { dati, note: {}, rifai: false };
  dati.delta = fonte.delta;
  // Un rifacimento già cominciato: la copia c'è. A schede non intere resta da fare solo se il delta vecchio è ancora lì.
  if (scortaDi(dati.flags) && !fonte.actorLink) return { dati, note: {}, rifai: !soloPreparare || Boolean(fonte.delta) };
  if (!tipo || fonte.actorLink || !fonte.delta || typeof fonte.delta !== "object") return { dati, note: {}, rifai: false };
  const esito = convertiDelta(fonte.delta, { tipo, tipoPrima, inCorso, togliSubito: true });
  if (esito.togli.length || TIPI_ATTORE[fonte.delta.type]) {
    const nostre = oggetto(dati.flags?.[NUOVO]);
    dati.flags = { ...oggetto(dati.flags), [NUOVO]: { ...nostre, [REGISTRO]: { ...oggetto(nostre[REGISTRO]), delta: esito.dati } } };
    return { dati, note: esito.note, rifai: true };
  }
  if (soloPreparare) return { dati, note: {}, rifai: false };
  dati.delta = esito.dati;
  return { dati, note: esito.note, rifai: false };
}

/**
 * Gli oggetti di una scheda (o del delta di un segnalino), uno per uno.
 * Torna quelli che restano girati, quelli da togliere, e che cosa è successo:
 * gli scarti (tipi che il sistema non ha), le Condizioni vecchie scritte a
 * mano tolte ai Maghi, i tratti dei PNG diventati casi.
 */
function passaOggetti(oggetti, { tipo, condizioniVecchie = false, casiPrima = {}, registroPrima = {} }) {
  const tenuti = [];
  const togli = [];
  const scarti = [];
  const condizioni = [];
  const casi = {};
  const domini = [];
  const giaScritti = new Set((Array.isArray(registroPrima.oggetti) ? registroPrima.oggetti : []).map((voce) => voce?._id));
  const giaTolte = new Set((Array.isArray(registroPrima.condizioni) ? registroPrima.condizioni : []).map((voce) => voce?._id));
  const segnati = new Set(Array.isArray(registroPrima.daTogliere) ? registroPrima.daTogliere : []);
  let posto = prossimoPosto(casiPrima);
  for (const fonte of Array.isArray(oggetti) ? oggetti : []) {
    if (!fonte || typeof fonte !== "object" || fonte._tombstone) {
      tenuti.push(fonte);
      continue;
    }
    const { dati, scarto } = convertiOggetto(fonte);
    if (!dati) {
      // Un tipo che il sistema non ha: si toglie, e resta scritto nel registro (una volta sola).
      togli.push(fonte._id);
      tenuti.push(fonte);
      if (giaScritti.has(fonte._id)) continue;
      scarti.push(scarto);
      if (tipo === "png" && fonte.type === TIPO_TRATTO) {
        const sfera = sferaDalNome(fonte.name);
        if (sfera) domini.push(sfera);
        else casi[`tratto_${fonte._id}`] = { nome: String(fonte.name ?? ""), campo: "", dadi: intero(fonte.system?.dice), skill: "", sort: posto++ };
      }
      continue;
    }
    // Le Condizioni vecchie scritte a mano (Blue, 26/11): coi dadi in meno comincerebbero a pesare sul tiro,
    // quindi al passaggio si tolgono dai Maghi e restano nel registro. Solo mentre il passaggio è in corso:
    // una Condizione scritta dopo non si tocca.
    const vecchiaAMano = tipo === "mago" && condizioniVecchie && dati.type === "condition" && !definizioneDi(dati) && dadiInMeno(dati).length > 0;
    if (vecchiaAMano || segnati.has(fonte._id)) {
      togli.push(fonte._id);
      tenuti.push(fonte);
      if (vecchiaAMano && !giaTolte.has(fonte._id)) condizioni.push(pota({ _id: fonte._id, name: fonte.name, dadi: dadiInMeno(dati), description: dati.system?.description }) ?? {});
      continue;
    }
    tenuti.push(dati);
  }
  return { tenuti, togli, scarti, condizioni, casi, domini };
}

/** Le bandiere del nemico con dentro i casi nati dai tratti e dalle riserve assorbite, e i Domini accesi. */
function nemicoColResto(bandiere, { casi = {}, domini = [], spcType = "" }) {
  if (!Object.keys(casi).length && !domini.length) return bandiere;
  const nemico = copia(oggetto(bandiere?.[NUOVO]?.nemico));
  if (Object.keys(casi).length) nemico.casi = { ...casi, ...oggetto(nemico.casi) };
  if (domini.length) {
    const magick = oggetto(nemico.magick);
    nemico.magick = { ...magick, on: true, domini: { ...Object.fromEntries(domini.map((id) => [id, true])), ...oggetto(magick.domini) } };
    if (!nemico.natura && (!spcType || spcType === "mortal")) nemico.natura = "risvegliato";
  }
  return { ...bandiere, [NUOVO]: { ...oggetto(bandiere?.[NUOVO]), nemico } };
}

/** Il registro del passaggio: quello che c'era già più quello di adesso. */
function registroNuovo(prima, adesso) {
  const p = oggetto(prima);
  const esito = { ...p };
  for (const chiave of ["da", "sistema", "quando", "resto"]) if (adesso[chiave] !== undefined && p[chiave] === undefined) esito[chiave] = adesso[chiave];
  for (const chiave of ["oggetti", "condizioni"]) {
    const lista = [...(Array.isArray(p[chiave]) ? p[chiave] : []), ...(adesso[chiave] ?? [])];
    if (lista.length) esito[chiave] = lista;
  }
  if (adesso.daTogliere?.length) esito.daTogliere = adesso.daTogliere;
  else delete esito.daTogliere;
  return esito;
}

/** Le bandiere con il registro del passaggio scritto dentro (o tolto, se è vuoto). */
function colRegistro(bandiere, registro) {
  const pieno = Object.keys(oggetto(registro)).length > 0;
  if (!pieno && !Object.hasOwn(oggetto(bandiere?.[NUOVO]), REGISTRO)) return bandiere;
  const nostre = { ...oggetto(bandiere?.[NUOVO]) };
  if (pieno) nostre[REGISTRO] = registro;
  else delete nostre[REGISTRO];
  return { ...bandiere, [NUOVO]: nostre };
}

/** Toglie da una lista di oggetti quelli segnati, e dal registro la lista di chi andava tolto. */
function tolti(dati, togli) {
  if (!togli.length) return dati;
  const via = new Set(togli);
  const esito = { ...dati, items: (dati.items ?? []).filter((voce) => !via.has(voce?._id)) };
  const registro = { ...oggetto(esito.flags?.[NUOVO]?.[REGISTRO]) };
  delete registro.daTogliere;
  esito.flags = colRegistro(esito.flags, registro);
  return esito;
}

/**
 * Quello che un segnalino non legato porta di suo. I dati `system` scritti
 * sul segnalino si scelgono come quelli della scheda, ma solo le voci che ci
 * sono; gli oggetti passano come quelli di una scheda.
 *
 * `tipo` è il tipo nostro della scheda sotto, `tipoPrima` quello che aveva
 * nel mondo del modulo (anche dopo: lo ricorda il suo registro).
 */
export function convertiDelta(fonte, { tipo = "", tipoPrima = "", inCorso = false, togliSubito = false } = {}) {
  const proprio = TIPI_ATTORE[fonte.type] ?? (fonte.type === "mago" || fonte.type === "png" ? fonte.type : "");
  const arrivo = proprio || tipo;
  const daPortare = Boolean(TIPI_ATTORE[fonte.type] ?? TIPI_ATTORE[tipoPrima]);
  let dati = convertiGenerico("ActorDelta", { ...fonte, items: undefined });
  delete dati.items;
  if (TIPI_ATTORE[fonte.type]) dati.type = TIPI_ATTORE[fonte.type];
  if (typeof fonte.img === "string") dati.img = convertiImmagine(fonte.img, IMMAGINE_ATTORE);
  const registroPrima = oggetto(dati.flags?.[NUOVO]?.[REGISTRO]);
  const adesso = {};
  if (fonte.system && typeof fonte.system === "object" && daPortare && (arrivo === "mago" || arrivo === "png")) {
    dati.system = arrivo === "png" ? sistemaPng(fonte.system, { parziale: true }) : sistemaMago(fonte.system, { parziale: true });
    adesso.resto = restoDelSistema(fonte.system, fonte.type ?? tipoPrima, arrivo);
  }
  const passati = passaOggetti(fonte.items, { tipo: arrivo, condizioniVecchie: daPortare && inCorso, casiPrima: dati.flags?.[NUOVO]?.nemico?.casi, registroPrima });
  if (Object.hasOwn(fonte, "items")) dati.items = passati.tenuti;
  if (arrivo === "png") dati.flags = nemicoColResto(dati.flags, { casi: passati.casi, domini: passati.domini, spcType: fonte.system?.spcType ?? "" });
  adesso.oggetti = passati.scarti;
  adesso.condizioni = passati.condizioni;
  adesso.daTogliere = passati.togli;
  dati.flags = colRegistro(dati.flags, registroNuovo(registroPrima, adesso));
  if (togliSubito) dati = tolti(dati, passati.togli);
  return { dati, togli: passati.togli, note: { scarti: passati.scarti, condizioni: passati.condizioni, casi: Object.values(passati.casi).map((caso) => caso.nome), domini: passati.domini } };
}

/**
 * Una scheda. Torna:
 *   dati      la scheda com'è nel sistema
 *   togli     gli id degli oggetti da togliere (tipi che il sistema non ha, Condizioni vecchie)
 *   lasciato  vero se il suo tipo il sistema non lo conosce e la scheda resta com'è
 *   note      che cosa è successo, per il rapporto
 *
 * `quando` è la data da scrivere nel registro. `inCorso` dice che il
 * passaggio sta avvenendo adesso: solo allora le Condizioni vecchie scritte
 * a mano si tolgono. `togliSubito`: la scheda torna già senza gli oggetti da
 * togliere; altrimenti restano dentro, segnati nel registro, e li toglie il
 * giro dopo (una scheda che Foundry non riesce ancora ad aprire si può
 * aggiornare ma non svuotare).
 */
export function convertiAttore(fonte, { quando = "", inCorso = true, togliSubito = false } = {}) {
  if (!fonte || typeof fonte !== "object") return { dati: fonte, togli: [], lasciato: false, note: {} };
  const tipoPrima = String(fonte.type ?? "");
  const nostro = tipoPrima === "mago" || tipoPrima === "png";
  const tipo = TIPI_ATTORE[tipoPrima] ?? (nostro ? tipoPrima : "");
  if (!tipo) return { dati: fonte, togli: [], lasciato: true, note: { da: tipoPrima } };
  const daPortare = !nostro;

  let dati = convertiGenerico("Actor", { ...fonte, items: undefined, prototypeToken: undefined });
  delete dati.items;
  delete dati.prototypeToken;
  dati.type = tipo;
  dati.img = convertiImmagine(fonte.img, IMMAGINE_ATTORE);
  const registroPrima = oggetto(dati.flags?.[NUOVO]?.[REGISTRO]);
  const origine = daPortare ? tipoPrima : String(registroPrima.da ?? "");
  if (fonte.prototypeToken) dati.prototypeToken = convertiSegnalino(fonte.prototypeToken, { tipo, tipoPrima: origine }).dati;

  const adesso = {};
  const note = { da: tipoPrima, a: tipo, portato: daPortare };
  let casiAssorbiti = {};
  if (daPortare) {
    dati.system = tipo === "png" ? sistemaPng(fonte.system) : sistemaMago(fonte.system);
    adesso.da = tipoPrima;
    adesso.sistema = VECCHIO_SISTEMA;
    if (quando) adesso.quando = quando;
    adesso.resto = restoDelSistema(fonte.system, tipoPrima, tipo);
    if (tipo === "mago") note.assorbite = abilitaAssorbite(fonte.system);
    if (tipo === "png") {
      let posto = prossimoPosto(dati.flags?.[NUOVO]?.nemico?.casi);
      casiAssorbiti = Object.fromEntries(riserveAssorbite(fonte.system).map((voce) => [`assorbita_${voce.id}`, { nome: voce.nome, campo: voce.campo, dadi: voce.dadi, skill: "", sort: posto++ }]));
    }
  }

  const passati = passaOggetti(fonte.items, { tipo, condizioniVecchie: daPortare && inCorso, casiPrima: { ...oggetto(dati.flags?.[NUOVO]?.nemico?.casi), ...casiAssorbiti }, registroPrima });
  dati.items = passati.tenuti;
  if (tipo === "png") dati.flags = nemicoColResto(dati.flags, { casi: { ...casiAssorbiti, ...passati.casi }, domini: passati.domini, spcType: fonte.system?.spcType ?? "" });
  adesso.oggetti = passati.scarti;
  adesso.condizioni = passati.condizioni;
  adesso.daTogliere = passati.togli;
  dati.flags = colRegistro(dati.flags, registroNuovo(registroPrima, adesso));
  if (togliSubito) dati = tolti(dati, passati.togli);

  note.scarti = passati.scarti;
  note.condizioni = passati.condizioni;
  note.casi = [...Object.values(casiAssorbiti), ...Object.values(passati.casi)].map((caso) => caso.nome);
  note.domini = passati.domini;
  note.resto = Object.keys(oggetto(adesso.resto));
  // I testi scritti a mano che la scheda nuova non mostra: il rapporto li riporta per intero, così si leggono.
  const testi = Object.fromEntries([...RESTO.testi.map((chiave) => [chiave, adesso.resto?.[chiave]]), ...Object.entries(oggetto(adesso.resto?.headers))].filter(([, testo]) => typeof testo === "string" && senzaTag(testo)));
  if (Object.keys(testi).length) note.testi = testi;
  return { dati, togli: passati.togli, lasciato: false, note };
}

/* ------------------------------------------------------------------ le scene */

/**
 * Una scena: le sue parole e le sue bandiere, e ogni segnalino col tipo
 * della sua scheda. `tipi` dice il tipo di una scheda dal suo id:
 * `{ prima, dopo }` (quello che aveva nel mondo del modulo e il nostro), o
 * niente se la scheda non c'è. Torna anche `rifai`: i segnalini il cui delta
 * va azzerato e riscritto, `[{ id, nome }]`. Con `soloPreparare` la scena
 * resta com'è e i delta da rifare vanno solo al sicuro (vedi `convertiSegnalino`).
 */
export function convertiScena(fonte, tipi = () => null, { inCorso = false, soloPreparare = false } = {}) {
  if (!fonte || typeof fonte !== "object") return { dati: fonte, note: [], rifai: [] };
  let dati;
  if (soloPreparare) dati = { ...fonte };
  else {
    dati = convertiGenerico("Scene", { ...fonte, tokens: undefined });
    delete dati.tokens;
  }
  const note = [];
  const rifai = [];
  if (Array.isArray(fonte.tokens)) {
    dati.tokens = fonte.tokens.map((segnalino) => {
      const scheda = tipi(segnalino?.actorId) ?? {};
      const esito = convertiSegnalino(segnalino, { tipo: scheda.dopo ?? "", tipoPrima: scheda.prima ?? "", inCorso, soloPreparare });
      if (esito.rifai) rifai.push({ id: segnalino?._id, nome: String(segnalino?.name ?? "") });
      if (Object.values(esito.note).some((voce) => Array.isArray(voce) && voce.length)) note.push({ segnalino: String(segnalino?.name ?? ""), ...esito.note });
      return esito.dati;
    });
  }
  return { dati, note, rifai };
}

/* ---------------------------------------------------------------- i messaggi */

/** Le classi dei dadi e dei tiri dentro un tiro salvato, fino in fondo. */
function classiNuove(valore) {
  if (Array.isArray(valore)) return valore.map(classiNuove);
  if (!valore || typeof valore !== "object") return typeof valore === "string" ? convertiTesto(valore) : valore;
  const esito = {};
  for (const [chiave, voce] of Object.entries(valore)) {
    if (chiave === "class" && typeof voce === "string") esito.class = CLASSI_TIRO[voce] ?? CLASSI_DADO[voce] ?? voce;
    else esito[chiave] = classiNuove(voce);
  }
  return esito;
}

/** Vero se dentro un tiro salvato c'è almeno un dado del modulo. */
function haDadiDelModulo(valore) {
  if (Array.isArray(valore)) return valore.some(haDadiDelModulo);
  if (!valore || typeof valore !== "object") return false;
  return DADI_DEL_MODULO.includes(valore.class) || Object.values(valore).some(haDadiDelModulo);
}

/**
 * Un tiro salvato in chat (il testo JSON che Foundry tiene nel messaggio).
 * Un tiro di wod5e fatto coi dadi del modulo diventa un tiro nostro; uno
 * senza (un'iniziativa) diventa un tiro semplice, perché la nostra carta lo
 * mostrerebbe come una riserva e conterebbe il totale per successi.
 */
export function convertiTiro(testo) {
  if (typeof testo !== "string") return testo;
  let letto;
  try {
    letto = JSON.parse(testo);
  } catch {
    return testo;
  }
  const nuovo = classiNuove(letto);
  if (nuovo && typeof nuovo === "object" && CLASSI_TIRO[letto?.class] && !haDadiDelModulo(letto)) nuovo.class = TIRO_SEMPLICE;
  return uguali(letto, nuovo) ? testo : JSON.stringify(nuovo);
}

/** La carta di un oggetto mostrato in chat, com'è nel sistema: nome, immagine, descrizione. */
export function cartaOggetto({ name = "", img = "", description = "" } = {}) {
  const immagine = img ? `<img src="${protetta(convertiImmagine(String(img), IMMAGINE_OGGETTO))}" alt="" width="36" height="36">` : "";
  return `<div class="m6-oggetto-chat"><h3>${immagine}${protetta(name)}</h3>${convertiTesto(String(description ?? ""))}</div>`;
}

/**
 * Un messaggio della chat: le bandiere, il testo, i tiri. Le carte degli
 * oggetti di wod5e stavano tutte nelle bandiere (il testo era vuoto): qui
 * diventano una carta scritta, così si leggono ancora.
 */
export function convertiMessaggio(fonte) {
  if (!fonte || typeof fonte !== "object") return fonte;
  const dati = convertiGenerico("ChatMessage", { ...fonte, rolls: undefined });
  delete dati.rolls;
  if (Object.hasOwn(fonte, "rolls")) dati.rolls = Array.isArray(fonte.rolls) ? fonte.rolls.map(convertiTiro) : fonte.rolls;
  const vecchia = fonte.flags?.[VECCHIO_SISTEMA];
  if (vecchia && typeof vecchia === "object" && (vecchia.name || vecchia.description) && !String(fonte.content ?? "").trim()) dati.content = cartaOggetto(vecchia);
  return dati;
}

/* ------------------------------------------------------------ gli aggiornamenti */

/**
 * Quello che va mandato a Foundry perché `prima` diventi `dopo`.
 *
 *   cambia  l'aggiornamento: le voci semplici col loro valore, le voci a
 *           oggetto sostituite intere (`==voce`), i documenti dentro voce
 *           per voce col loro `_id`; `null` se non cambia niente
 *   togli   i documenti dentro da togliere: `[{ strada, raccolta, ids }]`,
 *           dove `strada` è il cammino per arrivarci (`[{ raccolta, id }]`
 *           o `{ uno }` per il delta di un segnalino)
 */
export function aggiornamento(nome, prima, dopo, strada = []) {
  const dentro = GERARCHIA[nome] ?? {};
  const cambia = {};
  const togli = [];
  const p = oggetto(prima);
  for (const [chiave, valore] of Object.entries(oggetto(dopo))) {
    if (chiave === "_id" || CHIAVI_DI_FOUNDRY.includes(chiave)) continue;
    if (dentro[chiave]?.uno) {
      if (!valore || typeof valore !== "object" || !p[chiave] || typeof p[chiave] !== "object") {
        if (!uguali(p[chiave], valore)) cambia[chiave] = valore;
        continue;
      }
      const sotto = aggiornamento(dentro[chiave].uno, p[chiave], valore, [...strada, { uno: chiave }]);
      if (sotto.cambia) cambia[chiave] = sotto.cambia;
      togli.push(...sotto.togli);
      continue;
    }
    if (dentro[chiave] && Array.isArray(valore)) {
      const vecchi = new Map((Array.isArray(p[chiave]) ? p[chiave] : []).map((voce) => [voce?._id, voce]));
      const cambiati = [];
      const rimasti = new Set();
      for (const voce of valore) {
        const id = voce?._id;
        rimasti.add(id);
        if (!vecchi.has(id)) continue;
        const sotto = aggiornamento(dentro[chiave], vecchi.get(id), voce, [...strada, { raccolta: chiave, id }]);
        if (sotto.cambia) cambiati.push({ _id: id, ...sotto.cambia });
        togli.push(...sotto.togli);
      }
      if (cambiati.length) cambia[chiave] = cambiati;
      const via = [...vecchi.keys()].filter((id) => !rimasti.has(id));
      if (via.length) togli.push({ strada, raccolta: chiave, ids: via });
      continue;
    }
    if (uguali(p[chiave], valore)) continue;
    if (valore && typeof valore === "object" && !Array.isArray(valore)) cambia[`==${chiave}`] = valore;
    else cambia[chiave] = valore;
  }
  return { cambia: Object.keys(cambia).length ? cambia : null, togli };
}
