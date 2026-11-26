/**
 * La scheda di un oggetto: una per tutti i tipi. I campi di ogni tipo stanno
 * nella tavola di `campi-oggetto.js`, la scheda li disegna e li salva. Le
 * Condizioni hanno in più i modificatori ai tiri.
 */
import { CON_MODIFICATORI, modificatoreNuovo, modificatoriDalModulo, modificatoriPerLaScheda, valoriDeiCampi } from "./campi-oggetto.js";
import { accendiPallini } from "./pallini.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class SchedaOggetto extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["m6w", "m6", "mage", "m6-oggetto-scheda"],
    position: { width: 520, height: 560 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      pallino: SchedaOggetto.#suPallino,
      pallinoVuoto: SchedaOggetto.#suPallinoVuoto,
      modificatoreNuovo: SchedaOggetto.#suModificatoreNuovo,
      modificatoreTogli: SchedaOggetto.#suModificatoreTogli
    }
  };

  /** @override */
  static PARTS = {
    foglio: { template: "systems/m6/templates/base/oggetto.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const oggetto = this.document;
    const dice = (chiave) => game.i18n.localize(chiave);
    const conModificatori = CON_MODIFICATORI.includes(oggetto.type);
    return {
      ...base,
      oggetto,
      system: oggetto.system,
      tipo: dice(`TYPES.Item.${oggetto.type}`),
      gruppo: String(oggetto.flags?.m6?.archivio?.group ?? ""),
      campi: valoriDeiCampi(oggetto, dice),
      conModificatori,
      modificatori: conModificatori ? modificatoriPerLaScheda(oggetto.system.bonuses, dice) : [],
      scrivibile: this.isEditable,
      descrizione: await foundry.applications.ux.TextEditor.implementation.enrichHTML(String(oggetto.system.description ?? ""), { relativeTo: oggetto })
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    accendiPallini(this.element);
  }

  /**
   * I modificatori nel modulo stanno sotto `modificatori.<n>`: qui tornano la
   * lista che il documento salva, tenendo di ognuno le parti che la scheda
   * non mostra.
   * @override
   */
  _processFormData(event, form, formData) {
    const dati = super._processFormData(event, form, formData);
    const righe = dati.modificatori;
    delete dati.modificatori;
    if (righe && CON_MODIFICATORI.includes(this.document.type)) {
      dati.system = { ...(dati.system ?? {}), bonuses: modificatoriDalModulo(righe, this.document.system.bonuses, this.document.name) };
    }
    return dati;
  }

  static async #suPallino(event, target) {
    event.preventDefault();
    const nome = target.closest(".resource-value")?.dataset.name;
    if (!nome || !this.isEditable) return;
    await this.document.update({ [nome]: Math.trunc(Number(target.dataset.index) || 0) + 1 });
  }

  static async #suPallinoVuoto(event, target) {
    event.preventDefault();
    const nome = target.closest(".resource-value")?.dataset.name;
    if (!nome || !this.isEditable) return;
    await this.document.update({ [nome]: 0 });
  }

  static async #suModificatoreNuovo(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const lista = [...(this.document.system.bonuses ?? []), modificatoreNuovo(this.document.name)];
    await this.document.update({ "system.bonuses": lista });
  }

  static async #suModificatoreTogli(event, target) {
    event.preventDefault();
    if (!this.isEditable) return;
    const indice = Math.trunc(Number(target.dataset.indice));
    const lista = (this.document.system.bonuses ?? []).filter((_, posto) => posto !== indice);
    await this.document.update({ "system.bonuses": lista });
  }
}
