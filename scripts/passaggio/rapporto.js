/**
 * Il passaggio dal modulo al sistema: il rapporto, senza Foundry.
 *
 * Dal piano (piano.js) escono due pagine: i conti da mostrare prima di
 * partire, e il rapporto di quello che è successo, che resta in un diario
 * del mondo. Le parole vengono dai file di lingua (`M6.Passaggio.*`).
 */
import { protetta } from "./converti.js";

const LISTE = ["portati", "assorbite", "scarti", "condizioni", "casi", "domini", "testi", "segnalini"];

/** Un rapporto vuoto. */
export function rapportoVuoto() {
  return { portati: [], assorbite: [], scarti: [], condizioni: [], casi: [], domini: [], testi: [], segnalini: [], toccati: {}, nomi: {} };
}

/**
 * Due rapporti in uno: quello dei giri fatti e quello del giro di adesso.
 * Una voce detta due volte (un giro ripetuto) resta una, e un documento
 * toccato in due giri si conta una volta.
 */
export function unisciRapporti(prima, adesso) {
  const a = { ...rapportoVuoto(), ...(prima ?? {}) };
  const b = { ...rapportoVuoto(), ...(adesso ?? {}) };
  const esito = rapportoVuoto();
  for (const lista of LISTE) {
    const viste = new Set();
    for (const voce of [...(a[lista] ?? []), ...(b[lista] ?? [])]) {
      const impronta = JSON.stringify(voce);
      if (viste.has(impronta)) continue;
      viste.add(impronta);
      esito[lista].push(voce);
    }
  }
  for (const toccati of [a.toccati, b.toccati]) for (const [dove, ids] of Object.entries(toccati ?? {})) esito.toccati[dove] = [...new Set([...(esito.toccati[dove] ?? []), ...ids])];
  esito.nomi = { ...a.nomi, ...b.nomi };
  return esito;
}

/** Quanti documenti tocca un rapporto, raccolta per raccolta. */
export function contiDi(rapporto) {
  return Object.fromEntries(Object.entries(rapporto?.toccati ?? {}).map(([dove, ids]) => [dove, new Set(ids).size]));
}

/** I conti di un piano, una riga per raccolta: `[{ voce, quanti }]`. */
export function contiDelPiano(piano, { localize = (chiave) => chiave, format = (chiave) => chiave } = {}) {
  const righe = [];
  for (const [dove, quanti] of Object.entries(contiDi(piano?.rapporto))) {
    const chiave = `M6.Passaggio.Conti.${dove}`;
    const nome = localize(chiave);
    righe.push({ voce: nome === chiave ? format("M6.Passaggio.Conti.pacco", { nome: piano?.rapporto?.nomi?.[dove] ?? dove }) : nome, quanti });
  }
  const impostazioni = (piano?.impostazioni ?? []).filter((voce) => voce.mossa === "porta").length + (piano?.compendi ? 1 : 0);
  if (impostazioni) righe.push({ voce: localize("M6.Passaggio.Conti.impostazioni"), quanti: impostazioni });
  return righe;
}

/** Il nome di un tipo, o il tipo com'è scritto se nei file di lingua non c'è. */
function nomeTipo(tipo, localize) {
  const chiave = `M6.Passaggio.Tipi.${tipo}`;
  const nome = localize(chiave);
  return nome === chiave ? String(tipo ?? "") : nome;
}

/** Una tavola: i titoli e le righe, già protette. */
function tavola(titoli, righe) {
  const testa = titoli.map((titolo) => `<th>${protetta(titolo)}</th>`).join("");
  const corpo = righe.map((riga) => `<tr>${riga.map((cella) => `<td>${cella}</td>`).join("")}</tr>`).join("");
  return `<table class="m6-passaggio-tavola"><thead><tr>${testa}</tr></thead><tbody>${corpo}</tbody></table>`;
}

/** Una sezione col suo titolo, o niente se non ha righe. */
function sezione(titolo, nota, corpo) {
  if (!corpo) return "";
  return `<section class="m6-passaggio-sezione"><h3>${protetta(titolo)}</h3>${nota ? `<p class="m6-passaggio-nota">${protetta(nota)}</p>` : ""}${corpo}</section>`;
}

/** I dadi scritti di una Condizione, in una riga: «−2 Fisico». */
function dadiInParole(dadi, localize) {
  return (dadi ?? []).map((voce) => {
    const tiri = (voce.tiri ?? []).includes("all") ? localize("M6.Passaggio.Tutti") : (voce.tiri ?? []).map((id) => localize(`M6.Comuni.Campi.${id}`)).join(", ");
    return `−${Math.abs(voce.dadi)} ${tiri}`.trim();
  }).join("; ");
}

/**
 * Quello che il passaggio farebbe, per la finestra che lo propone: i conti,
 * chi resta com'è e l'avviso. Torna il pezzo di pagina.
 */
export function propostaHtml(piano, { localize = (chiave) => chiave, format = (chiave) => chiave, esame = false } = {}) {
  const conti = contiDelPiano(piano, { localize, format });
  const pezzi = [`<div class="m6-passaggio">`, `<p>${protetta(localize(esame ? "M6.Passaggio.Esame" : "M6.Passaggio.Apri"))}</p>`];
  if (conti.length) pezzi.push(tavola([localize("M6.Passaggio.Cosa"), localize("M6.Passaggio.Quanti")], conti.map((riga) => [protetta(riga.voce), String(riga.quanti)])));
  else pezzi.push(`<p>${protetta(localize("M6.Passaggio.Niente"))}</p>`);
  if (piano?.lasciati?.length) {
    pezzi.push(sezione(localize("M6.Passaggio.Sezioni.Lasciati"), localize("M6.Passaggio.Note.Lasciati"), tavola([localize("M6.Passaggio.Nome"), localize("M6.Passaggio.Tipo")], piano.lasciati.map((voce) => [protetta(voce.nome), protetta(nomeTipo(voce.tipo, localize))]))));
  }
  if (!esame && conti.length) pezzi.push(`<p class="m6-passaggio-avviso">${protetta(localize("M6.Passaggio.Copia"))}</p>`);
  pezzi.push("</div>");
  return pezzi.join("");
}

/**
 * Il rapporto di un passaggio fatto (o, con `esame`, di quello che
 * succederebbe): una sezione per ogni cosa da sapere, e niente per le cose
 * che non sono successe.
 *
 *   rapporto      quello del piano (o dei piani, uniti)
 *   lasciati      i documenti rimasti com'erano
 *   impostazioni  le mosse del piano sulle impostazioni
 *   compendi      vero se è passata anche la disposizione dei compendi
 *   mancanti      i file del sistema che non rispondono
 *   errori        `[{ nome, documento, errore }]`
 *   rimasti       i documenti ancora da portare, se il passaggio si è fermato prima
 */
export function rapportoHtml({ rapporto = rapportoVuoto(), lasciati = [], impostazioni = [], compendi = false, mancanti = [], errori = [], rimasti = [] } = {}, { localize = (chiave) => chiave, format = (chiave) => chiave, esame = false } = {}) {
  const r = { ...rapportoVuoto(), ...rapporto };
  const L = (chiave) => localize(`M6.Passaggio.${chiave}`);
  const pezzi = [`<div class="m6-passaggio">`];
  const conti = contiDelPiano({ rapporto: r, impostazioni, compendi }, { localize, format });
  pezzi.push(sezione(L(esame ? "Sezioni.DaFare" : "Sezioni.Fatto"), "", conti.length ? tavola([L("Cosa"), L("Quanti")], conti.map((riga) => [protetta(riga.voce), String(riga.quanti)])) : ""));
  pezzi.push(sezione(L("Sezioni.Portati"), "", r.portati.length ? tavola([L("Nome"), L("Era"), L("Adesso")], r.portati.map((voce) => [protetta(voce.nome), protetta(nomeTipo(voce.da, localize)), protetta(nomeTipo(voce.a, localize))])) : ""));
  pezzi.push(sezione(L("Sezioni.Assorbite"), L("Note.Assorbite"), r.assorbite.length ? tavola([L("DiChi"), L("Abilita")], r.assorbite.map((voce) => [protetta(voce.di), protetta(voce.voci.map((riga) => `${riga.nome} ${riga.pallini}`).join(", "))])) : ""));
  pezzi.push(sezione(L("Sezioni.Condizioni"), L("Note.Condizioni"), r.condizioni.length ? tavola([L("DiChi"), L("Condizione"), L("Dadi")], r.condizioni.map((voce) => [protetta(voce.di), protetta(voce.nome), protetta(dadiInParole(voce.dadi, localize))])) : ""));
  pezzi.push(sezione(L("Sezioni.Casi"), L("Note.Casi"), r.casi.length ? tavola([L("DiChi"), L("Casi")], r.casi.map((voce) => [protetta(voce.di), protetta(voce.nomi.join(", "))])) : ""));
  pezzi.push(sezione(L("Sezioni.Domini"), L("Note.Domini"), r.domini.length ? tavola([L("DiChi"), L("Sfere")], r.domini.map((voce) => [protetta(voce.di), protetta(voce.sfere.map((id) => localize(`M6.Spheres.${id}`)).join(", "))])) : ""));
  pezzi.push(sezione(L("Sezioni.Scarti"), L("Note.Scarti"), r.scarti.length ? tavola([L("DiChi"), L("Oggetto"), L("Tipo")], r.scarti.map((voce) => [protetta(voce.di), protetta(voce.dadi ? `${voce.nome} (${voce.dadi})` : voce.nome), protetta(nomeTipo(voce.tipo, localize))])) : ""));
  pezzi.push(sezione(L("Sezioni.Testi"), L("Note.Testi"), r.testi.length ? `<p>${protetta(r.testi.map((voce) => voce.di).join(", "))}</p>` : ""));
  pezzi.push(sezione(L("Sezioni.Lasciati"), L("Note.Lasciati"), lasciati.length ? tavola([L("Nome"), L("Tipo")], lasciati.map((voce) => [protetta(voce.nome), protetta(nomeTipo(voce.tipo, localize))])) : ""));
  const restano = [...new Set(impostazioni.filter((voce) => voce.mossa === "resta").map((voce) => voce.da))];
  pezzi.push(sezione(L("Sezioni.Impostazioni"), L("Note.Impostazioni"), restano.length ? `<p>${protetta(restano.join(", "))}</p>` : ""));
  pezzi.push(sezione(L("Sezioni.Mancanti"), L("Note.Mancanti"), mancanti.length ? `<ul>${mancanti.map((percorso) => `<li>${protetta(percorso)}</li>`).join("")}</ul>` : ""));
  pezzi.push(sezione(L("Sezioni.Rimasti"), L("Note.Rimasti"), rimasti.length ? `<p>${protetta(rimasti.map((voce) => voce.nome).join(", "))}</p>` : ""));
  pezzi.push(sezione(L("Sezioni.Errori"), L("Note.Errori"), errori.length ? tavola([L("Nome"), L("Errore")], errori.map((voce) => [protetta(voce.nome), protetta(voce.errore)])) : ""));
  pezzi.push("</div>");
  return pezzi.join("");
}

/**
 * I testi scritti a mano sulle schede di prima che la scheda nuova non
 * mostra (la biografia di wod5e, le note, l'aspetto): una pagina a parte del
 * diario, scheda per scheda, così restano da leggere. Vuota se non ce ne sono.
 */
export function testiHtml(rapporto, { localize = (chiave) => chiave } = {}) {
  const voci = rapporto?.testi ?? [];
  if (!voci.length) return "";
  const pezzi = [`<div class="m6-passaggio">`];
  for (const voce of voci) {
    pezzi.push(`<h3>${protetta(voce.di)}</h3>`);
    for (const [chiave, testo] of Object.entries(voce.testi ?? {})) {
      const nome = localize(`M6.Passaggio.Testi.${chiave}`);
      pezzi.push(`<h4>${protetta(nome === `M6.Passaggio.Testi.${chiave}` ? chiave : nome)}</h4>`, /<[a-z][^>]*>/i.test(testo) ? testo : `<p>${protetta(testo)}</p>`);
    }
  }
  pezzi.push("</div>");
  return pezzi.join("");
}
