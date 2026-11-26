/**
 * Il tiro dentro Foundry: tira la riserva, scrive il messaggio di chat e
 * veste la carta. Lo chiamano la scheda e la pagina del telefono, che
 * decidono da sé come dire a chi gioca che cosa manca.
 *
 * La regola di Blue: senza soglia inserita il tiro non parte.
 */
import { cartaTiro } from "./carta-semplice.js";
import { DALLA_PRIMA, nomeAbilita, nomeAttributo, nomeCampo } from "./tratti.js";
import { leggiTiro, riservaAbilita, riservaPng, sogliaValida } from "./riserva.js";

const dice = (chiave) => game.i18n.localize(chiave);

/** Con cosa si tira, a parole: «Forza + Atletica», o il campo del PNG. */
export function coppiaDelTiro({ attributo = "", abilita = "", campo = "" } = {}) {
  // I tiri della 0.1.0 portano le chiavi di allora: si leggono con quelle di oggi.
  if (campo) return dice(nomeCampo(DALLA_PRIMA.campi[campo] ?? campo));
  return [
    attributo && dice(nomeAttributo(DALLA_PRIMA.attributi[attributo] ?? attributo)),
    abilita && dice(nomeAbilita(DALLA_PRIMA.abilita[abilita] ?? abilita))
  ].filter(Boolean).join(" + ");
}

/** Il messaggio di un tiro letto per la carta e per l'elenco: i conti, con cosa si è tirato, chi. */
export function datiCarta(message) {
  const dati = message?.system ?? {};
  return { ...leggiTiro(dati.risultati, dati.soglia), coppia: coppiaDelTiro(dati), chi: message?.alias ?? "" };
}

/** La faccia di un dado rosso: l'occhio sull'1, l'occhio pieno sul 10, la scintilla dal 6, vuota il resto. */
export function facciaRossa(numero) {
  const valore = Math.trunc(Number(numero) || 0);
  if (valore === 1) return "occhio";
  if (valore === 10) return "occhio-pieno";
  return valore >= 6 ? "scintilla" : "vuota";
}

/** I numeri usciti da un gruppo di dadi: un dado ritirato lascia il posto a quello nuovo. */
function numeriUsciti(termini) {
  return termini.flatMap((termine) => termine.results
    .filter((uscito) => uscito?.active !== false && !uscito?.discarded)
    .map((uscito) => Math.trunc(Number(uscito.result) || 0)));
}

/**
 * Un messaggio di chat letto come tiro, qualunque strada abbia fatto: il tiro
 * semplice (tipo `tiro`) o quello della scheda, coi dadi della riserva (`dm`)
 * e i rossi (`dp`). Torna `null` se il messaggio non è un tiro di riserva
 * (un'iniziativa, un dado tirato a mano). Lo leggono l'elenco del telefono e
 * chi mette la sua interfaccia alla porta.
 */
export function tiroDelMessaggio(message) {
  if (message?.type === "tiro") return { ...datiCarta(message), rossi: [] };
  const roll = message?.rolls?.[0];
  const termini = (roll?.terms ?? []).filter((termine) => Array.isArray(termine?.results));
  const riserva = termini.filter((termine) => termine.denomination === "m");
  const rossi = termini.filter((termine) => termine.denomination === "p");
  if (!riserva.length && !rossi.length) return null;
  const usciti = numeriUsciti(riserva);
  const soglia = Math.max(Math.trunc(Number(roll.options?.difficulty) || 0), 0);
  const successi = Math.max(Math.trunc(Number(roll.total) || 0), 0);
  return {
    chi: message.alias ?? "",
    coppia: String(roll.options?.title ?? ""),
    risultati: usciti,
    facce: leggiTiro(usciti, soglia || 1).facce,
    rossi: numeriUsciti(rossi).map((numero) => ({ numero, faccia: facciaRossa(numero) })),
    successi,
    soglia,
    // Senza soglia scritta il tiro conta i successi e basta: né riuscito né fallito.
    riuscito: soglia > 0 ? successi >= soglia : null
  };
}

/** Le parole della carta, tradotte. */
export function paroleCarta() {
  return {
    successo: dice("M6.Base.Tiro.Successo"),
    fallimento: dice("M6.Base.Tiro.Fallimento"),
    successi: dice("M6.Base.Tiro.Successi"),
    soglia: dice("M6.Base.Tiro.Soglia"),
    margine: dice("M6.Base.Tiro.Margine"),
    mancano: dice("M6.Base.Tiro.Mancano"),
    su: dice("M6.Base.Tiro.Su")
  };
}

/**
 * Cosa manca a un tiro per partire: la chiave di lingua della ragione, o
 * niente se può partire. La leggono anche i tasti, che spenti dicono cosa manca.
 */
export function cosaManca(actor, { attributo = "", abilita = "", campo = "", soglia = null } = {}) {
  const png = actor?.type === "png";
  const riserva = png ? riservaPng(actor?.system, campo) : riservaAbilita(actor?.system, attributo, abilita);
  if (!riserva.pronto) return { riserva, manca: png ? "M6.Base.Tiro.MancaRiserva" : "M6.Base.Tiro.MancaCoppia" };
  if (riserva.dadi < 1) return { riserva, manca: "M6.Base.Tiro.ZeroDadi" };
  if (!sogliaValida(soglia)) return { riserva, manca: "M6.Base.Tiro.MancaSoglia" };
  return { riserva, manca: "" };
}

/**
 * Tira. Torna `{ messaggio }` a tiro fatto, oppure `{ manca }` con la
 * chiave di lingua della ragione per cui non è partito.
 */
export async function tira(actor, scelta = {}) {
  if (!actor?.isOwner) return { manca: "M6.Base.Tiro.NonTuo" };
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
