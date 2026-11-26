/**
 * Il passaggio dal modulo al sistema: l'esame di un mondo, senza Foundry.
 *
 * `pianoDelPassaggio` prende una fotografia del mondo (i dati dei documenti,
 * come li dà `fotografa` in esegui.js) e torna il piano: quali documenti
 * cambiano e come, quali restano com'erano, che cosa succede alle
 * impostazioni, e il rapporto da far leggere al Narratore. Non scrive
 * niente: lo stesso esame gira anche in un mondo che usa ancora il modulo,
 * per sapere prima che cosa farebbe il passaggio.
 *
 * La fotografia:
 *   raccolte      { actors: [{ fonte, invalido }], items: […], scenes: […], … }
 *   pacchi        [{ id, nome, documento, voci: [{ fonte, invalido }] }]   i compendi del mondo
 *   impostazioni  [{ id, key, value }]                               col valore già letto
 *   registrate    le chiavi che il sistema conosce, o null se non si sa
 */
import {
  aggiornamento,
  convertiAttore,
  convertiGenerico,
  convertiMessaggio,
  convertiOggetto,
  convertiParole,
  convertiScena,
  oggetto,
  uguali
} from "./converti.js";
import { IMPOSTAZIONE_COMPENDI, NUOVO, RACCOLTE, REGISTRO, TIPI_ATTORE, VECCHIO_MODULO, VECCHIO_SISTEMA } from "./regole.js";

/** I file del sistema nominati dentro un aggiornamento: servono a controllare che ci siano davvero. */
const PERCORSO = /systems\/m6\/[^"'\s)<>\\]+?\.(?:png|svg|webp|jpe?g|gif|mp3|ogg|wav|webm|mp4)/g;

/** Il tipo di una scheda, prima e dopo: lo usano i segnalini delle scene. */
function tipiDelleSchede(attori) {
  const tavola = new Map();
  for (const { fonte } of attori ?? []) {
    const tipo = String(fonte?.type ?? "");
    const nostro = tipo === "mago" || tipo === "png";
    const dopo = TIPI_ATTORE[tipo] ?? (nostro ? tipo : "");
    const prima = TIPI_ATTORE[tipo] ? tipo : String(fonte?.flags?.[NUOVO]?.[REGISTRO]?.da ?? tipo);
    tavola.set(fonte?._id, { prima, dopo });
  }
  return (id) => tavola.get(id) ?? null;
}

/** Vero se nel mondo c'è ancora una scheda col tipo di prima: il passaggio è da fare, o in corso. */
export function haSchedeDiPrima(mondo) {
  const schede = [...(mondo?.raccolte?.actors ?? []), ...(mondo?.pacchi ?? []).filter((pacco) => pacco.documento === "Actor").flatMap((pacco) => pacco.voci ?? [])];
  return schede.some(({ fonte }) => Boolean(TIPI_ATTORE[fonte?.type]));
}

/** Un'operazione su un documento, o niente se il documento resta com'è. */
function operazione({ raccolta, documento, pacco = "", fonte, dopo, invalido = false }) {
  const { cambia, togli } = aggiornamento(documento, fonte, dopo);
  if (!cambia && !togli.length) return null;
  return { raccolta, documento, pacco, id: fonte._id, nome: String(dopo?.name ?? fonte?.name ?? ""), invalido: Boolean(invalido), cambia, togli };
}

/** Le voci del rapporto che vengono dalle note di una scheda o di un segnalino. */
function annota(rapporto, di, note) {
  if (note.assorbite?.length) rapporto.assorbite.push({ di, voci: note.assorbite.map((voce) => ({ nome: voce.nome, pallini: voce.pallini })) });
  for (const scarto of note.scarti ?? []) rapporto.scarti.push({ di, nome: String(scarto.name ?? ""), tipo: String(scarto.type ?? ""), dadi: Math.trunc(Number(scarto.system?.dice) || 0) });
  for (const condizione of note.condizioni ?? []) rapporto.condizioni.push({ di, nome: String(condizione.name ?? ""), dadi: (condizione.dadi ?? []).map((voce) => ({ dadi: voce.dadi, tiri: voce.tiri })) });
  if (note.casi?.length) rapporto.casi.push({ di, nomi: note.casi });
  if (note.domini?.length) rapporto.domini.push({ di, sfere: note.domini });
  if (note.testi) rapporto.testi.push({ di, testi: note.testi });
}

/**
 * Una scheda, del mondo o di un compendio: l'operazione e le sue voci nel
 * rapporto. Una scheda col tipo di prima è chiusa comunque la dia Foundry
 * (dentro un compendio la apre lo stesso, ma non la lascia svuotare): prima
 * prende il tipo nuovo, e gli oggetti da togliere aspettano il giro dopo.
 */
function passaScheda(piano, { raccolta, pacco = "", fonte, invalido: comeLaDaFoundry }, { quando, inCorso }) {
  const invalido = Boolean(comeLaDaFoundry) || Boolean(TIPI_ATTORE[fonte?.type]);
  const esito = convertiAttore(fonte, { quando, inCorso, togliSubito: !invalido });
  const nome = String(fonte?.name ?? "");
  if (esito.lasciato) {
    piano.lasciati.push({ documento: "Actor", pacco, id: fonte?._id, nome, tipo: esito.note.da });
    return;
  }
  const op = operazione({ raccolta, documento: "Actor", pacco, fonte, dopo: esito.dati, invalido });
  if (!op) return;
  // Una scheda che Foundry non apre ancora non si può svuotare: gli oggetti da togliere aspettano il giro dopo.
  if (invalido && esito.togli.length) piano.aspettano = true;
  piano.operazioni.push(op);
  if (esito.note.portato) piano.rapporto.portati.push({ nome, da: esito.note.da, a: esito.note.a, pacco });
  annota(piano.rapporto, nome, esito.note);
}

/** Un oggetto, del mondo o di un compendio. */
function passaOggetto(piano, { raccolta, pacco = "", fonte, invalido }) {
  const esito = convertiOggetto(fonte);
  if (!esito.dati) {
    piano.lasciati.push({ documento: "Item", pacco, id: fonte?._id, nome: String(fonte?.name ?? ""), tipo: String(fonte?.type ?? "") });
    return;
  }
  const op = operazione({ raccolta, documento: "Item", pacco, fonte, dopo: esito.dati, invalido });
  if (op) piano.operazioni.push(op);
}

/** Le impostazioni: quelle del modulo passano, quelle del vecchio sistema restano. */
function passaImpostazioni(piano, mondo) {
  const registrate = Array.isArray(mondo.registrate) ? new Set(mondo.registrate) : null;
  for (const voce of mondo.impostazioni ?? []) {
    const chiave = String(voce?.key ?? "");
    if (chiave.startsWith(`${VECCHIO_MODULO}.`)) {
      const a = `${NUOVO}.${chiave.slice(VECCHIO_MODULO.length + 1)}`;
      const conosciuta = !registrate || registrate.has(a);
      piano.impostazioni.push({ id: voce.id, da: chiave, a, valore: convertiParole(voce.value), mossa: conosciuta ? "porta" : "resta" });
    } else if (chiave.startsWith(`${VECCHIO_SISTEMA}.`)) {
      piano.impostazioni.push({ id: voce.id, da: chiave, a: "", valore: undefined, mossa: "resta" });
    } else if (chiave === IMPOSTAZIONE_COMPENDI) {
      const prima = oggetto(voce.value);
      const dopo = Object.fromEntries(Object.entries(prima).map(([pacco, dati]) => [pacco.startsWith(`${VECCHIO_MODULO}.`) ? `${NUOVO}.${pacco.slice(VECCHIO_MODULO.length + 1)}` : pacco, dati]));
      if (!uguali(prima, dopo)) piano.compendi = dopo;
    }
  }
}

/**
 * Il piano del passaggio per un mondo fotografato.
 *
 * `quando` è la data che finisce nei registri. `inCorso` dice che il
 * passaggio sta avvenendo (di suo: finché nel mondo c'è una scheda col tipo
 * di prima); chi esegue lo tiene acceso anche nel secondo giro.
 */
export function pianoDelPassaggio(mondo, { quando = "", inCorso } = {}) {
  const adesso = inCorso ?? haSchedeDiPrima(mondo);
  const piano = {
    operazioni: [],
    impostazioni: [],
    compendi: null,
    lasciati: [],
    aspettano: false,
    rapporto: { portati: [], assorbite: [], scarti: [], condizioni: [], casi: [], domini: [], testi: [], segnalini: [], toccati: {}, nomi: {} },
    percorsi: [],
    daFare: false
  };
  const raccolte = oggetto(mondo?.raccolte);
  const tipi = tipiDelleSchede(raccolte.actors);
  const opzioni = { quando, inCorso: adesso };

  for (const voce of raccolte.actors ?? []) passaScheda(piano, { raccolta: "actors", ...voce }, opzioni);
  for (const voce of raccolte.items ?? []) passaOggetto(piano, { raccolta: "items", ...voce });

  // Le scene vengono dopo le schede: un segnalino si legge col tipo della sua scheda, e finché una scheda
  // non si apre i suoi segnalini aspettano.
  const schedeChiuse = piano.operazioni.some((op) => op.invalido);
  for (const { fonte, invalido } of raccolte.scenes ?? []) {
    const esito = convertiScena(fonte, tipi, { inCorso: adesso, togliSubito: true });
    const op = operazione({ raccolta: "scenes", documento: "Scene", fonte, dopo: esito.dati, invalido });
    if (!op) continue;
    piano.operazioni.push({ ...op, dopoLeSchede: schedeChiuse });
    for (const nota of esito.note) {
      const di = `${nota.segnalino} (${String(fonte?.name ?? "")})`;
      piano.rapporto.segnalini.push(di);
      annota(piano.rapporto, di, nota);
    }
  }
  if (schedeChiuse && piano.operazioni.some((op) => op.dopoLeSchede)) piano.aspettano = true;

  for (const { fonte, invalido } of raccolte.messages ?? []) {
    const op = operazione({ raccolta: "messages", documento: "ChatMessage", fonte, dopo: convertiMessaggio(fonte), invalido });
    if (op) piano.operazioni.push(op);
  }
  for (const [raccolta, documento] of Object.entries(RACCOLTE)) {
    if (["actors", "items", "scenes", "messages"].includes(raccolta)) continue;
    for (const { fonte, invalido } of raccolte[raccolta] ?? []) {
      const op = operazione({ raccolta, documento, fonte, dopo: convertiGenerico(documento, fonte), invalido });
      if (op) piano.operazioni.push(op);
    }
  }

  for (const pacco of mondo?.pacchi ?? []) {
    for (const voce of pacco.voci ?? []) {
      if (pacco.documento === "Actor") passaScheda(piano, { raccolta: "", pacco: pacco.id, ...voce }, opzioni);
      else if (pacco.documento === "Item") passaOggetto(piano, { raccolta: "", pacco: pacco.id, ...voce });
      else {
        const op = operazione({ raccolta: "", documento: pacco.documento, pacco: pacco.id, fonte: voce.fonte, dopo: convertiGenerico(pacco.documento, voce.fonte), invalido: voce.invalido });
        if (op) piano.operazioni.push(op);
      }
    }
  }

  passaImpostazioni(piano, oggetto(mondo));

  // Chi è stato toccato, raccolta per raccolta: il rapporto conta i documenti, non i giri.
  for (const op of piano.operazioni) {
    const dove = op.pacco || op.raccolta;
    (piano.rapporto.toccati[dove] ??= []).push(op.id);
  }
  for (const pacco of mondo?.pacchi ?? []) if (pacco.nome) piano.rapporto.nomi[pacco.id] = pacco.nome;
  const visti = new Set();
  for (const op of piano.operazioni) for (const percorso of JSON.stringify(op.cambia ?? {}).match(PERCORSO) ?? []) visti.add(percorso);
  piano.percorsi = [...visti].sort();
  piano.daFare = piano.operazioni.length > 0 || piano.impostazioni.some((voce) => voce.mossa === "porta") || Boolean(piano.compendi);
  return piano;
}

/** Le operazioni di un giro: nel primo quelle che non aspettano le schede, nel secondo le altre. */
export function operazioniDelGiro(piano) {
  return (piano?.operazioni ?? []).filter((op) => !op.dopoLeSchede);
}
