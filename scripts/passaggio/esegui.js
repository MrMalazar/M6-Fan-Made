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
 *                 posto, e subito dopo passano le scene coi segnalini; la
 *                 pagina si ricarica ancora
 *   alla fine     un esame a pagina fresca non trova più niente: passano le
 *                 impostazioni e il rapporto finisce in un diario
 *
 * I segnalini non legati alla scheda hanno una regola in più, perché Foundry
 * 14 rifà la scheda che mostrano ogni volta che cambia qualcosa sotto, e si
 * ferma se ci trova un oggetto che non conosce. Il delta di un segnalino si
 * ritocca quindi solo a schede intere; e un delta che porta lui stesso un
 * oggetto da togliere si rifà da capo: prima delle schede il delta nuovo va
 * al sicuro nelle bandiere del segnalino e quello vecchio si azzera, dopo le
 * schede si riscrive dalla copia.
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
import { GERARCHIA, RACCOLTE, REGISTRO, VECCHIO_MODULO } from "./regole.js";

export const PASSAGGIO_SETTING = "passaggio";

/** Dopo tanti giri senza finire ci si ferma: qualcosa non si lascia portare, e lo dice il rapporto. Di solito ne bastano due, più quello che controlla. */
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
      pacchi.push({ id: pacco.collection, nome: pacco.metadata?.label ?? pacco.title ?? "", documento: pacco.documentName, voci: vociDi(pacco) });
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
      tipo = GERARCHIA[tipo]?.[passo.uno]?.uno ?? "";
      dove = dove?.[passo.uno];
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
 * Aggiorna un documento aperto. Quando un cambio non gli torna, Foundry 14
 * non lancia un errore: avvisa a schermo, non manda niente al server e torna
 * a mani vuote. Qui quel silenzio diventa un errore, col nome di chi non è
 * passato.
 */
async function aggiornaAperto(documento, cambia, rifiuto) {
  const fatto = await documento.update(staccata(cambia), { render: false });
  if (!fatto) throw new Error(rifiuto);
}

/**
 * Rifà il delta di un segnalino non legato. La copia del delta nuovo deve
 * essere già al sicuro nelle bandiere del segnalino (ce la mette
 * l'aggiornamento della scena): senza la copia non si azzera niente. Poi il
 * delta vecchio si cancella intero, che è l'unico modo in cui Foundry 14 si
 * libera di un oggetto che non conosce; e, se le schede sono intere
 * (`riscrivi`), il delta nuovo e le bandiere senza la copia si scrivono in
 * un colpo solo.
 */
async function rifaiDelta(scena, voce, { riscrivi, rifiuto }) {
  const segnalino = scena.tokens?.get(voce.id);
  const scorta = segnalino?._source?.flags?.[MODULE_ID]?.[REGISTRO]?.delta;
  if (!scorta || typeof scorta !== "object") throw new Error(`${voce.nome}: ${rifiuto}`);
  if (segnalino._source.delta) await segnalino.delta.delete({ render: false });
  if (segnalino._source.delta) throw new Error(`${voce.nome}: ${rifiuto}`);
  if (!riscrivi) return;
  const bandiere = staccata(segnalino._source.flags);
  delete bandiere[MODULE_ID][REGISTRO];
  if (!Object.keys(bandiere[MODULE_ID]).length) delete bandiere[MODULE_ID];
  const fatti = await scena.updateEmbeddedDocuments("Token", [{ _id: voce.id, delta: staccata(scorta), "==flags": bandiere }], { render: false });
  if (!fatti?.length) throw new Error(`${voce.nome}: ${rifiuto}`);
}

/**
 * Fa le operazioni che si possono fare adesso. Torna quante ne ha fatte,
 * quante schede chiuse ha toccato e gli errori. `avanza(fatte, tutte)` viene
 * chiamata man mano.
 *
 * L'ordine conta. Le scene coi delta da rifare vanno davanti alle schede:
 * quando una scheda cambia, Foundry rifà i suoi segnalini non legati, e se
 * un delta porta ancora un oggetto che il sistema non conosce si ferma lì.
 * Dentro una scheda prima si toglie quello che va tolto, poi si aggiorna
 * (l'aggiornamento cancella dal registro la lista di chi andava tolto: se il
 * togliere non riesce, la lista deve restare).
 */
export async function applica(piano, { gioco = globalThis.game, avanza = () => {} } = {}) {
  const operazioni = operazioniDelGiro(piano);
  const errori = [];
  const manca = gioco.i18n.localize("M6.Passaggio.Manca");
  const rifiuto = gioco.i18n.localize("M6.Passaggio.Rifiuto");
  let fatte = 0;
  let chiuse = 0;
  const passo = (quante = 1) => {
    fatte += quante;
    avanza(fatte, operazioni.length);
  };
  const sbaglio = (op, errore) => errori.push({ nome: op.nome || op.id, documento: op.documento, errore: String(errore?.message ?? errore) });
  const trova = (op) => {
    const documento = documentoDi(op, gioco);
    if (!documento) throw new Error(manca);
    return documento;
  };

  // Le schede chiuse, una per volta.
  for (const op of operazioni.filter((voce) => voce.invalido)) {
    try {
      const documento = trova(op);
      if (op.cambia) await aggiornaChiuso(documento, op.cambia);
      chiuse += 1;
    } catch (errore) {
      sbaglio(op, errore);
    }
    passo();
  }

  // Le scene coi delta da rifare, davanti alle schede: la copia al sicuro (sta nell'aggiornamento), poi il delta.
  const daRifare = operazioni.filter((voce) => !voce.invalido && voce.rifai?.length);
  for (const op of daRifare) {
    try {
      const documento = trova(op);
      if (op.cambia) await aggiornaAperto(documento, op.cambia, rifiuto);
      for (const voce of op.rifai) await rifaiDelta(documento, voce, { riscrivi: Boolean(op.riscrivi), rifiuto });
    } catch (errore) {
      sbaglio(op, errore);
    }
    passo();
  }

  // I documenti aperti con qualcosa da togliere, uno per volta: prima si toglie, poi si aggiorna.
  for (const op of operazioni.filter((voce) => !voce.invalido && !voce.rifai?.length && voce.togli?.length)) {
    try {
      const documento = trova(op);
      await togliDa(documento, op);
      if (op.cambia) await aggiornaAperto(documento, op.cambia, rifiuto);
    } catch (errore) {
      sbaglio(op, errore);
    }
    passo();
  }

  // Gli altri documenti aperti, a mazzi per raccolta.
  const mazzi = new Map();
  for (const op of operazioni) {
    if (op.invalido || op.rifai?.length || op.togli?.length || !op.cambia) continue;
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
        const fatti = await classe.updateDocuments(mazzo.map((op) => ({ _id: op.id, ...staccata(op.cambia) })), opzioni);
        // Chi manca fra i tornati non è passato: Foundry l'ha lasciato fuori senza dire niente.
        const passati = new Set((fatti ?? []).map((documento) => documento?.id));
        for (const op of mazzo) if (!passati.has(op.id)) sbaglio(op, rifiuto);
      } catch (errore) {
        // Un documento del mazzo non passa: si riprova uno per uno, per sapere quale.
        console.warn(`${MODULE_ID} | Passaggio: un mazzo non è passato, riprovo voce per voce.`, errore);
        for (const op of mazzo) {
          try {
            await aggiornaAperto(trova(op), op.cambia, rifiuto);
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
 * Fa un giro del passaggio.
 *
 * Finché l'esame trova qualcosa da fare lo fa, salva lo stato e chiede di
 * ricaricare la pagina (`ricarica`): Foundry tiene in memoria quello che ha
 * letto all'avvio, e su una scheda che non aveva aperto o su un oggetto che
 * non conosce quella memoria non dice più il vero. All'avvio dopo si riprende
 * da soli. Il passaggio finisce quando un esame a pagina fresca non trova più
 * niente: allora passano le impostazioni e il rapporto va nel diario. Dopo
 * GIRI_MAX giri ci si ferma comunque, e il rapporto dice che cosa è rimasto.
 *
 * Quello che aspettava le schede (le scene coi segnalini) passa nello stesso
 * giro in cui le schede diventano intere: l'esame si rifà sulla memoria
 * della pagina e si fa il seguito. Solo se il giro è andato liscio e non ha
 * toccato schede chiuse, perché allora quella memoria dice il vero; e la
 * pagina fresca del giro dopo controlla comunque.
 */
export async function porta({ gioco = globalThis.game, avanza = () => {} } = {}) {
  if (!gioco.user?.isGM) throw new Error(gioco.i18n.localize("M6.Passaggio.SoloNarratore"));
  const stato = leggiStato(gioco);
  const quando = stato.quando || oggi();
  const fatti = Number(stato.giro) || 0;
  const mondo = await fotografa(gioco);
  const inCorso = Boolean(stato.inCorso) || haSchedeDiPrima(mondo);
  const piano = pianoDelPassaggio(mondo, { quando, inCorso });
  const daFare = operazioniDelGiro(piano).length > 0 || piano.aspettano;
  let percorsi = [...new Set([...(stato.percorsi ?? []), ...piano.percorsi])];

  if (daFare && fatti < GIRI_MAX) {
    const esito = await applica(piano, { gioco, avanza });
    let rapporto = unisciRapporti(stato.rapporto, piano.rapporto);
    const errori = [...esito.errori];
    if (piano.aspettano && !esito.chiuse && !errori.length) {
      const seguito = pianoDelPassaggio(await fotografa(gioco), { quando, inCorso });
      if (operazioniDelGiro(seguito).length) {
        errori.push(...(await applica(seguito, { gioco, avanza })).errori);
        rapporto = unisciRapporti(rapporto, seguito.rapporto);
        percorsi = [...new Set([...percorsi, ...seguito.percorsi])];
      }
    }
    await scriviStato({ inCorso: true, giro: fatti + 1, quando, rapporto, errori, percorsi }, gioco);
    return { finito: false, ricarica: true, giro: fatti + 1, rapporto, errori };
  }

  // Niente più da fare, o troppi giri: le impostazioni, il controllo dei file, il rapporto.
  const fermo = daFare;
  const rapporto = unisciRapporti(stato.rapporto, piano.rapporto);
  const errori = fermo ? [...(stato.errori ?? [])] : [];
  errori.push(...await portaImpostazioni(piano, gioco));
  const rimasti = fermo ? piano.operazioni.map((op) => ({ nome: op.nome || op.id, documento: op.documento })) : [];
  const mancanti = await fileMancanti(percorsi);
  const parole = { localize: (chiave) => gioco.i18n.localize(chiave), format: (chiave, dati) => gioco.i18n.format(chiave, dati) };
  const pagina = rapportoHtml({ rapporto, lasciati: piano.lasciati, impostazioni: [...(stato.impostazioni ?? []), ...piano.impostazioni], compendi: Boolean(piano.compendi), mancanti, errori, rimasti }, parole);
  let diario = "";
  try {
    diario = await scriviDiario(pagina, testiHtml(rapporto, parole), quando, gioco);
  } catch (errore) {
    console.warn(`${MODULE_ID} | Passaggio: il diario del rapporto non si è scritto.`, errore);
  }
  await scriviStato({ inCorso: false, giro: 0, fatto: quando, fermo, diario }, gioco);
  return { finito: true, ricarica: false, giro: fatti, rapporto, errori, mancanti, fermo, diario, pagina };
}

/* ----------------------------------------------------------------- le finestre */

/**
 * Le parole del sistema. In un mondo che usa ancora il modulo Foundry non le
 * ha caricate: per l'esame si leggono dal file di lingua del sistema.
 */
export async function paroleDi(gioco = globalThis.game) {
  const sue = { localize: (chiave) => gioco.i18n.localize(chiave), format: (chiave, dati) => gioco.i18n.format(chiave, dati) };
  if (gioco.system?.id === MODULE_ID) return sue;
  for (const lingua of [...new Set([gioco.i18n?.lang, "it"])].filter(Boolean)) {
    try {
      const risposta = await fetch(foundry.utils.getRoute(`systems/${MODULE_ID}/lang/${lingua}.json`));
      if (!risposta.ok) continue;
      const voci = await risposta.json();
      const cerca = (chiave) => {
        const voce = String(chiave).split(".").reduce((dove, pezzo) => dove?.[pezzo], voci);
        return typeof voce === "string" ? voce : null;
      };
      return {
        localize: (chiave) => cerca(chiave) ?? sue.localize(chiave),
        format: (chiave, dati = {}) => {
          const testo = cerca(chiave);
          return testo === null ? sue.format(chiave, dati) : testo.replace(/\{([^}]+)\}/g, (tutto, nome) => (Object.hasOwn(dati, nome) ? String(dati[nome]) : tutto));
        }
      };
    } catch (errore) {
      console.warn(`${MODULE_ID} | Passaggio: il file di lingua ${lingua} non si legge.`, errore);
    }
  }
  return sue;
}

/** La finestra col rapporto. */
export async function mostraRapporto(pagina, { gioco = globalThis.game, diario = "", fermo = false, parole = null } = {}) {
  const voci = parole ?? { localize: (chiave) => gioco.i18n.localize(chiave), format: (chiave, dati) => gioco.i18n.format(chiave, dati) };
  const L = (chiave) => voci.localize(`M6.Passaggio.${chiave}`);
  const testa = fermo ? L("Fermo") : diario ? voci.format("M6.Passaggio.Finito", { nome: diario }) : "";
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
  const nostro = gioco.system?.id === MODULE_ID;
  const piano = await esamina({ gioco });
  const parole = await paroleDi(gioco);
  const L = (chiave) => parole.localize(`M6.Passaggio.${chiave}`);
  if (!nostro) {
    const mancanti = await fileMancanti(piano.percorsi);
    const pagina = rapportoHtml({ rapporto: piano.rapporto, lasciati: piano.lasciati, impostazioni: piano.impostazioni, compendi: Boolean(piano.compendi), mancanti }, { ...parole, esame: true });
    await mostraRapporto(`<p>${foundry.utils.escapeHTML(L("Esame"))}</p>${pagina}`, { gioco, parole });
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
 * Al pronto, dal primo Narratore: un passaggio a metà riprende, e un mondo
 * che viene dal modulo trova la finestra che propone il passaggio.
 */
export async function passaggioAlPronto(gioco = globalThis.game) {
  if (!gioco.user?.isGM || gioco.users?.activeGM?.id !== gioco.user.id) return;
  const stato = leggiStato(gioco);
  try {
    if (stato.inCorso) {
      await eseguiDallaFinestra(gioco);
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
