/**
 * Il tiro semplice, senza Foundry: quanti dadi mette una scheda e come si
 * legge quello che è uscito. Lo usano la porta del telefono e le macro; la
 * scheda del Mago ha il suo tiro, con Specializzazioni, Condizioni e Magick.
 */
import { contaSuccessi, dadiDelTiro, esito, faccia, SOGLIA_ABILITA_MAX, SOGLIA_MIN } from "../sistema.js";
import { CAMPI, TUTTE_ABILITA, TUTTI_ATTRIBUTI } from "./tratti.js";

function conta(valore) {
  return Math.max(Math.trunc(Number(valore) || 0), 0);
}

/** La riserva del Mago: un Attributo più un'Abilità. */
export function riservaAbilita(sistema, attributo, abilita) {
  const pronto = TUTTI_ATTRIBUTI.includes(attributo) && TUTTE_ABILITA.includes(abilita);
  const daAttributo = pronto ? conta(sistema?.attributes?.[attributo]?.value) : 0;
  const daAbilita = pronto ? conta(sistema?.skills?.[abilita]?.value) : 0;
  return { pronto, attributo: daAttributo, abilita: daAbilita, dadi: dadiDelTiro({ tratti: daAttributo + daAbilita }).dadi };
}

/** La riserva del PNG: i dadi scritti nel campo. */
export function riservaPng(sistema, campo) {
  const pronto = CAMPI.includes(campo);
  return { pronto, dadi: pronto ? dadiDelTiro({ tratti: conta(sistema?.standarddicepools?.[campo]?.value) }).dadi : 0 };
}

/** La soglia di un tiro di Abilità: un intero fra il minimo e il tetto del Sistema. */
export function sogliaValida(valore) {
  const numero = Number(valore);
  return Number.isInteger(numero) && numero >= SOGLIA_MIN && numero <= SOGLIA_ABILITA_MAX;
}

/** I dadi usciti letti col Sistema: successi, esito, facce. */
export function leggiTiro(risultati = [], soglia = SOGLIA_MIN) {
  const numeri = (Array.isArray(risultati) ? risultati : [])
    .map((numero) => Math.trunc(Number(numero) || 0))
    .filter((numero) => numero >= 1 && numero <= 10);
  const conto = contaSuccessi(numeri);
  return { ...conto, ...esito({ successi: conto.successi, soglia }), risultati: numeri, facce: numeri.map((numero) => faccia(numero)) };
}
