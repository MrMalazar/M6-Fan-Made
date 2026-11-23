import { MODULE_ID } from "./constants.js";
import { NEMICO_FLAG, vociCreazione } from "./nemico.js";

/**
 * La finestra «Crea attore» di Foundry, con un'aggiunta: il PNG di M6, una
 * voce per Natura (Blue, 1/10: «quando creo l'attore direttamente nella barra
 * destra di Foundry»). Ogni voce crea una scheda di tipo `png` che nasce già
 * con la sua Natura, così il Narratore non deve passare dalla scheda.
 *
 * UN SOLO CAMPO PER NOME. Foundry legge la finestra con FormDataExtended, e
 * quando due campi hanno lo stesso nome ne fa una lista coi valori di tutti e
 * due, anche se uno è spento. Per questo le voci del PNG di M6 non portano
 * dati: la Natura parte da un campo nascosto, riempito da `datiDiCreazione`.
 */

/** I campi che la finestra può aggiungere ai dati di Actor.create, col nome che hanno per Foundry. */
export const CAMPI_CREAZIONE = Object.freeze({
  natura: `flags.${MODULE_ID}.${NEMICO_FLAG}.natura`
});

/** Cosa parte verso Actor.create, oltre a nome, tipo e cartella: la Natura, se la voce scelta ne porta una. */
export function datiDiCreazione({ natura = "" } = {}) {
  return natura ? { [CAMPI_CREAZIONE.natura]: String(natura) } : {};
}

export function registerActorCreationChoice() {
  Hooks.on("renderDialogV2", (_dialog, element) => {
    if (element.querySelector(`[data-module="${MODULE_ID}"]`)) return;

    const typeSelect = element.querySelector('select[name="type"]');
    const typeGroup = typeSelect?.closest(".form-group");
    if (!typeSelect || !typeGroup) return;

    const png = aggiungiPngDiM6(typeSelect, typeGroup);
    if (!png) return;
    const campi = campiNascosti(typeGroup);

    const aggiorna = () => {
      const natura = typeSelect.selectedOptions?.[0]?.dataset?.m6Natura ?? "";
      png.hint.hidden = !natura;
      const dati = datiDiCreazione({ natura });
      for (const [chiave, nome] of Object.entries(CAMPI_CREAZIONE)) {
        campi[chiave].disabled = !(nome in dati);
        campi[chiave].value = dati[nome] ?? "";
      }
    };

    typeSelect.addEventListener("change", aggiorna);
    aggiorna();
  });
}

/** I campi nascosti, uno per nome: spenti finché la scelta non li riempie. */
function campiNascosti(typeGroup) {
  const campi = {};
  for (const [chiave, nome] of Object.entries(CAMPI_CREAZIONE)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = nome;
    input.value = "";
    input.disabled = true;
    input.dataset.module = MODULE_ID;
    typeGroup.append(input);
    campi[chiave] = input;
  }
  return campi;
}

/**
 * Il PNG di M6 nella lista dei tipi: un gruppo in fondo, una voce per Natura.
 * Ogni voce vale `png` per Foundry; la Natura sta sulla voce (`data-m6-natura`)
 * e da lì passa al suo campo nascosto. Sotto il tipo, una riga dice con che
 * Natura nasce.
 */
function aggiungiPngDiM6(typeSelect, typeGroup) {
  if (!typeSelect.querySelector('option[value="png"]')) return null;

  const localize = game.i18n.localize.bind(game.i18n);
  const format = game.i18n.format.bind(game.i18n);

  const gruppo = document.createElement("optgroup");
  gruppo.label = localize("M6.Creation.Nemico.Gruppo");
  gruppo.dataset.module = MODULE_ID;
  for (const voce of vociCreazione({ localize, format })) {
    const option = document.createElement("option");
    option.value = "png";
    option.textContent = voce.label;
    option.dataset.m6Natura = voce.natura;
    gruppo.append(option);
  }
  typeSelect.append(gruppo);

  // Al cambio del tipo Foundry riscrive la PRIMA nota del gruppo (la sua, quella
  // del tipo scelto): se non c'è ancora gliela si lascia pronta, vuota, così la
  // nota del PNG di M6 resta la seconda e nessuno gliela cancella.
  if (!typeGroup.querySelector(".hint")) {
    const delTipo = document.createElement("p");
    delTipo.classList.add("hint");
    typeGroup.append(delTipo);
  }

  const hint = document.createElement("p");
  hint.classList.add("hint");
  hint.dataset.module = MODULE_ID;
  hint.textContent = localize("M6.Creation.Nemico.Hint");
  hint.hidden = true;
  typeGroup.append(hint);

  return { hint };
}
