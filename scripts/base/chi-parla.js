/**
 * Chi parla, in chat: accanto al nome il ritratto del segnalino, o della
 * scheda se sulla mappa non c'è. Vale per ogni messaggio che ha una scheda
 * dietro; gli altri restano come li fa Foundry.
 */

/** L'immagine di chi parla: il segnalino sulla scena, poi quello di serie della scheda, poi il ritratto. */
export function ritrattoDiChiParla(message) {
  const chi = message?.speaker ?? {};
  const segnalino = chi.scene && chi.token ? game.scenes?.get(chi.scene)?.tokens?.get(chi.token) : null;
  const scheda = segnalino?.actor ?? (chi.actor ? game.actors?.get(chi.actor) : null);
  if (!segnalino && !scheda) return "";
  return segnalino?.texture?.src || scheda?.prototypeToken?.texture?.src || scheda?.img || "";
}

/** A ogni disegno di un messaggio: il ritratto in testa, una volta sola. */
export function vestiChiParla(message, html) {
  const testa = html?.querySelector?.(".message-header");
  if (!testa || testa.querySelector(".m6-chi-parla")) return;
  const immagine = ritrattoDiChiParla(message);
  if (!immagine) return;
  const ritratto = document.createElement("div");
  ritratto.classList.add("m6-chi-parla");
  const img = document.createElement("img");
  img.src = immagine;
  img.alt = "";
  ritratto.append(img);
  testa.prepend(ritratto);
}
