/**
 * Le costanti del sistema di Foundry: la sigla del pacchetto e le liste dei
 * tratti, coi nomi del Sistema (il documento delle regole). Qui non c'è
 * niente di Foundry: lo leggono anche le prove.
 */

/** La sigla del pacchetto: finisce scritta dentro ogni mondo, quindi non cambia. */
export const ID = "m6";

/** I tre campi: valgono per gli Attributi, per le Abilità e per le riserve del PNG. */
export const CAMPI = Object.freeze(["fisico", "sociale", "mentale"]);

/** I nove Attributi nei tre campi del Sistema. Vanno da 1 a 5. */
export const ATTRIBUTI = Object.freeze({
  fisico: Object.freeze(["forza", "destrezza", "costituzione"]),
  sociale: Object.freeze(["carisma", "persuasione", "autocontrollo"]),
  mentale: Object.freeze(["intelligenza", "prontezza", "fermezza"])
});

/** Le quattordici Abilità, raggruppate come sulla scheda di Foundry. Vanno da 0 a 5. */
export const ABILITA = Object.freeze({
  fisico: Object.freeze(["atletica", "criminalita", "manualita", "mira", "mischia", "sopravvivenza"]),
  sociale: Object.freeze(["arte", "convincere", "sotterfugio"]),
  mentale: Object.freeze(["allerta", "conoscenze", "investigare", "medicina", "velo"])
});

export const TUTTI_ATTRIBUTI = Object.freeze(Object.values(ATTRIBUTI).flat());
export const TUTTE_ABILITA = Object.freeze(Object.values(ABILITA).flat());

export const ATTRIBUTO_MIN = 1;
export const ATTRIBUTO_MAX = 5;
export const ABILITA_MIN = 0;
export const ABILITA_MAX = 5;

/** Le tre riserve del PNG: i dadi che tira lui, campo per campo. */
export const RISERVE_PNG = CAMPI;

/** Il tetto dei dadi che si scrivono nella riserva di un PNG: un argine, non una regola. */
export const RISERVA_PNG_MAX = 30;

/** Gli argini delle caselle di Salute: quelle scritte del PNG e quelle in più del Mago. */
export const CASELLE_PNG_MAX = 40;
export const CASELLE_EXTRA_MAX = 20;
