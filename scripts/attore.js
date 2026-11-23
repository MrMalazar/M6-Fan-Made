import { getSalute } from "./salute.js";

/**
 * L'attore del sistema. Per ora porta una cosa sola: la Salute in una forma
 * che le barre dei token sanno leggere, cioè quante caselle restano libere e
 * quante sono in tutto. I danni si segnano sempre dalla scheda, dove si
 * sceglie il tipo: la barra si legge e basta, e Foundry la tiene spenta da
 * sola perché il dato non sta fra quelli salvati.
 */

/** Il nome del dato per le barre: `system.salute`. */
export const BARRA_SALUTE = "salute";

/** Caselle libere e caselle totali, dal conto della Salute. */
export function saluteDellaBarra(salute) {
  const max = Math.max(Math.trunc(Number(salute?.max) || 0), 0);
  const total = Math.max(Math.trunc(Number(salute?.total) || 0), 0);
  return { value: Math.max(max - total, 0), max };
}

/** I dati che un token può seguire, per tipo di attore: la tendina delle barre mostra questi. */
export const DATI_DEI_TOKEN = Object.freeze({
  mago: Object.freeze({ bar: [BARRA_SALUTE], value: [] }),
  png: Object.freeze({ bar: [BARRA_SALUTE], value: [] })
});

export function registraAttore() {
  class AttoreM6 extends CONFIG.Actor.documentClass {
    prepareDerivedData() {
      super.prepareDerivedData();
      this.system[BARRA_SALUTE] = saluteDellaBarra(getSalute(this));
    }
  }
  CONFIG.Actor.documentClass = AttoreM6;
  CONFIG.Actor.trackableAttributes = { ...DATI_DEI_TOKEN };
  return AttoreM6;
}
