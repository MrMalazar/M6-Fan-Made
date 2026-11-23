/**
 * Il tiro di M6 per Foundry: i dadi della riserva più i dadi speciali (i
 * rossi), e la carta che Foundry mette in chat.
 *
 *   new TiroM6("7dm + 2dp", dati, { title, flavor, difficulty, … }).roll()
 *
 * Il tiro non conta i successi: lo fa il motore delle regole, che poi
 * scrive il totale. La carta porta i pezzi che le regole vestono dopo
 * (titolo, dadi, successi, soglia, esito), ognuno con la sua classe.
 */
import { EMPTY_DICE_FACE, getMageDieImage, getParadoxDieImage } from "../dice-faces.js";
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

  /** @override La carta del tiro, coi pezzi che le regole vestono. */
  async render({ isPrivate = false } = {}) {
    if (!this._evaluated) await this.evaluate({ allowInteractive: !isPrivate });
    if (isPrivate) return '<div class="dice-roll m6-tiro"><div class="dice-result"><h4 class="dice-total">?</h4></div></div>';

    const opzioni = this.options ?? {};
    const riuscita = opzioni.mageSuccessFrom ? { successFrom: opzioni.mageSuccessFrom } : {};
    const facce = (termine, classe, immagine) => (termine?.results ?? [])
      .filter((uscito) => uscito.active !== false)
      .map((uscito) => {
        const faccia = immagine(uscito.result, riuscita);
        return `<img class="die roll-img ${classe}${faccia === EMPTY_DICE_FACE ? ` ${classe}-empty` : ""}" src="${faccia}" alt="${uscito.result}">`;
      })
      .join("");
    const dice = (chiave) => game.i18n.localize(chiave);
    const sicuro = (testo) => foundry.utils.escapeHTML(String(testo ?? ""));
    const totale = Math.trunc(Number(this.total) || 0);
    const soglia = Math.max(Math.trunc(Number(opzioni.difficulty) || 0), 0);
    const esito = soglia > 0 ? (totale >= soglia ? "success" : "failure") : "";

    return [
      '<div class="dice-roll m6-tiro">',
      `<div class="roll-label">${sicuro(opzioni.title)}</div>`,
      opzioni.flavor ? `<div class="roll-flavor">${opzioni.flavor}</div>` : "",
      '<div class="dice-result">',
      `<div class="dice-icons">${facce(this.basicDice, "mortal-dice", getMageDieImage)}${facce(this.advancedDice, "paradox-dice", getParadoxDieImage)}</div>`,
      '<div class="total-and-difficulty">',
      `<div class="roll-total"><span class="total-title">${dice("M6.RollCard.Successes")}</span><span class="total-contents">${totale}</span></div>`,
      soglia ? `<div class="roll-difficulty"><span class="difficulty-title">${dice("M6.RollCard.Threshold")}</span><span class="difficulty-contents">${soglia}</span></div>` : "",
      "</div>",
      esito ? `<div class="roll-result-label ${esito}">${dice(esito === "success" ? "M6.RollCard.Success" : "M6.RollCard.Failure")}</div>` : "",
      "</div>",
      "</div>"
    ].join("");
  }
}

/** Foundry impara a rileggere i tiri salvati. */
export function registraTiro() {
  if (!CONFIG.Dice.rolls.includes(TiroM6)) CONFIG.Dice.rolls.push(TiroM6);
}
