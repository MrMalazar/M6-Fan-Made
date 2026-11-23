/**
 * La riserva e la lettura di un tiro (il Sistema, voci Riserva, Tiro,
 * Successo, Margine). I conti veri stanno in sistema.js, che arriva dal
 * modulo com'è: qui si mettono in fila per la scheda, la carta e il
 * telefono. Funzioni pure, senza Foundry.
 */
import { RISERVE_PNG, TUTTE_ABILITA, TUTTI_ATTRIBUTI } from "./costanti.js";
import { contaSuccessi, dadiDelTiro, esito, faccia, SOGLIA_ABILITA_MAX, SOGLIA_MIN } from "./sistema.js";

function conta(valore) {
  return Math.max(Math.trunc(Number(valore) || 0), 0);
}

/** La riserva di un tiro di Abilità: Attributo più Abilità. Senza la coppia intera non c'è riserva. */
export function riservaAbilita(sistema, attributo, abilita) {
  const pronto = TUTTI_ATTRIBUTI.includes(attributo) && TUTTE_ABILITA.includes(abilita);
  const daAttributo = pronto ? conta(sistema?.attributi?.[attributo]?.valore) : 0;
  const daAbilita = pronto ? conta(sistema?.abilita?.[abilita]?.valore) : 0;
  return { pronto, attributo: daAttributo, abilita: daAbilita, dadi: dadiDelTiro({ tratti: daAttributo + daAbilita }).dadi };
}

/** La riserva di un PNG: i dadi scritti nel campo scelto. */
export function riservaPng(sistema, campo) {
  const pronto = RISERVE_PNG.includes(campo);
  return { pronto, dadi: pronto ? dadiDelTiro({ tratti: conta(sistema?.riserve?.[campo]?.dadi) }).dadi : 0 };
}

/** La soglia di un tiro di Abilità si scrive intera, da 1 a 7: altrimenti non è una soglia. */
export function sogliaValida(valore) {
  const numero = Number(valore);
  return Number.isInteger(numero) && numero >= SOGLIA_MIN && numero <= SOGLIA_ABILITA_MAX;
}

/**
 * Legge i dadi usciti contro la soglia: le facce una per una, i successi
 * (le stelline a coppie), se riesce, il margine e i successi che mancano.
 */
export function leggiTiro(risultati = [], soglia = SOGLIA_MIN) {
  const numeri = (Array.isArray(risultati) ? risultati : [])
    .map((numero) => Math.trunc(Number(numero) || 0))
    .filter((numero) => numero >= 1 && numero <= 10);
  const conto = contaSuccessi(numeri);
  return { ...conto, ...esito({ successi: conto.successi, soglia }), risultati: numeri, facce: numeri.map((numero) => faccia(numero)) };
}
