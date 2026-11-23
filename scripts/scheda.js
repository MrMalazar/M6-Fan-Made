/**
 * Le due schede nude: il Mago (Attributi, Abilità, il Tiro, la Salute) e il
 * PNG (le tre riserve, il Tiro, la Salute). Servono a provare le fondamenta:
 * la veste vera arriva col suo mock.
 *
 * La scheda è un selettore, come quella del modulo: il nome di un tratto è
 * il tasto che lo mette nel tiro (uno per tipo), i pallini cambiano il valore.
 * La scelta del tiro vive nella finestra e non si salva.
 */
import { ABILITA, ABILITA_MIN, ATTRIBUTI, ATTRIBUTO_MIN, CASELLE_EXTRA_MAX, CASELLE_PNG_MAX, ID, RISERVA_PNG_MAX, RISERVE_PNG } from "./costanti.js";
import { dipingi, ritocca, SEGNI } from "./salute.js";
import { SOGLIA_ABILITA_MAX, SOGLIA_MIN } from "./sistema.js";
import { cosaManca, tira } from "./tiro.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const dice = (chiave) => game.i18n.localize(chiave);
const PALLINI = 5;
const MODELLI = `systems/${ID}/templates`;

/** I pezzi comuni alle due schede: Foundry li carica insieme al foglio. */
const PARTI = Object.freeze([`${MODELLI}/parti/tratto.hbs`, `${MODELLI}/parti/tiro.hbs`, `${MODELLI}/parti/salute.hbs`]);

/** «7 dadi», «1 dado». */
function quantiDadi(numero) {
  return `${numero} ${dice(numero === 1 ? "M6.Tiro.Dado" : "M6.Tiro.Dadi")}`;
}

/** I pallini di un tratto: pieni fino al valore. */
function pallini(valore) {
  return Array.from({ length: PALLINI }, (_, indice) => ({ valore: indice + 1, pieno: indice < valore }));
}

class SchedaM6 extends HandlebarsApplicationMixin(ActorSheetV2) {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: [ID, "m6-scheda"],
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      pallino: SchedaM6.#alPallino,
      sceglie: SchedaM6.#allaScelta,
      soglia: SchedaM6.#allaSoglia,
      tira: SchedaM6.#alTira,
      segno: SchedaM6.#alSegno,
      caselle: SchedaM6.#alleCaselle
    }
  };

  /** La scelta del tiro: Attributo e Abilità, o il campo del PNG, e la soglia. */
  scelta = { attributo: "", abilita: "", campo: "", soglia: null };

  /**
   * Il riquadro del Tiro: le voci della riserva arrivano dalla scheda che lo usa.
   * Il totale sta sotto solo quando le voci sono più d'una: con una sola direbbe due volte lo stesso numero.
   */
  _quadroTiro(voci) {
    const { riserva, manca } = cosaManca(this.document, this.scelta);
    return {
      voci,
      totale: voci.length > 1,
      dadi: riserva.pronto ? quantiDadi(riserva.dadi) : "",
      soglie: Array.from({ length: SOGLIA_ABILITA_MAX - SOGLIA_MIN + 1 }, (_, indice) => {
        const valore = SOGLIA_MIN + indice;
        return { valore, scelta: this.scelta.soglia === valore };
      }),
      pronto: !manca,
      tasto: dice(manca || "M6.Tiro.Tira")
    };
  }

  /** Il riquadro della Salute: il tracciato dipinto e una riga per segno. */
  _quadroSalute() {
    const salute = this.document.system.salute;
    return {
      caselle: salute.caselle,
      celle: dipingi(salute, salute.caselle).map((stato) => ({ stato, nome: stato ? dice(`M6.Salute.Segni.${stato}`) : "" })),
      stato: salute.stato ? dice(`M6.Salute.Stati.${salute.stato}`) : "",
      righe: SEGNI.map((segno) => ({ segno, nome: dice(`M6.Salute.Segni.${segno}`), conto: salute[segno] }))
    };
  }

  /* -------------------------------------------- */
  /*  I tasti                                      */
  /* -------------------------------------------- */

  /** Un pallino: si arriva lì; il clic sul valore di adesso ne toglie uno. */
  static async #alPallino(_event, target) {
    if (!this.isEditable) return;
    const { percorso } = target.dataset;
    const adesso = Number(foundry.utils.getProperty(this.document, percorso)) || 0;
    const chiesto = Number(target.dataset.valore) || 0;
    const minimo = Number(target.dataset.minimo) || 0;
    const nuovo = Math.max(chiesto === adesso ? chiesto - 1 : chiesto, minimo);
    if (nuovo !== adesso) await this.document.update({ [percorso]: nuovo });
  }

  /** Il nome di un tratto: entra nel tiro, e al secondo clic esce. Uno per tipo. */
  static #allaScelta(_event, target) {
    const { tipo, id } = target.dataset;
    if (!(tipo in this.scelta) || tipo === "soglia") return;
    this.scelta[tipo] = this.scelta[tipo] === id ? "" : id;
    this.render();
  }

  /** La soglia: un clic la mette, un altro sullo stesso numero la toglie. */
  static #allaSoglia(_event, target) {
    const valore = Number(target.dataset.valore);
    this.scelta.soglia = this.scelta.soglia === valore ? null : valore;
    this.render();
  }

  /** Tira. La soglia si svuota a tiro fatto: il prossimo tiro chiede la sua. */
  static async #alTira(_event, target) {
    target.disabled = true;
    try {
      const esito = await tira(this.document, this.scelta);
      if (esito.manca) ui.notifications.warn(dice(esito.manca));
      else this.scelta.soglia = null;
    } finally {
      this.render();
    }
  }

  /** Un danno in più o in meno, per segno. */
  static async #alSegno(_event, target) {
    if (!this.isEditable) return;
    const salute = this.document.system.salute;
    const dopo = ritocca(salute, salute.caselle, target.dataset.segno, Number(target.dataset.passo));
    await this.document.update({ "system.salute": dopo });
  }

  /** Una casella in più o in meno: sul Mago è il ritocco a mano, sul PNG è il numero scritto. */
  static async #alleCaselle(_event, target) {
    if (!this.isEditable) return;
    const passo = Number(target.dataset.passo) || 0;
    const salute = this.document._source.system.salute;
    if (this.document.type === "png") {
      const caselle = Math.min(Math.max((Number(salute.caselle) || 1) + passo, 1), CASELLE_PNG_MAX);
      await this.document.update({ "system.salute.caselle": caselle });
      return;
    }
    const extra = Math.min(Math.max((Number(salute.extra) || 0) + passo, -CASELLE_EXTRA_MAX), CASELLE_EXTRA_MAX);
    // Sotto una casella non si scende: il meno si ferma lì.
    if (passo < 0 && this.document.system.salute.caselle <= 1) return;
    await this.document.update({ "system.salute.extra": extra });
  }
}

export class SchedaMago extends SchedaM6 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["m6-scheda--mago"],
    position: { width: 860, height: 700 }
  };

  /** @override */
  static PARTS = {
    foglio: { template: `${MODELLI}/mago.hbs`, templates: [...PARTI], scrollable: [""] }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sistema = this.document.system;
    const gruppi = (mappa, radice, chiave, tipo, minimo) => Object.entries(mappa).map(([campo, lista]) => ({
      nome: dice(`M6.Campi.${campo}`),
      righe: lista.map((id) => {
        const valore = sistema[radice][id].valore;
        return {
          id, tipo, valore, minimo,
          nome: dice(`M6.${chiave}.${id}`),
          scelto: this.scelta[tipo] === id,
          percorso: `system.${radice}.${id}.valore`,
          pallini: pallini(valore)
        };
      })
    }));
    const { attributo, abilita } = this.scelta;
    return Object.assign(context, {
      attributi: gruppi(ATTRIBUTI, "attributi", "Attributi", "attributo", ATTRIBUTO_MIN),
      abilita: gruppi(ABILITA, "abilita", "Abilita", "abilita", ABILITA_MIN),
      tiro: this._quadroTiro([
        { nome: dice(attributo ? `M6.Attributi.${attributo}` : "M6.Tiro.Attributo"), valore: attributo ? sistema.attributi[attributo]?.valore : "", scelta: Boolean(attributo) },
        { nome: dice(abilita ? `M6.Abilita.${abilita}` : "M6.Tiro.Abilita"), valore: abilita ? sistema.abilita[abilita]?.valore : "", scelta: Boolean(abilita) }
      ]),
      salute: { ...this._quadroSalute(), extra: sistema.salute.extra }
    });
  }
}

export class SchedaPng extends SchedaM6 {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["m6-scheda--png"],
    position: { width: 460, height: 640 }
  };

  /** @override */
  static PARTS = {
    foglio: { template: `${MODELLI}/png.hbs`, templates: [...PARTI], scrollable: [""] }
  };

  /**
   * I dadi di una riserva si scrivono a mano: un campo vuoto vale zero, e il numero resta nei suoi argini.
   * @override
   */
  _processFormData(event, form, formData) {
    const dati = super._processFormData(event, form, formData);
    for (const campo of RISERVE_PNG) {
      const riserva = dati.system?.riserve?.[campo];
      if (riserva && "dadi" in riserva) riserva.dadi = Math.min(Math.max(Math.trunc(Number(riserva.dadi) || 0), 0), RISERVA_PNG_MAX);
    }
    return dati;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const sistema = this.document.system;
    const { campo } = this.scelta;
    return Object.assign(context, {
      riserve: RISERVE_PNG.map((id) => ({
        id,
        nome: dice(`M6.Campi.${id}`),
        dadi: sistema.riserve[id].dadi,
        scelto: campo === id,
        percorso: `system.riserve.${id}.dadi`
      })),
      tiro: this._quadroTiro([
        { nome: dice(campo ? `M6.Campi.${campo}` : "M6.Tiro.Riserva"), valore: campo ? quantiDadi(sistema.riserve[campo]?.dadi ?? 0) : "", scelta: Boolean(campo) }
      ]),
      salute: this._quadroSalute()
    });
  }
}
