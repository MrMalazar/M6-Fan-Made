/**
 * La scheda di un oggetto: una per tutti i tipi, coi campi del suo tipo.
 * È spoglia apposta: le schede vere degli oggetti arrivano alla loro tappa.
 */
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const TIPI_VANTAGGIO = Object.freeze(["background", "merit", "flaw"]);
const TIPI_ARMA = Object.freeze(["melee", "ranged", "supernatural"]);

export class SchedaOggetto extends HandlebarsApplicationMixin(ItemSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["m6w", "m6", "mage", "m6-oggetto-scheda"],
    position: { width: 520, height: 560 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  /** @override */
  static PARTS = {
    foglio: { template: "systems/m6/templates/base/oggetto.hbs", scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const oggetto = this.document;
    const system = oggetto.system;
    const dice = (chiave) => game.i18n.localize(chiave);
    const scelte = (lista, attuale, radice) => lista.map((id) => ({ id, label: dice(`${radice}.${id}`), selected: id === attuale }));
    return {
      ...base,
      oggetto,
      system,
      tipo: dice(`TYPES.Item.${oggetto.type}`),
      vantaggio: oggetto.type === "feature" ? { tipi: scelte(TIPI_VANTAGGIO, system.featuretype, "M6.Stat.Schede") } : null,
      arma: oggetto.type === "weapon" ? { tipi: scelte(TIPI_ARMA, system.weaponType, "M6.Items.WeaponTypes") } : null,
      armatura: oggetto.type === "armor",
      usi: "uses" in system ? system.uses : null,
      quantita: "quantity" in system,
      descrizione: await foundry.applications.ux.TextEditor.implementation.enrichHTML(String(system.description ?? ""), { relativeTo: oggetto })
    };
  }
}
