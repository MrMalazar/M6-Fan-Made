/**
 * Il pacchetto com'è su disco: il manifesto è coerente, i file che nomina
 * esistono, i tipi che dichiara sono quelli che il codice registra, e ogni
 * parola che la base chiede sta nei due file di lingua.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ID } from "../../scripts/base/costanti.js";
import { SCELTE } from "../../scripts/base/modo.js";
import { CAMPI, nomeAbilita, nomeAttributo, nomeCampo, TUTTE_ABILITA, TUTTI_ATTRIBUTI } from "../../scripts/base/tratti.js";
import { monta } from "./finta/foundry.mjs";

const radice = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const leggi = (percorso) => readFileSync(join(radice, percorso), "utf8");
const json = (percorso) => JSON.parse(leggi(percorso));
const elenco = (cartella, fine) => readdirSync(join(radice, cartella), { recursive: true }).map(String).filter((nome) => nome.endsWith(fine)).map((nome) => `${cartella}/${nome.replaceAll("\\", "/")}`);

const manifesto = json("system.json");
const pacco = json("package.json");

// Il manifesto: la sigla, il titolo di Blue, la versione uguale dappertutto.
assert.equal(manifesto.id, ID);
assert.equal(manifesto.title, "Maghi 6ª Edizione - Fan Made");
assert.match(manifesto.version, /^\d+\.\d+\.\d+$/);
assert.equal(pacco.version, manifesto.version, "package.json e system.json dicono la stessa versione");
assert.equal(json("package-lock.json").version, manifesto.version, "anche package-lock.json");
assert.equal(manifesto.manifest, "https://github.com/MrMalazar/M6-Fan-Made/releases/latest/download/system.json");
assert.equal(manifesto.download, `https://github.com/MrMalazar/M6-Fan-Made/releases/download/${manifesto.version}/m6.zip`);
assert.equal(manifesto.compatibility.minimum, "14");
assert.equal(manifesto.socket, true, "il verdetto del Narratore viaggia sul canale del sistema");

// I tipi che il sistema dichiara sono quelli che il codice registra.
monta();
const { OGGETTI } = await import("../../scripts/base/dati.js");
assert.deepEqual(Object.keys(manifesto.documentTypes.Actor), ["mago", "png"]);
assert.deepEqual(Object.keys(manifesto.documentTypes.Item), Object.keys(OGGETTI));
assert.deepEqual(Object.keys(manifesto.documentTypes.ChatMessage), ["tiro"]);

// Ogni file nominato esiste.
for (const percorso of [...manifesto.esmodules, ...manifesto.styles, ...manifesto.languages.map((lingua) => lingua.path)]) {
  assert.ok(existsSync(join(radice, percorso)), `manca ${percorso}`);
}

// I compendi: ognuno ha la sua sorgente, è del sistema, e sta nella cartella dei compendi.
assert.ok(manifesto.packs.length >= 15);
for (const pack of manifesto.packs) {
  assert.ok(existsSync(join(radice, `${pack.path}.db`)), `manca la sorgente di ${pack.name}`);
  assert.equal(pack.system, ID);
  assert.ok(["Item", "JournalEntry", "Macro"].includes(pack.type), pack.name);
}
assert.deepEqual(manifesto.packFolders[0].packs, manifesto.packs.map((pack) => pack.name));
// Gli oggetti dei compendi sono dei tipi che il sistema conosce.
for (const pack of manifesto.packs.filter((voce) => voce.type === "Item")) {
  for (const riga of leggi(`${pack.path}.db`).split("\n").filter(Boolean)) {
    const oggetto = JSON.parse(riga);
    assert.ok(oggetto.type in OGGETTI, `${pack.name}: «${oggetto.name}» è di tipo ${oggetto.type}`);
  }
}

// I fogli di stile non chiamano file che non ci sono.
for (const foglio of manifesto.styles) {
  for (const [, percorso] of leggi(foglio).matchAll(/url\("([^"]+)"\)/g)) {
    if (percorso.startsWith("data:")) continue;
    assert.ok(existsSync(resolve(radice, dirname(foglio), percorso)), `${foglio} chiama ${percorso}, che manca`);
  }
}

// I modelli e le immagini che il codice, i modelli e i compendi chiamano per intero esistono.
const script = elenco("scripts", ".js");
const modelli = elenco("templates", ".hbs");
const compendi = manifesto.packs.map((pack) => `${pack.path}.db`);
assert.ok(script.length >= 90 && modelli.length >= 80);
const testi = [...script, ...modelli, ...compendi].map((percorso) => [percorso, leggi(percorso)]);
for (const [percorso, testo] of testi) {
  for (const [, chiamato] of testo.matchAll(/systems\/m6\/((?:templates|assets|lang|styles)\/[\w./-]+\.[a-z0-9]+)/g)) {
    assert.ok(existsSync(join(radice, chiamato)), `${percorso} chiama ${chiamato}, che manca`);
  }
  // Del sistema di prima non resta niente da chiamare.
  assert.doesNotMatch(testo, /systems\/wod5e\/[\w/-]+\.(?:js|hbs)|modules\/wod5e-mage\//, `${percorso} chiama ancora il sistema di prima`);
}

// La lingua: ogni chiave che la base scrive per intero esiste, in italiano e in inglese.
const lingue = { it: json("lang/it.json"), en: json("lang/en.json") };
const parola = (lingua, chiave) => chiave.split(".").reduce((dove, pezzo) => dove?.[pezzo], lingue[lingua]);
const dellaBase = testi.filter(([percorso]) => percorso.startsWith("scripts/base/") || percorso.startsWith("templates/base/"));
const chieste = new Set();
for (const [, testo] of dellaBase) for (const [chiave] of testo.matchAll(/\bM6(?:\.[A-Za-z][\w-]*)+/g)) chieste.add(chiave);
assert.ok(chieste.size > 40);
for (const lingua of Object.keys(lingue)) {
  for (const chiave of chieste) {
    const valore = parola(lingua, chiave);
    // Una chiave che finisce su un gruppo è un prefisso: le sue voci si controllano sotto, una per una.
    assert.ok(typeof valore === "string" ? valore.length > 0 : typeof valore === "object" && valore !== null, `${lingua}: manca la parola ${chiave}`);
  }
  // Le chiavi composte a pezzi: un nome per ogni tratto, campo, scelta e tipo.
  for (const id of TUTTI_ATTRIBUTI) assert.equal(typeof parola(lingua, nomeAttributo(id)), "string", `${lingua}: manca il nome di ${id}`);
  for (const id of TUTTE_ABILITA) assert.equal(typeof parola(lingua, nomeAbilita(id)), "string", `${lingua}: manca il nome di ${id}`);
  for (const id of CAMPI) assert.equal(typeof parola(lingua, nomeCampo(id)), "string");
  for (const id of SCELTE) assert.equal(typeof parola(lingua, `M6.Base.Telefono.Scelte.${id}`), "string");
  for (const tipo of ["mago", "png"]) assert.equal(typeof lingue[lingua].TYPES.Actor[tipo], "string");
  for (const tipo of Object.keys(OGGETTI)) {
    assert.equal(typeof lingue[lingua].TYPES.Item[tipo], "string", `${lingua}: manca il nome del tipo ${tipo}`);
  }
  for (const tipo of ["armor", "weapon", "gear"]) assert.equal(typeof parola(lingua, `M6.Comuni.Inventario.${tipo}`), "string");
  assert.equal(typeof lingue[lingua].TYPES.ChatMessage.tiro, "string");
}

// I segni dei dadi sono al loro posto: quelli della carta semplice e quelli dei dadi in 3D.
for (const faccia of ["scintilla", "stellina"]) assert.ok(existsSync(join(radice, `assets/dadi/${faccia}.svg`)), `manca il segno ${faccia}`);
for (const faccia of ["vuota", "riserva-scintilla", "riserva-stellina", "rosso-occhio", "rosso-scintilla", "rosso-occhio-pieno"]) {
  assert.ok(existsSync(join(radice, `assets/icons/dice/dsn/${faccia}.png`)), `manca la faccia 3D ${faccia}`);
}

console.log("Manifesto: test passati.");
