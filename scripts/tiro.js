/**
 * Il tiro dentro Foundry: tira la riserva, scrive il messaggio di chat e
 * veste la carta. Lo chiamano la scheda e la pagina del telefono, che
 * decidono da sé come dire a chi gioca che cosa manca.
 *
 * La regola di Blue: senza soglia inserita il tiro non parte.
 */
import { cartaTiro } from "./carta.js";
import { leggiTiro, riservaAbilita, riservaPng, sogliaValida } from "./riserva.js";

const dice = (chiave) => game.i18n.localize(chiave);

/** Con cosa si tira, a parole: «Forza + Atletica», o il campo del PNG. */
export function coppiaDelTiro({ attributo = "", abilita = "", campo = "" } = {}) {
  if (campo) return dice(`M6.Campi.${campo}`);
  return [attributo && dice(`M6.Attributi.${attributo}`), abilita && dice(`M6.Abilita.${abilita}`)].filter(Boolean).join(" + ");
}

/** Il messaggio di un tiro letto per la carta e per l'elenco: i conti, con cosa si è tirato, chi. */
export function datiCarta(message) {
  const dati = message?.system ?? {};
  return { ...leggiTiro(dati.risultati, dati.soglia), coppia: coppiaDelTiro(dati), chi: message?.alias ?? "" };
}

/** Le parole della carta, tradotte. */
export function paroleCarta() {
  return {
    successo: dice("M6.Tiro.Successo"),
    fallimento: dice("M6.Tiro.Fallimento"),
    successi: dice("M6.Tiro.Successi"),
    soglia: dice("M6.Tiro.Soglia"),
    margine: dice("M6.Tiro.Margine"),
    mancano: dice("M6.Tiro.Mancano"),
    su: dice("M6.Tiro.Su")
  };
}

/**
 * Cosa manca a un tiro per partire: la chiave di lingua della ragione, o
 * niente se può partire. La leggono anche i tasti, che spenti dicono cosa manca.
 */
export function cosaManca(actor, { attributo = "", abilita = "", campo = "", soglia = null } = {}) {
  const png = actor?.type === "png";
  const riserva = png ? riservaPng(actor?.system, campo) : riservaAbilita(actor?.system, attributo, abilita);
  if (!riserva.pronto) return { riserva, manca: png ? "M6.Tiro.MancaRiserva" : "M6.Tiro.MancaCoppia" };
  if (riserva.dadi < 1) return { riserva, manca: "M6.Tiro.ZeroDadi" };
  if (!sogliaValida(soglia)) return { riserva, manca: "M6.Tiro.MancaSoglia" };
  return { riserva, manca: "" };
}

/**
 * Tira. Torna `{ messaggio }` a tiro fatto, oppure `{ manca }` con la
 * chiave di lingua della ragione per cui non è partito.
 */
export async function tira(actor, scelta = {}) {
  if (!actor?.isOwner) return { manca: "M6.Tiro.NonTuo" };
  const { riserva, manca } = cosaManca(actor, scelta);
  if (manca) return { manca };

  const roll = await new foundry.dice.Roll(`${riserva.dadi}d10`).evaluate();
  const risultati = (roll.dice[0]?.results ?? []).map((dado) => dado.result);
  const png = actor.type === "png";
  const messaggio = await ChatMessage.create({
    type: "tiro",
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    system: {
      attributo: png ? "" : scelta.attributo,
      abilita: png ? "" : scelta.abilita,
      campo: png ? scelta.campo : "",
      soglia: Number(scelta.soglia),
      risultati
    }
  }, { messageMode: game.settings.get("core", "messageMode") });
  return { messaggio };
}

/**
 * Veste la carta: al posto del conto di Foundry mette la nostra, letta dai
 * dati del messaggio. Un tiro che chi guarda non può vedere resta com'è.
 */
export function vestiCarta(message, html) {
  if (message?.type !== "tiro" || !message.isContentVisible) return;
  const corpo = html?.querySelector?.(".message-content");
  if (!corpo) return;
  corpo.innerHTML = cartaTiro(datiCarta(message), paroleCarta());
}
