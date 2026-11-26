/**
 * Il passaggio dal modulo al sistema: la parte che parla con Foundry.
 *
 * Un mondo nato col modulo si porta così: si copia la sua cartella, nella
 * copia si scrive il sistema nuovo in `world.json`, la si apre. Foundry apre
 * tutto tranne le schede, che hanno un tipo che il sistema non conosce
 * (restano «invalide», coi loro dati interi). Qui il Narratore trova la
 * finestra che propone il passaggio; se dice sì:
 *
 *   primo giro    le schede prendono il tipo e i dati nuovi; i messaggi, i
 *                 diari, le macro e gli oggetti del mondo passano; poi la
 *                 pagina si ricarica, perché Foundry non sa aggiornare a
 *                 schermo una scheda che non aveva aperto
 *   secondo giro  a schede aperte si tolgono gli oggetti che non hanno un
 *                 posto, passano le scene coi segnalini, e per ultime le
 *                 impostazioni; il rapporto finisce in un diario
 *
 * Lo stato sta nell'impostazione `passaggio` del mondo: un passaggio
 * interrotto riprende da dove era. `esamina` non scrive niente, e gira anche
 * in un mondo che usa ancora il modulo.
 *
 * I conti stanno in converti.js, l'esame in piano.js, le scelte in regole.js.
 */
import { MODULE_ID } from "../constants.js";
import { haSchedeDiPrima, operazioniDelGiro, pianoDelPassaggio } from "./piano.js";
import { propostaHtml, rapportoHtml, testiHtml, unisciRapporti } from "./rapporto.js";
import { GERARCHIA, RACCOLTE, VECCHIO_MODULO } from "./regole.js";

export const PASSAGGIO_SETTING = "passaggio";

/** Dopo tanti giri senza finire ci si ferma: qualcosa non si lascia portare, e lo dice il rapporto. */
export const GIRI_MAX = 4;

/** Quanti documenti aperti si aggiornano in una volta. */
const MAZZO = 100;

const CLASSI = ["m6w", "m6", "mage", "m6-passaggio-finestra"];

/** La data di oggi, per i registri. */
function oggi() {
  return new Date().toISOString().slice(0, 10);
}

/** Una copia staccata: Foundry ritocca gli aggiornamenti che riceve. */
function staccata(dati) {
  return JSON.parse(JSON.stringify(dati));
}

/* ------------------------------------------------------------ la fotografia */

/** I documenti di una raccolta, aperti e no, coi loro dati. */
function vociDi(raccolta) {
  if (!raccolta) return [];
  const voci = (raccolta.contents ?? []).map((documento) => ({ fonte: documento._source, invalido: false }));
  for (const id of raccolta.invalidDocumentIds ?? []) {
    try {
      voci.push({ fonte: raccolta.getInvalid(id)._source, invalido: true });
    } catch (errore) {
      console.warn(`${MODULE_ID} | Passaggio: il documento ${id} non si legge.`, errore);
    }
  }
  return voci;
}

/**
 * La fotografia del mondo aperto: i dati di ogni documento, delle
 * impostazioni e dei compendi del mondo, com'è scritta in testa a piano.js.
 */
export async function fotografa(gioco = globalThis.game) {
  const raccolte = Object.fromEntries(Object.keys(RACCOLTE).map((nome) => [nome, vociDi(gioco[nome])]));
  const pacchi = [];
  for (const pacco of gioco.packs ?? []) {
    if (pacco.metadata?.packageType !== "world" || pacco.locked) continue;
    try {
      await pacco.getDocuments();
      pacchi.push({ id: pacco.collection, documento: pacco.documentName, voci: vociDi(pacco) });
    } catch (errore) {
      console.warn(`${MODULE_ID} | Passaggio: il compendio ${pacco.collection} non si legge.`, errore);
    }
  }
  const impostazioni = [...(gioco.settings?.storage?.get("world") ?? [])].map((voce) => ({ id: voce.id, key: voce.key, value: voce.value }));
  const nostro = gioco.system?.id === MODULE_ID;
  return { raccolte, pacchi, impostazioni, registrate: nostro ? [...(gioco.settings?.settings?.keys() ?? [])] : null };
}

/* ------------------------------------------------------------------ lo stato */

export function leggiStato(gioco = globalThis.game) {
  try {
    const stato = gioco.settings.get(MODULE_ID, PASSAGGIO_SETTING);
    return stato && typeof stato === "object" ? stato : {};
  } catch {
    return {};
  }
}

async function scriviStato(stato, gioco = globalThis.game) {
  await gioco.settings.set(MODULE_ID, PASSAGGIO_SETTING, stato);
}

/**
 * Il segno veloce che un mondo viene dal modulo: una scheda chiusa, o
 * un'impostazione del modulo ancora al suo posto. Serve a non fare l'esame
 * intero a ogni avvio di un mondo che non ne ha bisogno.
 */
export function haTracce(gioco = globalThis.game) {
  if ((gioco.actors?.invalidDocumentIds?.size ?? 0) > 0) return true;
  return [...(gioco.settings?.storage?.get("world") ?? [])].some((voce) => String(voce.key ?? "").startsWith(`${VECCHIO_MODULO}.`));
}

/* ------------------------------------------------------------------- l'esame */

/** Il piano del passaggio per il mondo aperto, senza scrivere niente. */
export async function esamina({ gioco = globalThis.game, inCorso } = {}) {
  const mondo = await fotografa(gioco);
  const stato = gioco.system?.id === MODULE_ID ? leggiStato(gioco) : {};
  return pianoDelPassaggio(mondo, { quando: stato.quando || oggi(), inCorso: inCorso ?? (stato.inCorso ? true : undefined) });
}

/** I file del sistema nominati dal piano che il server non dà. */
export async function fileMancanti(percorsi = []) {
  const mancanti = [];
  for (const percorso of percorsi) {
    try {
      const risposta = await fetch(foundry.utils.getRoute(percorso), { method: "HEAD" });
      if (!risposta.ok) mancanti.push(percorso);
    } catch {
      mancanti.push(percorso);
    }
  }
  return mancanti;
}

/* --------------------------------------------------------------- l'esecuzione */

/** La raccolta dove vive il documento di un'operazione. */
function raccoltaDi(op, gioco) {
  return op.pacco ? gioco.packs.get(op.pacco) : gioco[op.raccolta];
}

/** Il documento di un'operazione, aperto o no. */
function documentoDi(op, gioco) {
  const raccolta = raccoltaDi(op, gioco);
  return raccolta?.get(op.id) ?? (raccolta?.invalidDocumentIds?.has(op.id) ? raccolta.getInvalid(op.id) : null);
}

/** Dal documento al posto dove togliere, seguendo la strada scritta da `aggiornamento`. */
function cammina(documento, nome, strada) {
  let dove = documento;
  let tipo = nome;
  for (const passo of strada) {
    if (passo.uno) {
      // Il delta di un segnalino si tocca dalla sua scheda (quella che il segnalino mostra).
      tipo = GERARCHIA[tipo]?.[passo.uno]?.uno ?? "";
      dove = passo.uno === "delta" ? dove?.actor : dove?.[passo.uno];
    } else {
      tipo = GERARCHIA[tipo]?.[passo.raccolta] ?? "";
      dove = dove?.[passo.raccolta]?.get(passo.id);
    }
    if (!dove) return { dove: null, tipo };
  }
  return { dove, tipo };
}

/** Toglie i documenti dentro segnati da un'operazione. */
async function togliDa(documento, op) {
  for (const { strada, raccolta, ids } of op.togli ?? []) {
    const { dove, tipo } = cammina(documento, op.documento, strada);
    const nome = GERARCHIA[tipo]?.[raccolta];
    if (!dove || typeof nome !== "string") throw new Error(`${op.nome}: ${raccolta}`);
    await dove.deleteEmbeddedDocuments(nome, ids, { render: false });
  }
}

/**
 * Aggiorna un documento chiuso. Il server scrive; Foundry 14 poi inciampa
 * nel mostrare a schermo una scheda che non aveva aperto, con un errore di
 * tipo che qui non è un guasto: dopo si ricarica la pagina.
 */
async function aggiornaChiuso(documento, cambia) {
  try {
    await documento.update(staccata(cambia), { render: false });
  } catch (errore) {
    if (!(errore instanceof TypeError)) throw errore;
  }
}

/**
 * Fa le operazioni di un giro. Torna quante ne ha fatte, quante schede chiuse
 * ha toccato e gli errori. `avanza(fatte, tutte)` viene chiamata man mano.
 *
 * L'ordine dentro un documento conta: prima si toglie quello che va tolto,
 * poi si aggiorna (l'aggiornamento cancella dal registro la lista di chi
 * andava tolto: se il togliere non riesce, la lista deve restare).
 */
export async function applica(piano, { gioco = globalThis.game, avanza = () => {} } = {}) {
  const operazioni = operazioniDelGiro(piano);
  const errori = [];
  let fatte = 0;
  let chiuse = 0;
  const passo = (quante = 1) => {
    fatte += quante;
    avanza(fatte, operazioni.length);
  };
  const sbaglio = (op, errore) => errori.push({ nome: op.nome || op.id, documento: op.documento, errore: String(errore?.message ?? errore) });

  // Le schede chiuse, una per volta.
  for (const op of operazioni.filter((voce) => voce.invalido)) {
    try {
      const documento = documentoDi(op, gioco);
      if (!documento) throw new Error("manca");
      if (op.cambia) await aggiornaChiuso(documento, op.cambia);
      chiuse += 1;
    } catch (errore) {
      sbaglio(op, errore);
    }
    passo();
  }

  // I documenti aperti con qualcosa da togliere, uno per volta: prima si toglie, poi si aggiorna.
  for (const op of operazioni.filter((voce) => !voce.invalido && voce.togli?.length)) {
    try {
      const documento = documentoDi(op, gioco);
      if (!documento) throw new Error("manca");
      await togliDa(documento, op);
      if (op.cambia) await documento.update(staccata(op.cambia), { render: false });
    } catch (errore) {
      sbaglio(op, errore);
    }
    passo();
  }

  // Gli altri documenti aperti, a mazzi per raccolta.
  const mazzi = new Map();
  for (const op of operazioni) {
    if (op.invalido || op.togli?.length || !op.cambia) continue;
    const chiave = `${op.documento}|${op.pacco}`;
    if (!mazzi.has(chiave)) mazzi.set(chiave, []);
    mazzi.get(chiave).push(op);
  }
  for (const lista of mazzi.values()) {
    const classe = getDocumentClass(lista[0].documento);
    const opzioni = lista[0].pacco ? { pack: lista[0].pacco, render: false } : { render: false };
    for (let da = 0; da < lista.length; da += MAZZO) {
      const mazzo = lista.slice(da, da + MAZZO);
      try {
        await classe.updateDocuments(mazzo.map((op) => ({ _id: op.id, ...staccata(op.cambia) })), opzioni);
      } catch (errore) {
        // Un documento del mazzo non passa: si riprova uno per uno, per sapere quale.
        console.warn(`${MODULE_ID} | Passaggio: un mazzo non è passato, riprovo voce per voce.`, errore);
        for (const op of mazzo) {
          try {
            const documento = documentoDi(op, gioco);
            if (!documento) throw new Error("manca");
            await documento.update(staccata(op.cambia), { render: false });
          } catch (sotto) {
            sbaglio(op, sotto);
          }
        }
      }
      passo(mazzo.length);
    }
  }
  return { fatte, chiuse, errori };
}

/** Le impostazioni del modulo passano al sistema, per ultime. */
async function portaImpostazioni(piano, gioco) {
  const errori = [];
  const mondo = gioco.settings.storage.get("world");
  for (const voce of piano.impostazioni ?? []) {
    if (voce.mossa !== "porta") continue;
    try {
      const chiave = voce.a.slice(MODULE_ID.length + 1);
      await gioco.settings.set(MODULE_ID, chiave, voce.valore);
      await mondo.get(voce.id)?.delete();
    } catch (errore) {
      errori.push({ nome: voce.da, documento: "Setting", errore: String(errore?.message ?? errore) });
    }
  }
  if (piano.compendi) {
    try {
      await gioco.settings.set("core", "compendiumConfiguration", piano.compendi);
    } catch (errore) {
      errori.push({ nome: "core.compendiumConfiguration", documento: "Setting", errore: String(errore?.message ?? errore) });
    }
  }
  return errori;
}

/** Il diario che tiene il rapporto: una pagina coi conti, e una coi testi rimasti fuori dalle schede, se ce ne sono. */
async function scriviDiario(html, testi, quando, gioco) {
  const nome = gioco.i18n.format("M6.Passaggio.Diario", { quando });
  const pagine = [{ name: gioco.i18n.localize("M6.Passaggio.Titolo"), type: "text", sort: 100, text: { content: html, format: 1 } }];
  if (testi) pagine.push({ name: gioco.i18n.localize("M6.Passaggio.Sezioni.Testi"), type: "text", sort: 200, text: { content: testi, format: 1 } });
  const diario = await JournalEntry.create({ name: nome, pages: pagine }, { renderSheet: false });
  return diario?.name ?? nome;
}

/**
 * Fa un giro del passaggio. Se dopo serve ricaricare la pagina (schede
 * chiuse toccate, o cose che aspettano le schede) lo dice in `ricarica`: lo
 * stato è già salvato e all'avvio dopo si riprende da soli.
 */
export async function porta({ gioco = globalThis.game, avanza = () => {} } = {}) {
  if (!gioco.user?.isGM) throw new Error(gioco.i18n.localize("M6.Passaggio.SoloNarratore"));
  const stato = leggiStato(gioco);
  const quando = stato.quando || oggi();
  const giro = (Number(stato.giro) || 0) + 1;
  const mondo = await fotografa(gioco);
  const piano = pianoDelPassaggio(mondo, { quando, inCorso: stato.inCorso || haSchedeDiPrima(mondo) });
  const esito = await applica(piano, { gioco, avanza });
  const rapporto = unisciRapporti(stato.rapporto, piano.rapporto);
  const errori = [...(stato.errori ?? []), ...esito.errori];
  const impostazioni = piano.impostazioni;

  // Qualcosa aspetta le schede: si salva e si ricarica, a meno che i giri siano già troppi.
  if (piano.aspettano && giro < GIRI_MAX) {
    await scriviStato({ inCorso: true, giro, quando, rapporto, errori, percorsi: [...new Set([...(stato.percorsi ?? []), ...piano.percorsi])] }, gioco);
    return { finito: false, ricarica: true, giro, rapporto, errori };
  }

  errori.push(...await portaImpostazioni(piano, gioco));
  const mancanti = await fileMancanti([...new Set([...(stato.percorsi ?? []), ...piano.percorsi])]);
  const fermo = piano.aspettano;
  const pagina = rapportoHtml({ rapporto, lasciati: piano.lasciati, impostazioni, mancanti, errori }, { localize: (chiave) => gioco.i18n.localize(chiave), format: (chiave, dati) => gioco.i18n.format(chiave, dati) });
  let diario = "";
  try {
    diario = await scriviDiario(pagina, testiHtml(rapporto, { localize: (chiave) => gioco.i18n.localize(chiave) }), quando, gioco);
  } catch (errore) {
    console.warn(`${MODULE_ID} | Passaggio: il diario del rapporto non si è scritto.`, errore);
  }
  await scriviStato({ inCorso: false, giro: 0, fatto: quando, fermo, diario, mostra: esito.chiuse > 0, pagina: esito.chiuse > 0 ? pagina : "" }, gioco);
  return { finito: true, ricarica: esito.chiuse > 0, giro, rapporto, errori, mancanti, fermo, diario, pagina };
}

/* ----------------------------------------------------------------- le finestre */

/** La finestra col rapporto. */
export async function mostraRapporto(pagina, { gioco = globalThis.game, diario = "", fermo = false } = {}) {
  const L = (chiave) => gioco.i18n.localize(`M6.Passaggio.${chiave}`);
  const testa = fermo ? L("Fermo") : diario ? gioco.i18n.format("M6.Passaggio.Finito", { nome: diario }) : "";
  return foundry.applications.api.DialogV2.wait({
    window: { title: L("Titolo") },
    classes: CLASSI,
    position: { width: 720, height: "auto" },
    content: `${testa ? `<p class="m6-passaggio-testa">${foundry.utils.escapeHTML(testa)}</p>` : ""}${pagina}`,
    buttons: [{ action: "chiudi", icon: "fa-solid fa-check", label: L("Chiudi"), default: true }],
    rejectClose: false
  });
}

/** Fa il passaggio dalla finestra: avvisa, esegue, ricarica o mostra il rapporto. */
async function eseguiDallaFinestra(gioco = globalThis.game) {
  const stato = leggiStato(gioco);
  const giro = (Number(stato.giro) || 0) + 1;
  // Una riga sola che avanza, dove Foundry la sa disegnare; altrimenti un avviso all'inizio.
  const testo = (fatte, tutte) => gioco.i18n.format("M6.Passaggio.Giro", { giro, fatte, tutte });
  const barra = ui.notifications.info(testo(0, 0), { progress: true });
  const avanza = (fatte, tutte) => barra?.update?.({ pct: tutte ? fatte / tutte : 1, message: testo(fatte, tutte) });
  let esito;
  try {
    esito = await porta({ gioco, avanza });
  } finally {
    barra?.update?.({ pct: 1 });
  }
  if (esito.ricarica) {
    ui.notifications.info(gioco.i18n.localize("M6.Passaggio.Ricarica"));
    setTimeout(() => globalThis.location.reload(), 1200);
    return esito;
  }
  await mostraRapporto(esito.pagina, { gioco, diario: esito.diario, fermo: esito.fermo });
  return esito;
}

/**
 * Apre la finestra del passaggio: i conti di quello che c'è da portare e i
 * due tasti. In un mondo che usa ancora il modulo mostra solo l'esame.
 */
export async function apri({ gioco = globalThis.game } = {}) {
  const L = (chiave) => gioco.i18n.localize(`M6.Passaggio.${chiave}`);
  const nostro = gioco.system?.id === MODULE_ID;
  const piano = await esamina({ gioco });
  const parole = { localize: (chiave) => gioco.i18n.localize(chiave), format: (chiave, dati) => gioco.i18n.format(chiave, dati) };
  if (!nostro) {
    const mancanti = await fileMancanti(piano.percorsi);
    const pagina = rapportoHtml({ rapporto: piano.rapporto, lasciati: piano.lasciati, impostazioni: piano.impostazioni, mancanti }, { ...parole, esame: true });
    await mostraRapporto(`<p>${foundry.utils.escapeHTML(L("Esame"))}</p>${pagina}`, { gioco });
    return piano;
  }
  if (!gioco.user?.isGM) {
    ui.notifications.warn(L("SoloNarratore"));
    return piano;
  }
  const bottoni = piano.daFare
    ? [{ action: "porta", icon: "fa-solid fa-right-long", label: L("Porta"), default: true }, { action: "dopo", icon: "fa-solid fa-clock", label: L("Dopo") }]
    : [{ action: "dopo", icon: "fa-solid fa-check", label: L("Chiudi"), default: true }];
  const scelta = await foundry.applications.api.DialogV2.wait({
    window: { title: L("Titolo") },
    classes: CLASSI,
    position: { width: 560, height: "auto" },
    content: propostaHtml(piano, parole),
    buttons: bottoni,
    rejectClose: false
  });
  if (scelta === "porta") await eseguiDallaFinestra(gioco);
  return piano;
}

/* --------------------------------------------------------------- l'avviamento */

/** L'impostazione che tiene lo stato del passaggio. Va registrata all'avvio del sistema. */
export function registraPassaggio(gioco = globalThis.game) {
  gioco.settings.register(MODULE_ID, PASSAGGIO_SETTING, { scope: "world", config: false, type: Object, default: {} });
}

/**
 * Al pronto, dal primo Narratore: un passaggio a metà riprende; un rapporto
 * rimasto da mostrare dopo la ricarica si mostra; un mondo che viene dal
 * modulo trova la finestra che propone il passaggio.
 */
export async function passaggioAlPronto(gioco = globalThis.game) {
  if (!gioco.user?.isGM || gioco.users?.activeGM?.id !== gioco.user.id) return;
  const stato = leggiStato(gioco);
  try {
    if (stato.inCorso) {
      await eseguiDallaFinestra(gioco);
      return;
    }
    if (stato.mostra) {
      await scriviStato({ ...stato, mostra: false, pagina: "" }, gioco);
      await mostraRapporto(stato.pagina, { gioco, diario: stato.diario, fermo: stato.fermo });
      return;
    }
    if (!haTracce(gioco)) return;
    const piano = await esamina({ gioco });
    if (piano.daFare) await apri({ gioco });
  } catch (errore) {
    console.error(`${MODULE_ID} | Passaggio interrotto.`, errore);
    ui.notifications.error(`${gioco.i18n.localize("M6.Passaggio.Titolo")}: ${errore?.message ?? errore}`);
  }
}

/** La porta per la console e per le macro: `game.m6.passaggio`. */
export const passaggio = Object.freeze({ esamina, apri, porta, fotografa, stato: leggiStato });
