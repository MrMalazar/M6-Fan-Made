/**
 * Quando si entra dal telefono: la scelta è una funzione pura, così si prova
 * fuori da Foundry. Il telefono è una finestra stretta, oppure uno schermo
 * che si tocca e che ha un lato corto: così un telefono messo di traverso
 * resta un telefono, e un PC con lo schermo ingrandito resta un PC.
 */

/** Sotto questa misura, in punti dello schermo, il lato è «stretto». */
export const STRETTO_MAX = 700;

/** Le tre scelte dell'impostazione. */
export const SCELTE = Object.freeze(["auto", "sempre", "mai"]);

function misura(valore) {
  const numero = Number(valore);
  return Number.isFinite(numero) && numero > 0 ? numero : Infinity;
}

/**
 * @param {object} quadro
 * @param {string} quadro.scelta     l'impostazione: «auto», «sempre», «mai»
 * @param {boolean} quadro.intero    il Foundry intero chiesto per questa visita
 * @param {number} quadro.finestra   la larghezza della finestra
 * @param {number[]} quadro.schermo  i due lati dello schermo
 * @param {boolean} quadro.tocco     lo schermo si tocca (puntatore grosso)
 * @returns {boolean} vero se si mostra la pagina del telefono
 */
export function modoTelefono({ scelta = "auto", intero = false, finestra, schermo = [], tocco = false } = {}) {
  if (intero) return false;
  if (scelta === "sempre") return true;
  if (scelta === "mai") return false;
  if (misura(finestra) <= STRETTO_MAX) return true;
  const latoCorto = Math.min(...[...schermo].map(misura), Infinity);
  return Boolean(tocco) && latoCorto <= STRETTO_MAX;
}

/**
 * Cosa fare della mappa all'avvio. Sul telefono si spegne, e si segna che
 * l'abbiamo spenta noi; dove non è più un telefono si riaccende, ma solo se
 * a spegnerla eravamo stati noi: chi l'ha spenta di suo la ritrova spenta.
 *
 * @param {object} quadro
 * @param {boolean} quadro.telefono  la pagina del telefono è accesa
 * @param {boolean} quadro.spenta    la mappa di Foundry è già spenta
 * @param {boolean} quadro.nostra    l'avevamo spenta noi
 * @returns {{spenta?: boolean, nostra?: boolean}} solo quello che va scritto
 */
export function mossaMappa({ telefono = false, spenta = false, nostra = false } = {}) {
  if (telefono) return spenta ? {} : { spenta: true, nostra: true };
  if (!nostra) return {};
  return spenta ? { spenta: false, nostra: false } : { nostra: false };
}
