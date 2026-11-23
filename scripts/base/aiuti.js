/**
 * Gli aiuti dei modelli: i tre che le pagine della scheda usano oltre a
 * quelli di Foundry.
 *
 *   {{#numLoop 5}} … {{this}} … {{/numLoop}}     ripete, contando da 0
 *   {{#ifnoteq a b}} … {{else}} … {{/ifnoteq}}   se i due sono diversi
 *   (isNotEmpty oggetto)                         se l'oggetto ha almeno una voce
 */
export function registraAiuti(handlebars = globalThis.Handlebars) {
  handlebars.registerHelper("numLoop", function (quanti, options) {
    let esito = "";
    for (let indice = 0; indice < (Math.trunc(Number(quanti)) || 0); indice += 1) esito += options.fn(indice);
    return esito;
  });
  handlebars.registerHelper("ifnoteq", function (a, b, options) {
    return a !== b ? options.fn(this) : options.inverse(this);
  });
  handlebars.registerHelper("isNotEmpty", (valore) => Boolean(valore) && typeof valore === "object" && Object.keys(valore).length > 0);
}

/** I pezzi di modello che altri modelli richiamano per nome. */
export const PEZZI_COMUNI = Object.freeze([
  "systems/m6/templates/base/lucchetto.hbs",
  "systems/m6/templates/base/modificatori.hbs"
]);
