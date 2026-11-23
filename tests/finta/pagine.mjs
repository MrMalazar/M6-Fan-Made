/**
 * I modelli delle schede disegnati fuori da Foundry: Handlebars vero, le
 * parole del file di lingua, i pezzi comuni registrati col loro percorso
 * come fa Foundry. Serve alle prove e alle foto.
 */
import Handlebars from "handlebars";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const lingua = JSON.parse(readFileSync(join(radice, "lang/it.json"), "utf8"));

/** La parola di una chiave; se manca torna la chiave, come fa Foundry. */
export function parola(chiave) {
  const valore = String(chiave).split(".").reduce((dove, pezzo) => dove?.[pezzo], lingua);
  return typeof valore === "string" ? valore : String(chiave);
}

const motore = Handlebars.create();
motore.registerHelper("localize", (chiave) => parola(chiave));
for (const nome of ["tratto", "tiro", "salute"]) {
  const percorso = `templates/parti/${nome}.hbs`;
  motore.registerPartial(`systems/m6/${percorso}`, readFileSync(join(radice, percorso), "utf8"));
}

/** Disegna un modello del sistema («systems/m6/templates/mago.hbs») col suo contesto. */
export function disegna(modello, contesto) {
  const percorso = modello.replace(/^systems\/m6\//, "");
  return motore.compile(readFileSync(join(radice, percorso), "utf8"))(contesto);
}

/**
 * Conta gli elementi alla radice di un pezzo di HTML: Foundry vuole che ogni
 * parte di una finestra ne disegni uno solo. Lancia se i tag non si chiudono.
 */
export function radici(html) {
  const vuoti = new Set(["img", "input", "br", "hr"]);
  const pila = [];
  let quante = 0;
  for (const [, chiude, tag] of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b[^>]*>/g)) {
    if (vuoti.has(tag)) {
      if (!pila.length) quante += 1;
      continue;
    }
    if (chiude) {
      const aperto = pila.pop();
      if (aperto !== tag) throw new Error(`si chiude </${tag}> ma era aperto <${aperto}>`);
    } else {
      if (!pila.length) quante += 1;
      pila.push(tag);
    }
  }
  if (pila.length) throw new Error(`restano aperti: ${pila.join(", ")}`);
  return quante;
}

/** Un Mago e un PNG di prova, coi conti di Foundry già fatti. */
export async function personaggi() {
  const { MagoData, PngData } = await import("../../scripts/dati.js");
  const { TUTTE_ABILITA, TUTTI_ATTRIBUTI } = await import("../../scripts/costanti.js");
  const aggiornamenti = [];
  const documento = (dati) => Object.assign(dati, {
    isOwner: true,
    _source: { system: structuredClone(dati.system) },
    update: async (cambi) => { aggiornamenti.push({ id: dati.id, cambi }); return dati; }
  });

  const sistemaMago = Object.assign(new MagoData(), {
    attributi: Object.fromEntries(TUTTI_ATTRIBUTI.map((id) => [id, { valore: 2 }])),
    abilita: Object.fromEntries(TUTTE_ABILITA.map((id) => [id, { valore: 0 }])),
    salute: { ps: 1, pa: 1, ms: 2, ma: 0, extra: 0 }
  });
  Object.assign(sistemaMago.attributi, { destrezza: { valore: 4 }, costituzione: { valore: 3 }, fermezza: { valore: 2 } });
  Object.assign(sistemaMago.abilita, { atletica: { valore: 3 }, velo: { valore: 1 }, convincere: { valore: 5 } });
  sistemaMago.prepareDerivedData();

  const sistemaPng = Object.assign(new PngData(), {
    riserve: { fisico: { dadi: 5 }, sociale: { dadi: 2 }, mentale: { dadi: 0 } },
    salute: { ps: 0, pa: 2, ms: 0, ma: 1, caselle: 5 }
  });
  sistemaPng.prepareDerivedData();

  return {
    aggiornamenti,
    mago: documento({ id: "a1", name: "Marco", type: "mago", img: "icons/svg/mystery-man.svg", system: sistemaMago }),
    png: documento({ id: "a2", name: "Soldato del Recupero", type: "png", img: "icons/svg/mystery-man.svg", system: sistemaPng })
  };
}
