import { tira as tiroSemplice } from "./base/tiro-semplice.js";
import { emptyTiro, pickAttribute, pickSkill, setSoglia } from "./tiro.js";

/**
 * Il tiro dalla porta del telefono. La pagina manda una scelta corta
 * (Attributo, Abilità, soglia): qui diventa il tiro della scheda, con le
 * Condizioni, il verdetto del Narratore e la carta intera, così un tiro fatto
 * dal telefono vale quanto uno fatto dalla scheda. Il PNG tira la sua riserva
 * secca, come prima.
 */

/** La scelta della pagina nella forma che il tiro della scheda conosce. */
export function tiroDallaScelta({ attributo = "", abilita = "", soglia = null } = {}) {
  const coppia = pickSkill(pickAttribute(emptyTiro(), attributo), abilita ? `skill:${abilita}` : "");
  return setSoglia(coppia, soglia);
}

/**
 * Tira per un attore. Gli avvisi che il tiro dà strada facendo (il tiro
 * mandato al Narratore, una Condizione che lo fa fallire) sul telefono non si
 * vedrebbero, perché l'interfaccia di Foundry è nascosta: passano da `avvisa`,
 * e l'ultimo torna nell'esito se il tiro non parte.
 */
export async function tiraDalTelefono(actor, scelta = {}, { avvisa = null } = {}) {
  if (actor?.type !== "mago") return tiroSemplice(actor, scelta);
  const voci = ui.notifications;
  const veri = { warn: voci.warn, info: voci.info };
  let ultimo = "";
  const ascolta = (nome) => function (testo, ...resto) {
    ultimo = String(testo ?? "");
    avvisa?.(ultimo);
    return veri[nome].call(this, testo, ...resto);
  };
  voci.warn = ascolta("warn");
  voci.info = ascolta("info");
  try {
    const { launchTiro } = await import("./tiro-scheda.js");
    const messaggio = await launchTiro(actor, tiroDallaScelta(scelta));
    return messaggio ? { messaggio } : { avviso: ultimo };
  } finally {
    voci.warn = veri.warn;
    voci.info = veri.info;
  }
}
