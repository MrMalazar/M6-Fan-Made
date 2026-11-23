/**
 * La Salute: un tracciato solo per il corpo e per la mente (il Sistema, voce
 * Salute). I conti sono quelli del modulo wod5e-mage: quattro segni (fisico
 * e mentale, superficiale e aggravato) e le caselle del Mago a
 * 2 + Costituzione + Fermezza. Funzioni pure, senza Foundry.
 */

/** I quattro segni: fisico superficiale e aggravato, mentale superficiale e aggravato. */
export const SEGNI = Object.freeze(["ps", "pa", "ms", "ma"]);

/** L'ordine dei conti quando il posto non basta: prima i fisici, poi i mentali, e in ognuno prima gli aggravati. */
export const ORDINE = Object.freeze(["pa", "ps", "ma", "ms"]);

/** Le caselle di base del Mago, prima di Costituzione e Fermezza. */
export const SALUTE_BASE = 2;

function conta(valore) {
  return Math.max(Math.trunc(Number(valore) || 0), 0);
}

function intero(valore) {
  return Math.trunc(Number(valore) || 0);
}

/** Le caselle del Mago: 2 + Costituzione + Fermezza, più quelle segnate a mano. Mai meno di una. */
export function caselleMago({ costituzione = 0, fermezza = 0, extra = 0 } = {}) {
  return Math.max(SALUTE_BASE + conta(costituzione) + conta(fermezza) + intero(extra), 1);
}

/** Le caselle del PNG: il numero scritto sulla sua scheda. Mai meno di una. */
export function casellePng(caselle) {
  return Math.max(conta(caselle), 1);
}

/** I quattro conti, ripuliti. */
export function conti(salute = {}) {
  return { pa: conta(salute.pa), ps: conta(salute.ps), ma: conta(salute.ma), ms: conta(salute.ms) };
}

/** Riporta i conti dentro il tracciato, nell'ordine dei conti: quello che non ci sta si lascia fuori. */
export function stringi(salute, caselle) {
  const dopo = conti(salute);
  let posto = Math.max(caselle, 0);
  for (const segno of ORDINE) {
    dopo[segno] = Math.min(dopo[segno], posto);
    posto -= dopo[segno];
  }
  return dopo;
}

/**
 * Come si dipinge il tracciato: i danni fisici da sinistra (aggravati, poi
 * superficiali), quelli mentali da destra (aggravati all'estremo, poi
 * superficiali verso il centro). Torna lo stato di ogni casella, da sinistra.
 */
export function dipingi(salute, caselle) {
  const celle = Array.from({ length: Math.max(caselle, 0) }, () => "");
  const dati = conti(salute);
  const sinistra = [...Array.from({ length: dati.pa }, () => "pa"), ...Array.from({ length: dati.ps }, () => "ps")];
  const destra = [...Array.from({ length: dati.ma }, () => "ma"), ...Array.from({ length: dati.ms }, () => "ms")];
  sinistra.slice(0, celle.length).forEach((stato, indice) => { celle[indice] = stato; });
  destra.slice(0, celle.length - Math.min(sinistra.length, celle.length)).forEach((stato, indice) => { celle[celle.length - 1 - indice] = stato; });
  return celle;
}

/** Lo stato del tracciato: «menomato» a tracciato coperto, «ko-fisico» o «ko-mentale» a tutte aggravate. */
export function stato(salute, caselle) {
  const dati = conti(salute);
  const totale = dati.pa + dati.ps + dati.ma + dati.ms;
  const aggravati = dati.pa + dati.ma;
  if (caselle > 0 && aggravati >= caselle) return dati.pa >= dati.ma ? "ko-fisico" : "ko-mentale";
  if (caselle > 0 && totale >= caselle) return "menomato";
  return "";
}

/**
 * Un segno in più o in meno. Il segno in più entra solo se c'è una casella
 * libera; quello in meno si ferma a zero. Torna i conti nuovi.
 */
export function ritocca(salute, caselle, segno, passo) {
  const adesso = stringi(salute, caselle);
  if (!SEGNI.includes(segno)) return adesso;
  const totale = adesso.pa + adesso.ps + adesso.ma + adesso.ms;
  const mossa = intero(passo);
  if (mossa > 0 && totale >= caselle) return adesso;
  return { ...adesso, [segno]: Math.max(adesso[segno] + mossa, 0) };
}
