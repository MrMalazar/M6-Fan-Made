/**
 * La carta del tiro: l'HTML che va in chat e la riga che va nell'elenco del
 * telefono. Nasce dai dati del messaggio a ogni disegno, quindi una carta
 * vecchia prende la veste nuova da sola. Funzioni pure: le parole arrivano
 * già tradotte da chi chiama.
 *
 * Le regole di Blue per la chat: una riga per voce, la fascia con una parola.
 * L'ordine è quello delle carte del modulo: con cosa si tira, i dadi, il
 * conto, la fascia.
 */

const FACCE = Object.freeze(["vuota", "scintilla", "stellina"]);

/** Rende innocuo un testo che finisce dentro l'HTML. */
export function innocuo(testo) {
  return String(testo ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** I dadi usciti: un riquadro per dado, la faccia come classe, il numero al sorvolo. */
export function dadiHtml(lettura) {
  return (lettura?.risultati ?? [])
    .map((numero, indice) => {
      const faccia = FACCE.includes(lettura.facce?.[indice]) ? lettura.facce[indice] : "vuota";
      return `<span class="m6-dado m6-dado--${faccia}" title="${innocuo(numero)}"></span>`;
    })
    .join("");
}

function riga(nome, valore) {
  return `<div class="m6-carta__riga"><span>${innocuo(nome)}</span><b>${innocuo(valore)}</b></div>`;
}

/**
 * La carta in chat.
 * @param {object} dati  `coppia` (con cosa si tira) più la lettura del tiro
 * @param {object} parole  le voci tradotte: successo, fallimento, soglia, successi, margine, mancano
 */
export function cartaTiro(dati, parole) {
  const riuscito = Boolean(dati.riuscito);
  const righe = [riga(parole.successi, dati.successi), riga(parole.soglia, dati.soglia)];
  if (riuscito && dati.margine > 0) righe.push(riga(parole.margine, dati.margine));
  if (!riuscito) righe.push(riga(parole.mancano, dati.mancano));
  return `<div class="m6-carta m6-carta--${riuscito ? "successo" : "fallimento"}">`
    + `<div class="m6-carta__coppia">${innocuo(dati.coppia)}</div>`
    + `<div class="m6-carta__dadi">${dadiHtml(dati)}</div>`
    + righe.join("")
    + `<div class="m6-carta__fascia">${innocuo(riuscito ? parole.successo : parole.fallimento)}</div>`
    + "</div>";
}

/**
 * La riga dell'elenco del telefono: chi ha tirato e con cosa, i dadi, l'esito in una parola col conto.
 * @param {object} dati  `chi`, `coppia` e la lettura del tiro
 * @param {object} parole  le voci tradotte: successo, fallimento, su
 */
export function rigaTiro(dati, parole) {
  const riuscito = Boolean(dati.riuscito);
  return `<li class="m6t-riga m6t-riga--${riuscito ? "successo" : "fallimento"}">`
    + `<div class="m6t-riga__testa"><b>${innocuo(dati.chi)}</b><span>${innocuo(dati.coppia)}</span></div>`
    + `<div class="m6t-riga__dadi">${dadiHtml(dati)}</div>`
    + `<div class="m6t-riga__esito"><b>${innocuo(riuscito ? parole.successo : parole.fallimento)}</b><span>${innocuo(dati.successi)} ${innocuo(parole.su)} ${innocuo(dati.soglia)}</span></div>`
    + "</li>";
}
