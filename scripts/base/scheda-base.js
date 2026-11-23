/**
 * La scheda di base di M6: finestra, pagine a linguette, salvataggio dei
 * campi, pallini, lucchetto e gesti sugli oggetti. Le schede vere (il Mago,
 * il PNG) la estendono e ci mettono i loro riquadri.
 *
 * Una scheda che la estende dichiara:
 *   static PARTS   i pezzi da disegnare, ognuno col suo modello
 *   this.tabs      le pagine: { id, group, title, icon, … }
 * e può riscrivere `_preparePartContext` per dare i dati a ogni pezzo.
 */
import { _onCreateItem, _onExpendItemUse, _onItemChat, _onItemDelete, _onRestoreItemUses, _onSearchItem, _onToggleLock, perGruppi } from "./oggetti.js";
import { _onDotCounterChange, _onDotCounterEmpty, accendiPallini } from "./pallini.js";
import { ABILITA, ATTRIBUTI, nomeAbilita, nomeAttributo, vociDeiTratti } from "./tratti.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const MODELLI = "systems/m6/templates/base";

/** I gruppi dei Vantaggi e dell'Inventario, nell'ordine in cui si leggono. */
export const GRUPPI_VANTAGGI = Object.freeze(["background", "merit", "flaw"]);
export const GRUPPI_INVENTARIO = Object.freeze(["armor", "weapon", "gear"]);

/** Il d10 dell'oggetto: i suoi tratti passano dal tiro della scheda. */
async function alTiroDellOggetto(event, target) {
  event?.preventDefault?.();
  const uuid = target?.closest?.("[data-item-uuid]")?.dataset?.itemUuid;
  const oggetto = this.actor.items.find((voce) => voce.uuid === uuid);
  const tiro = this.options.actions?.roll;
  if (!oggetto || typeof tiro !== "function") return;
  const percorsi = Object.values(oggetto.system?.dicepool ?? {}).map((voce) => String(voce?.path ?? "")).filter(Boolean);
  return tiro.call(this, event, { dataset: { label: oggetto.name, valuePaths: percorsi.map((percorso) => `${percorso}.value`).join(" "), selectDialog: "false" } });
}

export class SchedaAttore extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["m6w", "actor", "sheet", "mortal"],
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false, handler: SchedaAttore.onSubmitActorForm },
    actions: {
      createItem: _onCreateItem,
      itemDelete: _onItemDelete,
      itemChat: _onItemChat,
      expendItemUse: _onExpendItemUse,
      restoreItemUses: _onRestoreItemUses,
      searchItem: _onSearchItem,
      rollItem: alTiroDellOggetto,
      toggleLock: _onToggleLock,
      dotCounterChange: _onDotCounterChange,
      dotCounterEmpty: _onDotCounterEmpty
    }
  };

  /** @override Chi estende aggiunge i suoi pezzi; questo è quello per chi può solo guardare. */
  static PARTS = {
    limited: { template: `${MODELLI}/limitata.hbs` }
  };

  /** La pagina accesa di ogni gruppo. */
  tabGroups = { primary: "stats" };

  /** Le pagine della scheda: le riempie chi estende. */
  tabs = {};

  /** Un campo cambiato si salva da solo: si scrive solo quello. */
  static async onSubmitActorForm(event) {
    const campo = event?.target;
    if (!campo?.name) return null;
    let valore = campo.value;
    if (campo.tagName === "INPUT") {
      if (campo.type === "number") valore = Number.parseInt(campo.value, 10) || 0;
      else if (campo.type === "checkbox") valore = campo.checked;
    }
    return this.actor.update({ [campo.name]: valore });
  }

  /** Le pagine, con quella accesa segnata. */
  getTabs() {
    for (const pagina of Object.values(this.tabs)) {
      pagina.active = this.tabGroups[pagina.group] === pagina.id;
      pagina.cssClass = pagina.active ? "active" : "";
    }
    return this.tabs;
  }

  /** Le descrizioni degli oggetti, pronte per la pagina. */
  async prepareItems(actor) {
    const { TextEditor } = foundry.applications.ux;
    for (const oggetto of actor.items) {
      oggetto.system.enrichedDescription = await TextEditor.implementation.enrichHTML(String(oggetto.system?.description ?? ""), { relativeTo: oggetto });
    }
  }

  /** @override */
  async _prepareContext(options) {
    const base = await super._prepareContext(options);
    const actor = this.actor;
    const system = actor.system;
    const localize = game.i18n.localize.bind(game.i18n);
    await this.prepareItems(actor);
    return {
      ...base,
      actor,
      system,
      name: actor.name,
      img: actor.img,
      isOwner: actor.isOwner,
      isGM: game.user.isGM,
      locked: actor.isOwner ? Boolean(system.locked) : true,
      gamesystem: system.gamesystem,
      settings: system.settings ?? {},
      baseActorType: actor.type,
      currentActorType: actor.type,
      tabs: this.getTabs(),
      sortedAttributes: vociDeiTratti(ATTRIBUTI, system.attributes, nomeAttributo, localize),
      sortedSkills: vociDeiTratti(ABILITA, system.skills, nomeAbilita, localize)
    };
  }

  /** @override Ogni pezzo parte dal contesto comune. */
  async _preparePartContext(partId, context, options) {
    return super._preparePartContext(partId, context, options);
  }

  /** I Vantaggi per gruppo: Background, Pregi, Difetti. */
  async prepareFeaturesContext(context, actor) {
    const vantaggi = actor.items.filter((oggetto) => oggetto.type === "feature");
    const gruppi = [...GRUPPI_VANTAGGI];
    if (vantaggi.some((oggetto) => oggetto.system.featuretype === "boon")) gruppi.push("boon");
    context.features = perGruppi(vantaggi, gruppi, (oggetto) => oggetto.system.featuretype);
    return context;
  }

  /** L'Inventario per tipo: Armature, Armi, Equipaggiamento. */
  async prepareEquipmentContext(context, actor) {
    const inventario = actor.items.filter((oggetto) => GRUPPI_INVENTARIO.includes(oggetto.type));
    context.equipmentItems = perGruppi(inventario, GRUPPI_INVENTARIO, (oggetto) => oggetto.type);
    return context;
  }

  /** @override Chi può solo guardare vede il pezzo «limited», gli altri tutto il resto. */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (!options.parts) return;
    const limitata = this.document.limited;
    options.parts = options.parts.filter((parte) => (parte === "limited") === limitata);
  }

  /** @override */
  _onRender(context, options) {
    super._onRender?.(context, options);
    accendiPallini(this.element);
  }
}

// I nomi con cui le schede del modulo chiamavano la base: restano finché quelle schede non si riscrivono.
export { SchedaAttore as MortalActorSheet };
