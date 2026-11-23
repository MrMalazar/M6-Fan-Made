/**
 * L'ingresso dal telefono. Chi entra da uno schermo stretto arriva dallo
 * stesso indirizzo e con lo stesso utente di sempre: il sistema spegne la
 * mappa, nasconde l'interfaccia di Foundry e mette al suo posto una pagina
 * sola, col tiro e l'elenco dei tiri di tutti.
 *
 * In questa tappa la pagina è nuda e serve a provare che la strada regge;
 * l'interfaccia dell'app arriva in una tappa sua.
 *
 * Come si spegne la mappa senza ricaricare: l'impostazione di Foundry
 * «core.noCanvas» sta nel browser e si scrive subito; la mappa la legge
 * dopo l'aggancio `setup`, quindi basta scriverla lì.
 */
import { innocuo, rigaTiro } from "./carta-semplice.js";
import { ID } from "./costanti.js";
import { modoTelefono, mossaMappa } from "./modo.js";
import { SOGLIA_ABILITA_MAX, SOGLIA_MIN } from "../sistema.js";
import { cosaManca, datiCarta, paroleCarta, tira } from "./tiro-semplice.js";
import { ABILITA, ATTRIBUTI, CAMPI, nomeAbilita, nomeAttributo, nomeCampo } from "./tratti.js";

/** Il Foundry intero chiesto per questa visita: dura finché la scheda del browser resta aperta. */
const CHIAVE_INTERO = `${ID}.intero`;

/** Quanti tiri tiene l'elenco. */
const TIRI_MAX = 30;

const dice = (chiave) => game.i18n.localize(chiave);

const stato = {
  attivo: false,      // la pagina del telefono è accesa
  sarebbe: false,     // lo sarebbe, se non si fosse chiesto il Foundry intero
  attore: "",
  scelta: { attributo: "", abilita: "", campo: "", soglia: null },
  avviso: "",
  inCorso: false,
  persa: false
};

let radice = null;

function interoChiesto() {
  try {
    return window.sessionStorage.getItem(CHIAVE_INTERO) === "1";
  } catch {
    return false;
  }
}

function chiediIntero(acceso) {
  try {
    if (acceso) window.sessionStorage.setItem(CHIAVE_INTERO, "1");
    else window.sessionStorage.removeItem(CHIAVE_INTERO);
  } catch {
    // Senza memoria di sessione la scelta non si tiene: si ricarica e basta.
  }
  window.location.reload();
}

/* -------------------------------------------- */
/*  I tre momenti: init, setup, ready            */
/* -------------------------------------------- */

/** A `init`: le impostazioni, e la scelta fra telefono e Foundry intero. */
export function registraTelefono() {
  game.settings.register(ID, "telefono", {
    name: "M6.Base.Telefono.Nome",
    hint: "M6.Base.Telefono.Aiuto",
    scope: "client",
    config: true,
    type: String,
    choices: {
      auto: "M6.Base.Telefono.Scelte.auto",
      sempre: "M6.Base.Telefono.Scelte.sempre",
      mai: "M6.Base.Telefono.Scelte.mai"
    },
    default: "auto",
    requiresReload: true
  });
  // Segna che la mappa l'abbiamo spenta noi, per riaccenderla quando non serve più.
  game.settings.register(ID, "mappaSpenta", { scope: "client", config: false, type: Boolean, default: false });

  const quadro = {
    scelta: game.settings.get(ID, "telefono"),
    finestra: window.innerWidth,
    schermo: [window.screen?.width, window.screen?.height],
    tocco: Boolean(window.matchMedia?.("(pointer: coarse)").matches)
  };
  stato.sarebbe = modoTelefono(quadro);
  stato.attivo = modoTelefono({ ...quadro, intero: interoChiesto() });
  if (!stato.attivo) return;

  // Subito, prima che Foundry disegni la sua interfaccia: la pagina copre tutto. A questo punto le
  // traduzioni non sono ancora caricate, quindi l'attesa è un segno e non una parola.
  document.body.classList.add("m6-telefono");
  radice = document.createElement("div");
  radice.id = "m6-telefono";
  radice.innerHTML = `<p class="m6t-carico" aria-busy="true"><span class="m6-dado m6-dado--stellina"></span></p>`;
  document.body.append(radice);
}

/** A `setup`: la mappa si spegne sul telefono e si riaccende dove l'avevamo spenta noi. */
export function telefonoAlSetup() {
  const mossa = mossaMappa({
    telefono: stato.attivo,
    spenta: Boolean(game.settings.get("core", "noCanvas")),
    nostra: Boolean(game.settings.get(ID, "mappaSpenta"))
  });
  if ("spenta" in mossa) game.settings.set("core", "noCanvas", mossa.spenta);
  if ("nostra" in mossa) game.settings.set(ID, "mappaSpenta", mossa.nostra);
}

/** A `ready`: la pagina vera, e gli agganci che la tengono aggiornata. */
export function telefonoAlPronto() {
  if (!stato.attivo) {
    if (stato.sarebbe) tastoRitorno();
    return;
  }
  stato.attore = attori().find((actor) => actor.id === game.user.character?.id)?.id ?? attori()[0]?.id ?? "";
  radice.innerHTML = `<div class="m6t-stato" data-m6t-zona="stato"></div>`
    + `<section class="m6t-blocco" data-m6t-zona="tiro"></section>`
    + `<section class="m6t-blocco"><h2 class="m6t-titolo">${innocuo(dice("M6.Base.Titoli.Tiri"))}</h2><ul class="m6t-tiri" data-m6t-zona="tiri"></ul></section>`
    + `<footer class="m6t-piede"><button type="button" data-m6t="intero">${innocuo(dice("M6.Base.Telefono.Intero"))}</button><button type="button" data-m6t="esci">${innocuo(dice("M6.Base.Telefono.Esci"))}</button></footer>`;
  radice.addEventListener("click", alClic);
  radice.addEventListener("change", alCambio);
  disegnaTiro();
  disegnaTiri();

  for (const aggancio of ["createChatMessage", "updateChatMessage", "deleteChatMessage"]) Hooks.on(aggancio, disegnaTiri);
  for (const aggancio of ["createActor", "updateActor", "deleteActor", "updateUser"]) Hooks.on(aggancio, disegnaTiro);

  // Il telefono si addormenta e perde il filo: al ritorno si ricarica, così l'elenco non resta indietro.
  game.socket?.on("disconnect", () => {
    stato.persa = true;
    disegnaStato();
  });
  game.socket?.io?.on("reconnect", () => window.location.reload());
}

/** Dove si è chiesto il Foundry intero da un telefono, un tasto riporta alla pagina. */
function tastoRitorno() {
  const tasto = document.createElement("button");
  tasto.type = "button";
  tasto.id = "m6-ritorno";
  tasto.textContent = dice("M6.Base.Telefono.Ritorno");
  tasto.addEventListener("click", () => chiediIntero(false));
  document.body.append(tasto);
}

/* -------------------------------------------- */
/*  I dati                                       */
/* -------------------------------------------- */

/** Le schede che chi è entrato può tirare: prima i Maghi, poi i PNG, per nome. */
function attori() {
  return game.actors
    .filter((actor) => actor.isOwner && (actor.type === "mago" || actor.type === "png"))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, game.i18n.lang) : a.type === "mago" ? -1 : 1));
}

function attore() {
  return game.actors.get(stato.attore) ?? null;
}

/** I tiri che chi guarda può vedere, dal più recente. */
function tiri() {
  return game.messages.contents
    .filter((message) => message.type === "tiro" && message.visible && message.isContentVisible)
    .slice(-TIRI_MAX)
    .reverse();
}

/* -------------------------------------------- */
/*  Il disegno                                   */
/* -------------------------------------------- */

function zona(nome) {
  return radice?.querySelector(`[data-m6t-zona="${nome}"]`) ?? null;
}

function opzione(valore, nome, scelto) {
  return `<option value="${innocuo(valore)}"${scelto ? " selected" : ""}>${innocuo(nome)}</option>`;
}

/** Una tendina coi tratti divisi per campo. */
function tendina(tipo, mappa, nome, titolo) {
  const gruppi = Object.entries(mappa)
    .map(([campo, lista]) => `<optgroup label="${innocuo(dice(nomeCampo(campo)))}">${lista.map((id) => opzione(id, dice(nome(id)), stato.scelta[tipo] === id)).join("")}</optgroup>`)
    .join("");
  return `<label class="m6t-campo"><span>${innocuo(titolo)}</span><select data-m6t="sceglie" data-tipo="${tipo}">${opzione("", dice("M6.Base.Telefono.Scegli"), !stato.scelta[tipo])}${gruppi}</select></label>`;
}

function disegnaStato() {
  const posto = zona("stato");
  if (!posto) return;
  posto.innerHTML = stato.persa
    ? `<p class="m6t-persa"><span>${innocuo(dice("M6.Base.Telefono.Persa"))}</span><button type="button" data-m6t="ricarica">${innocuo(dice("M6.Base.Telefono.Ricarica"))}</button></p>`
    : "";
}

function disegnaTiro() {
  const posto = zona("tiro");
  if (!posto) return;
  const lista = attori();
  if (!lista.some((actor) => actor.id === stato.attore)) stato.attore = lista[0]?.id ?? "";
  const actor = attore();
  if (!actor) {
    posto.innerHTML = `<p class="m6t-vuoto">${innocuo(dice("M6.Base.Telefono.NessunaScheda"))}</p>`;
    return;
  }

  const chi = lista.length > 1
    ? `<select class="m6t-chi" data-m6t="attore" aria-label="${innocuo(dice("M6.Base.Telefono.Scheda"))}">${lista.map((voce) => opzione(voce.id, voce.name, voce.id === actor.id)).join("")}</select>`
    : `<h1 class="m6t-chi">${innocuo(actor.name)}</h1>`;

  const campi = actor.type === "png"
    ? `<label class="m6t-campo"><span>${innocuo(dice("M6.Base.Tiro.Riserva"))}</span><select data-m6t="sceglie" data-tipo="campo">${opzione("", dice("M6.Base.Telefono.Scegli"), !stato.scelta.campo)}${CAMPI.map((id) => opzione(id, dice(nomeCampo(id)), stato.scelta.campo === id)).join("")}</select></label>`
    : tendina("attributo", ATTRIBUTI, nomeAttributo, dice("M6.Base.Tiro.Attributo")) + tendina("abilita", ABILITA, nomeAbilita, dice("M6.Base.Tiro.Abilita"));

  const { riserva, manca } = cosaManca(actor, stato.scelta);
  const dadi = riserva.pronto ? `${riserva.dadi} ${dice(riserva.dadi === 1 ? "M6.Base.Tiro.Dado" : "M6.Base.Tiro.Dadi")}` : "";
  const soglie = Array.from({ length: SOGLIA_ABILITA_MAX - SOGLIA_MIN + 1 }, (_, indice) => {
    const valore = SOGLIA_MIN + indice;
    const scelta = stato.scelta.soglia === valore;
    return `<button type="button" class="m6t-soglia${scelta ? " scelta" : ""}" data-m6t="soglia" data-valore="${valore}" aria-pressed="${scelta}">${valore}</button>`;
  }).join("");
  const spento = Boolean(manca) || stato.inCorso;

  posto.innerHTML = chi
    + campi
    + `<div class="m6t-campo"><span>${innocuo(dice("M6.Base.Tiro.Riserva"))}</span><b class="m6t-dadi">${innocuo(dadi)}</b></div>`
    + `<div class="m6t-campo m6t-campo--soglia"><span>${innocuo(dice("M6.Base.Tiro.Soglia"))}</span><div class="m6t-soglie" role="group" aria-label="${innocuo(dice("M6.Base.Tiro.Soglia"))}">${soglie}</div></div>`
    + `<button type="button" class="m6t-tira" data-m6t="tira"${spento ? " disabled" : ""}>${innocuo(dice(manca || "M6.Base.Tiro.Tira"))}</button>`
    + (stato.avviso ? `<p class="m6t-avviso">${innocuo(stato.avviso)}</p>` : "");
}

function disegnaTiri() {
  const posto = zona("tiri");
  if (!posto) return;
  const parole = paroleCarta();
  const righe = tiri().map((message) => rigaTiro(datiCarta(message), parole)).join("");
  posto.innerHTML = righe || `<li class="m6t-vuoto">${innocuo(dice("M6.Base.Telefono.NessunTiro"))}</li>`;
}

/* -------------------------------------------- */
/*  I gesti                                      */
/* -------------------------------------------- */

function alCambio(event) {
  const campo = event.target.closest?.("select[data-m6t]");
  if (!campo) return;
  stato.avviso = "";
  if (campo.dataset.m6t === "attore") {
    stato.attore = campo.value;
    stato.scelta = { attributo: "", abilita: "", campo: "", soglia: null };
  } else if (campo.dataset.m6t === "sceglie" && campo.dataset.tipo in stato.scelta) {
    stato.scelta[campo.dataset.tipo] = campo.value;
  }
  disegnaTiro();
}

async function alClic(event) {
  const tasto = event.target.closest?.("button[data-m6t]");
  if (!tasto || tasto.disabled) return;
  switch (tasto.dataset.m6t) {
    case "soglia": {
      const valore = Number(tasto.dataset.valore);
      stato.scelta.soglia = stato.scelta.soglia === valore ? null : valore;
      stato.avviso = "";
      disegnaTiro();
      break;
    }
    case "tira":
      await alTira();
      break;
    case "intero":
      chiediIntero(true);
      break;
    case "ricarica":
      window.location.reload();
      break;
    case "esci":
      game.logOut();
      break;
  }
}

/** Tira dalla pagina. La soglia si svuota a tiro fatto: il prossimo tiro chiede la sua. */
async function alTira() {
  const actor = attore();
  if (!actor || stato.inCorso) return;
  stato.inCorso = true;
  stato.avviso = "";
  disegnaTiro();
  try {
    const esito = await tira(actor, stato.scelta);
    if (esito.manca) stato.avviso = dice(esito.manca);
    else stato.scelta.soglia = null;
  } catch (errore) {
    console.error(`${ID} | Il tiro dal telefono non è partito.`, errore);
    stato.avviso = dice("M6.Base.Telefono.TiroFallito");
  } finally {
    stato.inCorso = false;
    disegnaTiro();
  }
}
