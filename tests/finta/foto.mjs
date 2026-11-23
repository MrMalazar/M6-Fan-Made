/**
 * Scrive in una cartella le pagine del sistema così come escono dai modelli
 * e dal codice, per guardarle (e fotografarle) senza Foundry: le due schede,
 * le carte in chat, la pagina del telefono. Non è una prova: è un attrezzo.
 *
 *   node tests/finta/foto.mjs <cartella>
 *
 * I caratteri di Foundry qui non ci sono: la foto serve all'impianto, non
 * alla resa finale, che si guarda dentro Foundry.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FintaRoll, monta } from "./foundry.mjs";

const uscita = process.argv[2];
if (!uscita) {
  console.error("Serve la cartella dove scrivere le pagine.");
  process.exit(1);
}
mkdirSync(uscita, { recursive: true });

// Si entra da un telefono, così la pagina del telefono si disegna; le schede non dipendono dallo schermo.
const { agganci, schede, figli, messaggi } = monta({ larghezza: 390, schermo: [390, 844], tocco: true });
const { disegna, parola, personaggi, radice } = await import("./pagine.mjs");
await import("../../scripts/main.js");
agganci.once.init();
agganci.once.setup();
game.i18n.localize = parola;

const stile = ["styles/m6.css", "styles/telefono.css"].map((percorso) => readFileSync(join(radice, percorso), "utf8")).join("\n").replaceAll('url("../assets/', `url("file://${radice}/assets/`);
const pagina = (corpo, { classe = "", larghezza = "auto" } = {}) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body { background: #0c0b09; font-family: Signika, "Segoe UI", Arial, sans-serif; font-size: 14px; margin: 0; }
.finestra { display: flex; flex-direction: column; margin: 16px; }
.finestra > .window-content { display: flex; flex: 1; flex-direction: column; min-height: 0; }
.chat { display: grid; gap: 12px; margin: 16px; width: 300px; }
${stile}</style></head><body class="${classe}" style="width:${larghezza}">${corpo}</body></html>`;
const scrivi = (nome, html) => writeFileSync(join(uscita, nome), html);
const finestra = (classi, largo, alto, foglio) => `<div class="application finestra ${classi}" style="width:${largo}px;height:${alto}px"><section class="window-content">${foglio}</section></div>`;

const [SchedaMago, SchedaPng] = schede.map((scheda) => scheda.sheetClass);
const { mago, png } = await personaggi();
const { cartaTiro } = await import("../../scripts/carta.js");
const { datiCarta, paroleCarta } = await import("../../scripts/tiro.js");

// Le schede: da vuote e col tiro pronto.
{
  const scheda = new SchedaMago({ document: mago });
  const foglio = async () => disegna(SchedaMago.PARTS.foglio.template, await scheda._prepareContext({}));
  scrivi("mago-vuoto.html", pagina(finestra("m6 m6-scheda m6-scheda--mago", 860, 700, await foglio())));
  scheda.scelta = { attributo: "destrezza", abilita: "atletica", campo: "", soglia: 2 };
  scrivi("mago-pronto.html", pagina(finestra("m6 m6-scheda m6-scheda--mago", 860, 700, await foglio())));
  scrivi("mago-stretto.html", pagina(finestra("m6 m6-scheda m6-scheda--mago", 520, 900, await foglio())));
}
{
  const scheda = new SchedaPng({ document: png });
  scheda.scelta = { attributo: "", abilita: "", campo: "fisico", soglia: null };
  scrivi("png.html", pagina(finestra("m6 m6-scheda m6-scheda--png", 460, 640, disegna(SchedaPng.PARTS.foglio.template, await scheda._prepareContext({})))));
}

// Le carte in chat: riuscita col margine, fallita, tre stelline, la riserva di un PNG.
{
  const carta = (system) => cartaTiro(datiCarta({ system, alias: "" }), paroleCarta());
  scrivi("carte.html", pagina(`<div class="chat">${[
    carta({ attributo: "destrezza", abilita: "atletica", soglia: 2, risultati: [6, 7, 9, 2, 3, 1, 5] }),
    carta({ attributo: "carisma", abilita: "convincere", soglia: 3, risultati: [1, 2, 8, 4, 5, 3, 2, 1, 4, 2] }),
    carta({ attributo: "intelligenza", abilita: "velo", soglia: 5, risultati: [10, 10, 10] }),
    carta({ campo: "fisico", soglia: 2, risultati: [6, 9, 1, 2, 4] })
  ].join("")}</div>`));
}

// La pagina del telefono: prima di scegliere, col tiro pronto e con l'elenco pieno.
{
  const attori = [mago, png];
  game.actors = Object.assign(attori, { get: (id) => attori.find((actor) => actor.id === id) });
  game.user.character = mago;
  agganci.once.ready();
  const nodo = figli[0];
  const intera = () => `<div id="m6-telefono">${nodo.innerHTML.replace(/data-m6t-zona="(\w+)">/g, (tutto, nome) => `${tutto}${nodo.zone.get(nome)?.innerHTML ?? ""}`)}</div>`;
  scrivi("telefono-vuoto.html", pagina(intera(), { classe: "m6-telefono" }));

  const cambia = (dataset, value) => nodo.ascolti.change({ target: { closest: () => ({ dataset, value }) } });
  const tocca = (dataset) => nodo.ascolti.click({ target: { closest: () => ({ dataset, disabled: false }) } });
  for (const [tiro, usciti] of [[{ attributo: "forza", abilita: "mischia", soglia: 3 }, [2, 6]], [{ attributo: "destrezza", abilita: "atletica", soglia: 2 }, [1, 2, 3, 4, 5, 7, 9]], [{ attributo: "intelligenza", abilita: "velo", soglia: 4 }, [10, 10, 6]]]) {
    cambia({ m6t: "sceglie", tipo: "attributo" }, tiro.attributo);
    cambia({ m6t: "sceglie", tipo: "abilita" }, tiro.abilita);
    await tocca({ m6t: "soglia", valore: String(tiro.soglia) });
    FintaRoll.prossimi = usciti;
    await tocca({ m6t: "tira" });
  }
  await tocca({ m6t: "soglia", valore: "4" });
  scrivi("telefono-pronto.html", pagina(intera(), { classe: "m6-telefono" }));
  console.log(`Tiri nell'elenco: ${messaggi.length}.`);
}
console.log(`Pagine scritte in ${uscita}.`);
