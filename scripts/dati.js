/**
 * I dati che Foundry tiene per ogni scheda e per ogni tiro. Coi nomi del
 * Sistema, senza passare dai campi di un altro gioco:
 *
 *   Mago   system.attributi.<id>.valore   da 1 a 5
 *          system.abilita.<id>.valore     da 0 a 5
 *          system.salute.{ps,pa,ms,ma}    i danni segnati, per segno
 *          system.salute.extra            le caselle in più, segnate a mano
 *   PNG    system.riserve.<campo>.dadi    i dadi che tira lui
 *          system.salute.{ps,pa,ms,ma}    come il Mago
 *          system.salute.caselle          le caselle, scritte sulla scheda
 *   Tiro   (messaggio di chat) con cosa si è tirato, la soglia, i dadi usciti
 *
 * Su tutti e due `system.salute.caselle` dice quante caselle ha il
 * tracciato e `system.salute.stato` se è coperto: sul Mago sono conti
 * (2 + Costituzione + Fermezza), sul PNG il numero è scritto.
 */
import {
  ABILITA_MAX, ABILITA_MIN, ATTRIBUTO_MAX, ATTRIBUTO_MIN, CASELLE_EXTRA_MAX, CASELLE_PNG_MAX,
  RISERVA_PNG_MAX, RISERVE_PNG, TUTTE_ABILITA, TUTTI_ATTRIBUTI
} from "./costanti.js";
import { caselleMago, casellePng, SEGNI, stato, stringi } from "./salute.js";

const { ArrayField, NumberField, SchemaField, StringField } = foundry.data.fields;
const { TypeDataModel } = foundry.abstract;

/** Un numero intero che c'è sempre. */
function intero(opzioni = {}) {
  return new NumberField({ required: true, nullable: false, integer: true, initial: 0, ...opzioni });
}

/** Una parola che può mancare. */
function parola() {
  return new StringField({ required: true, blank: true, initial: "" });
}

/** Un tratto per ogni voce della lista, ognuno col suo valore. */
function tratti(lista, opzioni) {
  return new SchemaField(Object.fromEntries(lista.map((id) => [id, new SchemaField({ valore: intero(opzioni) })])));
}

/** I quattro conti dei danni. */
function segni() {
  return Object.fromEntries(SEGNI.map((segno) => [segno, intero({ min: 0 })]));
}

/** Tiene i danni dentro il tracciato e scrive caselle e stato accanto ai conti. */
function rifinisciSalute(salute, caselle) {
  Object.assign(salute, stringi(salute, caselle));
  salute.caselle = caselle;
  salute.stato = stato(salute, caselle);
}

export class MagoData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      attributi: tratti(TUTTI_ATTRIBUTI, { min: ATTRIBUTO_MIN, max: ATTRIBUTO_MAX, initial: ATTRIBUTO_MIN }),
      abilita: tratti(TUTTE_ABILITA, { min: ABILITA_MIN, max: ABILITA_MAX, initial: ABILITA_MIN }),
      salute: new SchemaField({ ...segni(), extra: intero({ min: -CASELLE_EXTRA_MAX, max: CASELLE_EXTRA_MAX }) })
    };
  }

  /** @override */
  prepareDerivedData() {
    rifinisciSalute(this.salute, caselleMago({
      costituzione: this.attributi.costituzione.valore,
      fermezza: this.attributi.fermezza.valore,
      extra: this.salute.extra
    }));
  }
}

export class PngData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      riserve: new SchemaField(Object.fromEntries(RISERVE_PNG.map((campo) => [campo, new SchemaField({ dadi: intero({ min: 0, max: RISERVA_PNG_MAX }) })]))),
      salute: new SchemaField({ ...segni(), caselle: intero({ min: 1, max: CASELLE_PNG_MAX, initial: 1 }) })
    };
  }

  /** @override */
  prepareDerivedData() {
    rifinisciSalute(this.salute, casellePng(this.salute.caselle));
  }
}

/** Il tiro in chat: la carta si disegna da qui a ogni lettura. */
export class TiroData extends TypeDataModel {
  /** @override */
  static defineSchema() {
    return {
      attributo: parola(),
      abilita: parola(),
      campo: parola(),
      soglia: intero({ min: 1, initial: 1 }),
      risultati: new ArrayField(new NumberField({ required: true, nullable: false, integer: true, min: 1, max: 10 }))
    };
  }
}
