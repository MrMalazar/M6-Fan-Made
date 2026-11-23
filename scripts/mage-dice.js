import { MODULE_ID } from "./constants.js";
import {
  EMPTY_DICE_FACE,
  getMageDieImage,
  getParadoxDieImage
} from "./dice-faces.js";
import { resolveSuccessFrom, SUCCESS_FROM } from "./ramo-c.js";
import { ROLL_CARD_FLAG } from "./roll-card.js";

export { getMageDieImage } from "./dice-faces.js";

/** Il Mago: lo dice il tipo della scheda. */
export function isMageActor(actor) {
  return actor?.type === "mago";
}

/** Il nemico (27/9): la scheda di tipo PNG. Tira coi dadi di M6, ma non ha i tasti del Mago. */
export function isNemicoActor(actor) {
  return actor?.type === "png";
}

/**
 * Usa uno SVG trasparente per le facce vuote. Il CSS continua a disegnare il
 * quadrato, mentre un src valido impedisce al browser di mostrare l'icona rotta.
 */
function applyDieFace(die, image, emptyClass) {
  const isEmpty = image === EMPTY_DICE_FACE;
  die.classList[isEmpty ? "add" : "remove"](emptyClass);
  die.src = image;
}

export function applyMageDiceClass(message, html) {
  const actor = message?.speakerActor;
  if (!(isMageActor(actor) || isNemicoActor(actor)) || !html?.querySelectorAll) return 0;

  const basicDice = html.querySelectorAll(".roll-img.mortal-dice, .roll-img.vampire-dice, .roll-img.hunter-dice, .roll-img.werewolf-dice");
  const messageRoll = message?.rolls?.[0];
  const basicResults = messageRoll?.basicDice?.results ?? [];
  const card = message.getFlag?.(MODULE_ID, ROLL_CARD_FLAG) ?? {};
  const successFrom = resolveSuccessFrom({
    successFrom: card.successFrom ?? messageRoll?.options?.mageSuccessFrom,
    advancedDifficulty: card.advancedDifficulty
  }, SUCCESS_FROM);

  basicDice.forEach((die, index) => {
    die.classList.remove("mortal-dice", "vampire-dice", "hunter-dice", "werewolf-dice");
    die.classList.add("mage-dice");

    // WoD5e mantiene lo stesso ordine tra risultati e dadi mostrati in chat.
    const result = basicResults[index]?.result;
    if (result !== undefined) {
      applyDieFace(die, getMageDieImage(result, { successFrom }), "mage-dice-empty");
    }
  });

  const paradoxDice = html.querySelectorAll(".roll-img.paradox-dice");
  const paradoxResults = message?.rolls?.[0]?.advancedDice?.results ?? [];

  // I rossi a parte (29/9) non contano per la riuscita, ma la scintilla resta (30/9): segna il successo paradossale.
  paradoxDice.forEach((die, index) => {
    const result = paradoxResults[index]?.result;
    if (result !== undefined) {
      applyDieFace(die, getParadoxDieImage(result, { successFrom }), "paradox-dice-empty");
    }
  });

  return basicDice.length + paradoxDice.length;
}

export function registerMageDiceRendering() {
  Hooks.on("renderChatMessageHTML", applyMageDiceClass);
}
