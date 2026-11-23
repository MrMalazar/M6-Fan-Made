/**
 * La tavola dei tratti: quali Attributi e quali Abilità ha una scheda, in
 * che campo stanno e come si chiamano. Chi cambia la lista cambia questa
 * tavola: i dati della scheda, i pallini e i tiri la leggono da qui.
 *
 * Le chiavi sono quelle che usano il motore delle regole e l'app
 * (strength, athletics…): i nomi che si leggono stanno nel file di lingua.
 */
export const CAMPI = Object.freeze(["physical", "social", "mental"]);

export const ATTRIBUTI = Object.freeze({
  physical: Object.freeze(["strength", "dexterity", "stamina"]),
  social: Object.freeze(["charisma", "manipulation", "composure"]),
  mental: Object.freeze(["intelligence", "wits", "resolve"])
});

export const ABILITA = Object.freeze({
  physical: Object.freeze(["athletics", "brawl", "craft", "firearms", "larceny", "survival"]),
  social: Object.freeze(["performance", "persuasion", "subterfuge"]),
  mental: Object.freeze(["academics", "awareness", "investigation", "medicine", "occult"])
});

export const TUTTI_ATTRIBUTI = Object.freeze(Object.values(ATTRIBUTI).flat());
export const TUTTE_ABILITA = Object.freeze(Object.values(ABILITA).flat());

export const ATTRIBUTO_MIN = 1;
export const ATTRIBUTO_MAX = 5;
export const ABILITA_MIN = 0;
export const ABILITA_MAX = 5;

/** Le chiavi della 0.1.0, per le schede nate allora: vecchia → nuova. */
export const DALLA_PRIMA = Object.freeze({
  campi: Object.freeze({ fisico: "physical", sociale: "social", mentale: "mental" }),
  attributi: Object.freeze({
    forza: "strength", destrezza: "dexterity", costituzione: "stamina",
    carisma: "charisma", persuasione: "manipulation", autocontrollo: "composure",
    intelligenza: "intelligence", prontezza: "wits", fermezza: "resolve"
  }),
  abilita: Object.freeze({
    atletica: "athletics", mischia: "brawl", manualita: "craft", mira: "firearms", criminalita: "larceny", sopravvivenza: "survival",
    arte: "performance", convincere: "persuasion", sotterfugio: "subterfuge",
    conoscenze: "academics", allerta: "awareness", investigare: "investigation", medicina: "medicine", velo: "occult"
  })
});

/** Il nome di un tratto, come chiave del file di lingua. */
export function nomeAttributo(id) {
  return `M6.Comuni.Attributi.${id}`;
}
export function nomeAbilita(id) {
  return `M6.Comuni.Abilita.${id}`;
}
export function nomeCampo(id) {
  return `M6.Comuni.Campi.${id}`;
}

/** Le voci di un campo come le vuole la scheda: `{ id, value, displayName, ... }`. */
export function vociDeiTratti(tavola, dati, nome, localize = (chiave) => chiave) {
  return Object.fromEntries(Object.entries(tavola).map(([campo, lista]) => [
    campo,
    lista.map((id) => ({ ...(dati?.[id] ?? {}), id, value: Math.trunc(Number(dati?.[id]?.value) || 0), displayName: localize(nome(id)) }))
  ]));
}
