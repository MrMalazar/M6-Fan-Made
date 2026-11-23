/**
 * Il tiro di M6 per Foundry: i dadi della riserva più i dadi speciali (i
 * rossi), e la carta che Foundry mette in chat.
 *
 *   new TiroM6("7dm + 2dp", dati, { title, flavor, difficulty, … }).roll()
 *
 * Il tiro non conta i successi: lo fa il motore delle regole, che poi
 * scrive il totale. La carta porta i pezzi che le regole vestono dopo
 * (titolo, dadi, testo, successi, soglia, esito), ognuno con la sua classe.
 */
import { getMageDieImage, getParadoxDieImage } from "../dice-faces.js";
import { DadoRiserva } from "./dadi.js";

const { Die } = foundry.dice.terms;

export class TiroM6 extends foundry.dice.Roll {
  /** I dadi della riserva. */
  get basicDice() {
    return this.terms.find((termine) => termine instanceof DadoRiserva) ?? null;
  }

  /** I dadi speciali: ogni altro dado della formula. */
  get advancedDice() {
    return this.terms.find((termine) => termine instanceof Die && !(termine instanceof DadoRiserva)) ?? null;
  }

  /**
   * @override La carta del tiro, coi pezzi che le regole vestono dopo:
   *
   *   .roll-label                il titolo (le regole ci mettono i tratti in tiro)
   *   .dice-icons > img.die      una faccia per dado, con `data-index` (la Volontà sceglie da lì)
   *   .collapsible-content       il testo che il tiro porta con sé (i Dettagli, le note)
   *   .dice-tooltip              la formula e i numeri usciti, a scomparsa (la apre Foundry al clic)
   *   .total-and-difficulty      i successi e la soglia
   *   .roll-result-label         l'esito, in una parola
   */
  async render({ isPrivate = false } = {}) {
    if (!this._evaluated) await this.evaluate({ allowInteractive: !isPrivate });
    if (isPrivate) return '<div class="dice-roll"><div class="dice-result"><h4 class="dice-total">?</h4></div></div>';

    const opzioni = this.options ?? {};
    const riuscita = opzioni.mageSuccessFrom ? { successFrom: opzioni.mageSuccessFrom } : {};
    const facce = (termine, classi, immagine) => (termine?.results ?? [])
      .map((uscito, indice) => {
        const faccia = immagine(uscito.result, riuscita);
        return `<img src="${faccia}" class="die roll-img ${classi.join(" ")}" data-index="${indice}" alt="" title="">`;
      })
      .join("");
    const dice = (chiave) => game.i18n.localize(chiave);
    const sicuro = (testo) => foundry.utils.escapeHTML(String(testo ?? ""));
    const totale = Math.trunc(Number(this.total) || 0);
    const soglia = Math.max(Math.trunc(Number(opzioni.difficulty) || 0), 0);
    const esito = soglia > 0 ? (totale >= soglia ? "success" : "failure") : "";

    return [
      '<div class="collapsible-container">',
      `<p class="roll-label uppercase collapsible">${sicuro(opzioni.title)}</p>`,
      '<div class="dice-roll" data-action="expandRoll">',
      '<div class="modifiers"></div>',
      '<div class="dice-result">',
      `<div class="dice-icons">${facce(this.basicDice, ["rerollable", "mortal-dice"], getMageDieImage)}${facce(this.advancedDice, ["paradox-dice"], getParadoxDieImage)}</div>`,
      `<div class="collapsible-content" style="max-height: unset;">${opzioni.flavor ? `<hr>${opzioni.flavor}` : ""}</div>`,
      "<hr>",
      await this.getTooltip(),
      '<div class="total-and-difficulty">',
      `<div class="roll-total"><span class="total-title">${dice("M6.RollCard.Successes")}</span> <span class="total-contents">${totale}</span></div>`,
      soglia ? `<div class="roll-difficulty"><span class="difficulty-title">${dice("M6.RollCard.Threshold")}</span> <span class="difficulty-contents">${soglia}</span></div>` : "",
      "</div>",
      esito ? `<div class="roll-result-label ${esito}">${dice(esito === "success" ? "M6.RollCard.Success" : "M6.RollCard.Failure")}</div>` : "",
      "</div>",
      "</div>",
      "</div>"
    ].join("");
  }
}

/** Foundry impara a rileggere i tiri salvati. */
export function registraTiro() {
  if (!CONFIG.Dice.rolls.includes(TiroM6)) CONFIG.Dice.rolls.push(TiroM6);
}
